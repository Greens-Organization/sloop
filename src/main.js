const core = require('@actions/core')
const github = require('@actions/github')

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
    const branch = ref.replace('refs/heads/', '')

    // Log the branch name to the console
    console.log(`Branch: ${branch}`)

    // Set outputs for other workflow steps to use
    core.setOutput('token', token)
    core.setOutput('owner', owner)
    core.setOutput('repo', repo)
    core.setOutput('branch', branch)
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
