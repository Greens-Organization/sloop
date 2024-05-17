/**
 * Unit tests for the action's main functionality, src/main.js
 */
const core = require('@actions/core')
const { context } = require('@actions/github')
const main = require('../src/main')

// Mock the GitHub Actions core library
const getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets the correct outputs', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
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

    // Mock github.context.ref to return a test branch name
    context.ref = 'refs/heads/test-branch'

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'token', 'test-token')
    expect(setOutputMock).toHaveBeenNthCalledWith(2, 'owner', 'test-owner')
    expect(setOutputMock).toHaveBeenNthCalledWith(3, 'repo', 'test-repo')
    expect(setOutputMock).toHaveBeenNthCalledWith(4, 'branch', 'test-branch')
    expect(setOutputMock).toHaveBeenNthCalledWith(5, 'time', expect.any(String))
  })

  it('sets a failed status', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
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

    await main.run()
    expect(runMock).toHaveReturned()
  })
})
