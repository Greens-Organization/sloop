/**
 * Unit tests for the action's entrypoint, src/index.js
 */

import { describe, expect, it, vi } from 'vitest'
import { run } from '../src/main'

// Mock the action's entrypoint
vi.mock('../src/main', () => ({
  run: vi.fn()
}))

describe('index', () => {
  it('calls run when imported', async () => {
    await import('../src/index')

    expect(run).toHaveBeenCalled()
  })
})
