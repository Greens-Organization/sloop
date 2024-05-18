const core = require('@actions/core')
const github = require('@actions/github')
const { Octokit } = require('@octokit/core')
const {
  run,
  listDeployments,
  changeStatusDeployment,
  deleteDeployment
} = require('../src/main')

jest.mock('@actions/core')
jest.mock('@actions/github', () => ({
  context: {
    ref: 'refs/heads/test-branch'
  }
}))
jest.mock('@octokit/core')

describe('GitHub Action', () => {
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
          ref: 'test/deployment-delete'
        }
      ]
    })
    octokitMock.request.mockResolvedValueOnce({
      status: 201
    })
    octokitMock.request.mockResolvedValueOnce({
      status: 204
    })

    await run()

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
    expect(octokitMock.request).toHaveBeenCalledWith(
      'DELETE /repos/{owner}/{repo}/deployments/{id}',
      {
        owner: 'test-owner',
        repo: 'test-repo',
        id: 1,
        data: { state: 'inactive' }
      }
    )
    expect(setOutputMock).toHaveBeenCalledWith('time', expect.any(String))
  })

  it('should fail when no deployment is found for the branch', async () => {
    octokitMock.request.mockResolvedValueOnce({
      data: []
    })

    await run()

    expect(setFailedMock).toHaveBeenCalledWith(
      'No deployment found for branch: test/deployment-delete'
    )
  })

  it('should list deployments', async () => {
    const deployments = [{ id: 1, ref: 'test/deployment-delete' }]
    octokitMock.request.mockResolvedValueOnce({ data: deployments })

    const result = await listDeployments(octokitMock, 'test-owner', 'test-repo')

    expect(result).toEqual(deployments)
    expect(octokitMock.request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/deployments',
      {
        owner: 'test-owner',
        repo: 'test-repo'
      }
    )
  })

  it('should change deployment status', async () => {
    octokitMock.request.mockResolvedValueOnce({ status: 201 })

    const result = await changeStatusDeployment(
      octokitMock,
      'test-owner',
      'test-repo',
      1
    )

    expect(result).toBe(true)
    expect(octokitMock.request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/deployments/{id}/statuses',
      {
        owner: 'test-owner',
        repo: 'test-repo',
        id: 1,
        data: { state: 'inactive' }
      }
    )
  })

  it('should delete deployment', async () => {
    octokitMock.request.mockResolvedValueOnce({ status: 204 })

    const result = await deleteDeployment(
      octokitMock,
      'test-owner',
      'test-repo',
      1
    )

    expect(result.status).toBe(204)
    expect(octokitMock.request).toHaveBeenCalledWith(
      'DELETE /repos/{owner}/{repo}/deployments/{id}',
      {
        owner: 'test-owner',
        repo: 'test-repo',
        id: 1,
        data: { state: 'inactive' }
      }
    )
  })
})
