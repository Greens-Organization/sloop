import { getInput, setFailed, setOutput } from '@actions/core'
import { context } from '@actions/github'
import { Octokit } from '@octokit/core'

export async function listDeployments(octokit, owner, repo) {
  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/deployments',
    {
      owner,
      repo
    }
  )
  return response.data || []
}

export async function changeStatusDeployment(octokit, owner, repo, id) {
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

export async function deleteDeployment(octokit, owner, repo, id) {
  const response = await octokit.request(
    'DELETE /repos/{owner}/{repo}/deployments/{id}',
    {
      owner,
      repo,
      id
    }
  )

  return response.status === 204
}

export async function run() {
  try {
    const token = getInput('token', { required: true })
    const owner = getInput('owner', { required: true })
    const repo = getInput('repo', { required: true })

    const ref = context.ref
    const branch = ref.replace('refs/heads/', '')

    console.log(`Branch: ${branch}`)

    const octokit = new Octokit({ auth: token })

    const deployments = await listDeployments(octokit, owner, repo)
    const currentBranchDeployment = deployments.find(
      deployment => deployment.ref === branch
    )

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

    if (!deleteResult) {
      throw new Error('Error deleting deployment')
    }

    console.log(`Deployment deleted for branch: ${branch}`)

    setOutput('result', deleteResult)
    setOutput('time', new Date().toTimeString())
  } catch (error) {
    setFailed(error.message)
  }
}
