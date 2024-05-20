import { getInput, setFailed } from '@actions/core'
import { context as _context } from '@actions/github'
import { Octokit } from '@octokit/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  changeStatusDeployment,
  deleteDeployment,
  listDeployments,
  run
} from '../src/main'

vi.mock('@actions/core', async importActual => {
  const actual = await importActual()
  return {
    default: { ...actual },
    setFailed: vi.fn(),
    getInput: vi.fn(name => {
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
  }
})
vi.mock('@actions/github', async importActual => {
  const actual = await importActual()
  return {
    ...actual,
    context: {
      ref: 'refs/heads/test-branch'
    }
  }
})
vi.mock('@octokit/core')

describe('GitHub Action', () => {
  let octokitMock

  beforeEach(() => {
    octokitMock = {
      request: vi.fn()
    }

    Octokit.mockImplementation(() => octokitMock)

    _context.ref = 'refs/heads/test-branch'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should set the correct outputs', async () => {
    octokitMock.request.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          ref: 'test-branch'
        }
      ]
    })

    await run()

    expect(getInput).toHaveBeenCalledWith('token', { required: true })
    expect(getInput).toHaveBeenCalledWith('owner', { required: true })
    expect(getInput).toHaveBeenCalledWith('repo', { required: true })
  })

  it('should fail when no deployment is found for the branch', async () => {
    octokitMock.request.mockResolvedValueOnce({
      data: []
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith(
      'No deployment found for branch: test-branch'
    )
  })

  it('should list deployments', async () => {
    const deployments = [{ id: 1, ref: 'test-branch' }]
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

    expect(result).toBe(true)
    expect(octokitMock.request).toHaveBeenCalledWith(
      'DELETE /repos/{owner}/{repo}/deployments/{id}',
      {
        owner: 'test-owner',
        repo: 'test-repo',
        id: 1
      }
    )
  })

  it('should throw an error if changing deployment status fails', async () => {
    octokitMock.request.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          ref: 'test-branch'
        }
      ]
    })
    octokitMock.request.mockResolvedValueOnce({
      status: 500
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith('Error changing status deployment')
  })

  it('should throw an error if deleting deployment fails', async () => {
    octokitMock.request.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          ref: 'test-branch'
        }
      ]
    })
    octokitMock.request.mockResolvedValueOnce({
      status: 201
    })
    octokitMock.request.mockResolvedValueOnce({
      status: 500
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith('Error deleting deployment')
  })
})
