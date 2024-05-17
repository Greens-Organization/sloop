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

  return response.data
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

  return response.status === 200
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const token = core.getInput('token', { required: true })
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })

    // Get the branch that triggered the action
    const ref = github.context.ref
    // const branch = ref.replace('refs/heads/', '')

    const branch = 'fix/switch-header-and-footer'

    // Log the branch name to the console
    console.log(`Branch: ${branch}`)

    // Request for github
    const octokit = new Octokit({ auth: token })

    // List deployments for the repository
    const deployments = listDeployments(octokit, owner, repo)
    const currentBranchDeployment = deployments.find(deployment => {
      console.log('deployment', deployment.ref)
      console.log('branch', branch)

      if (deployment.ref === branch) {
        return deployment
      }
    })

    if (!currentBranchDeployment) {
      throw new Error(`No deployment found for branch: ${branch}`)
    }

    const result = changeStatusDeployment(
      octokit,
      owner,
      repo,
      currentBranchDeployment.id
    )

    console.log('Result change status', result)

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
