const core = require('@actions/core')
const github = require('@actions/github')
const { Octokit } = require('@octokit/core')

async function listDeployments(octokit, owner, repo) {
  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/deployments',
    {
      owner,
      repo
    }
  )
  return response.data || []
}

async function changeStatusDeployment(octokit, owner, repo, id) {
  const state = 'inactive'

  const response = await octokit.request(
    'POST /repos/{owner}/{repo}/deployments/{id}/statuses',
    {
      owner,
      repo,
      id,
      data: {
        state
      }
    }
  )

  return response.status === 201
}

async function deleteDeployment(octokit, owner, repo, id) {
  const state = 'inactive'

  const response = await octokit.request(
    'DELETE /repos/{owner}/{repo}/deployments/{id}',
    {
      owner,
      repo,
      id,
      data: {
        state
      }
    }
  )

  return response
}

async function run() {
  try {
    const token = core.getInput('token', { required: true })
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })

    const ref = github.context.ref
    const branch = 'fix/switch-header-and-footer'

    console.log(`Branch: ${branch}`)

    const octokit = new Octokit({ auth: token })

    const deployments = await listDeployments(octokit, owner, repo)
    const currentBranchDeployment = deployments.find(deployment => {
      console.log('deployment', deployment.ref)
      console.log('branch', branch)

      return deployment.ref === branch
    })

    if (!currentBranchDeployment) {
      throw new Error(`No deployment found for branch: ${branch}`)
    }

    const result = await changeStatusDeployment(
      octokit,
      owner,
      repo,
      currentBranchDeployment.id
    )

    if (!result) {
      throw new Error('Error changing status deployment')
    }

    const deleteResult = await deleteDeployment(
      octokit,
      owner,
      repo,
      currentBranchDeployment.id
    )

    console.log('Result change status', deleteResult)

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run,
  listDeployments,
  changeStatusDeployment
}
