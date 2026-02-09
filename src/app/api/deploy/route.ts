import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getToken } from '@/lib/tokens'

interface FileData {
  path: string
  content: string
}

interface DeployRequest {
  projectName: string
  files: FileData[]
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // DB에서 토큰 조회
    const [githubToken, vercelToken] = await Promise.all([
      getToken(supabase, user.id, 'github'),
      getToken(supabase, user.id, 'vercel'),
    ])

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub not connected. Please re-login with GitHub.' },
        { status: 400 }
      )
    }

    if (!vercelToken) {
      return NextResponse.json(
        { error: 'Vercel not connected. Please connect your Vercel account.' },
        { status: 400 }
      )
    }

    const { projectName, files }: DeployRequest = await request.json()

    if (!projectName || !files?.length) {
      return NextResponse.json(
        { error: 'Project name and files required' },
        { status: 400 }
      )
    }

    // Step 1: Create GitHub repository
    const repoName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    
    const createRepoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        name: repoName,
        description: `Created with Makeit - ${projectName}`,
        private: false,
        auto_init: true,
      }),
    })

    let owner: string
    let repoData: { id?: number; owner?: { login: string } }

    if (!createRepoRes.ok) {
      const error = await createRepoRes.json()
      // Check if repo already exists
      if (error.errors?.[0]?.message?.includes('already exists')) {
        // Get existing repo info
        owner = await getGitHubUser(githubToken.access_token)
        const existingRepoRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken.access_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )
        repoData = await existingRepoRes.json()
      } else {
        return NextResponse.json(
          { error: `GitHub error: ${error.message}` },
          { status: 400 }
        )
      }
    } else {
      repoData = await createRepoRes.json()
      owner = repoData.owner?.login || (await getGitHubUser(githubToken.access_token))
    }

    // Step 2: Get default branch SHA
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for repo init

    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${githubToken.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    let baseSha: string
    if (refRes.ok) {
      const refData = await refRes.json()
      baseSha = refData.object.sha
    } else {
      // Create initial commit if no main branch
      baseSha = await createInitialCommit(owner, repoName, githubToken.access_token)
    }

    // Step 3: Create blobs for all files
    const blobPromises = files.map(async (file) => {
      const blobRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken.access_token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      )
      const blobData = await blobRes.json()
      return { path: file.path, sha: blobData.sha, mode: '100644', type: 'blob' }
    })

    const blobs = await Promise.all(blobPromises)

    // Add package.json and other necessary files
    const packageJson = {
      name: repoName,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '14.1.0',
        react: '^18',
        'react-dom': '^18',
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        '@types/react-dom': '^18',
        autoprefixer: '^10.0.1',
        postcss: '^8',
        tailwindcss: '^3.3.0',
        typescript: '^5',
      },
    }

    const packageBlob = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(packageJson, null, 2),
          encoding: 'utf-8',
        }),
      }
    ).then((r) => r.json())

    blobs.push({ path: 'package.json', sha: packageBlob.sha, mode: '100644', type: 'blob' })

    // Step 4: Create tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_tree: baseSha,
          tree: blobs,
        }),
      }
    )
    const treeData = await treeRes.json()

    // Step 5: Create commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '🚀 Initial app created with Makeit',
          tree: treeData.sha,
          parents: [baseSha],
        }),
      }
    )
    const commitData = await commitRes.json()

    // Step 6: Update ref
    await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${githubToken.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha: commitData.sha,
        }),
      }
    )

    // Step 7: Deploy to Vercel
    const vercelRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        gitSource: {
          type: 'github',
          repoId: repoData.id?.toString(),
          ref: 'main',
        },
      }),
    })

    let deploymentUrl = null
    if (vercelRes.ok) {
      const vercelData = await vercelRes.json()
      deploymentUrl = vercelData.url
    }

    return NextResponse.json({
      success: true,
      github: {
        url: `https://github.com/${owner}/${repoName}`,
        owner,
        repo: repoName,
      },
      vercel: {
        url: deploymentUrl ? `https://${deploymentUrl}` : null,
        status: deploymentUrl ? 'deploying' : 'manual_setup_required',
      },
    })
  } catch (error) {
    console.error('Deploy API error:', error)
    return NextResponse.json(
      { error: 'Failed to deploy' },
      { status: 500 }
    )
  }
}

async function getGitHubUser(token: string): Promise<string> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  const data = await res.json()
  return data.login
}

async function createInitialCommit(
  owner: string,
  repo: string,
  token: string
): Promise<string> {
  // Create empty tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tree: [] }),
    }
  )
  const treeData = await treeRes.json()

  // Create initial commit
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Initial commit',
        tree: treeData.sha,
      }),
    }
  )
  const commitData = await commitRes.json()

  // Create main ref
  await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'refs/heads/main',
      sha: commitData.sha,
    }),
  })

  return commitData.sha
}
