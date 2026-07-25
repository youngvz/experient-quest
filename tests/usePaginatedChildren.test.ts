import { describe, expect, it } from 'vitest'
import { groupByHeight } from '../src/hooks/usePaginatedChildren'

describe('groupByHeight', () => {
  it('returns a single empty page for no children', () => {
    expect(groupByHeight([], 100)).toEqual([[]])
  })

  it('fits all children on one page when they collectively fit', () => {
    expect(groupByHeight([20, 30, 40], 100)).toEqual([[0, 1, 2]])
  })

  it('splits children when the running total exceeds the max', () => {
    expect(groupByHeight([40, 40, 40], 100)).toEqual([
      [0, 1],
      [2],
    ])
  })

  it('never leaves a page empty by starting a new page mid-fit', () => {
    // 60 + 60 does not fit in 100, so child 1 starts a new page rather than
    // being packed with a phantom neighbor.
    expect(groupByHeight([60, 60, 30], 100)).toEqual([
      [0],
      [1, 2],
    ])
  })

  it('gives an oversized child its own page', () => {
    // 150 > 100, but we still place it — the alternative is losing content.
    expect(groupByHeight([150, 20], 100)).toEqual([
      [0],
      [1],
    ])
  })

  it('falls back to a single all-in page for non-positive max height', () => {
    expect(groupByHeight([10, 20, 30], 0)).toEqual([[0, 1, 2]])
    expect(groupByHeight([10, 20], -50)).toEqual([[0, 1]])
  })

  it('handles many identical children', () => {
    const heights = Array.from({ length: 7 }, () => 30)
    // 30 * 3 = 90 fits in 100, 4th starts new page. 7 children → 3 pages.
    expect(groupByHeight(heights, 100)).toEqual([
      [0, 1, 2],
      [3, 4, 5],
      [6],
    ])
  })
})
