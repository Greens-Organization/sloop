const core = require('@actions/core')
const github = require('@actions/github')
const { Octokit } = require('@octokit/core')
const main = require('../src/main')

jest.mock('@actions/core')
jest.mock('@actions/github', () => ({
  context: {
    ref: 'refs/heads/test-branch'
  }
}))
jest.mock('@octokit/core')

describe('run function', () => {
  let getInputMock
  let setOutputMock
  let setFailedMock
  let octokitMock

  beforeEach(() => {
    getInputMock = core.getInput.mockImplementation(name => {
      switch (name) {
        case 'token':
          return 'test-token'
        case 'owner':
          return 'test-owner'
        case 'repo':
          return 'test-repo'
        default:
          return ''
      }
    })

    setOutputMock = core.setOutput.mockImplementation()
    setFailedMock = core.setFailed.mockImplementation()

    octokitMock = {
      request: jest.fn()
    }

    Octokit.mockImplementation(() => octokitMock)

    github.context.ref = 'refs/heads/test-branch'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should set the correct outputs', async () => {
    octokitMock.request.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          ref: 'fix/switch-header-and-footer'
        }
      ]
    })
    octokitMock.request.mockResolvedValueOnce({
      status: 200
    })

    await main.run()

    expect(getInputMock).toHaveBeenCalledWith('token', { required: true })
    expect(getInputMock).toHaveBeenCalledWith('owner', { required: true })
    expect(getInputMock).toHaveBeenCalledWith('repo', { required: true })
    expect(octokitMock.request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/deployments',
      {
        owner: 'test-owner',
        repo: 'test-repo'
      }
    )
    expect(octokitMock.request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/deployments/{id}/statuses',
      {
        owner: 'test-owner',
        repo: 'test-repo',
        id: 1,
        data: { state: 'inactive' }
      }
    )
    // expect(setOutputMock).toHaveBeenCalledWith('time', expect.any(String))
  })

  it('should fail when no deployment is found for the branch', async () => {
    octokitMock.request.mockResolvedValueOnce({
      data: []
    })

    await main.run()

    expect(setFailedMock).toHaveBeenCalledWith(
      'No deployment found for branch: test/deployment-delete'
    )
  })
})
