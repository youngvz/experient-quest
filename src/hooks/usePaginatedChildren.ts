import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react'

// Splits N block-level children of an off-screen "measurement" container into
// pages that each fit within a fixed viewport height. Pure so we can unit
// test the packing logic without JSDOM layout.
//
// Greedy first-fit by top-offset: given each child's height relative to its
// container's content edge, walk children in order and start a new page
// whenever adding the next child would exceed `maxHeight`. Any single child
// larger than `maxHeight` still gets its own page (better to overflow one
// panel than to lose the content). Zero children yields a single empty page
// so callers don't have to special-case empty state.
export function groupByHeight(heights: number[], maxHeight: number): number[][] {
  if (heights.length === 0) return [[]]
  if (maxHeight <= 0) return [heights.map((_, i) => i)]
  const pages: number[][] = []
  let current: number[] = []
  let used = 0
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i] ?? 0
    if (current.length > 0 && used + h > maxHeight) {
      pages.push(current)
      current = []
      used = 0
    }
    current.push(i)
    used += h
  }
  if (current.length > 0) pages.push(current)
  return pages
}

export interface UsePaginatedChildrenOptions {
  // Ref to the visible fixed-height window. Its clientHeight is the max page
  // height and we observe it for resize.
  viewportRef: RefObject<HTMLElement | null>
  // Ref to a hidden container that renders the same children in flow. We read
  // its children's rects to compute per-child heights.
  measureRef: RefObject<HTMLElement | null>
  // When this key changes, page index resets to 0. Pass the stop id + line
  // index (or any tuple string) so a fresh conversation starts on page 1.
  contentKey: string
}

export interface PaginationState {
  pages: number[][]
  pageIndex: number
  pageCount: number
  hasNext: boolean
  hasPrev: boolean
  next: () => void
  prev: () => void
  setPageIndex: (i: number) => void
}

export function usePaginatedChildren({
  viewportRef,
  measureRef,
  contentKey,
}: UsePaginatedChildrenOptions): PaginationState {
  const [pages, setPages] = useState<number[][]>([[]])
  const [pageIndex, setPageIndex] = useState(0)

  // Recompute pages from measured child rects. Called after layout so the
  // measure container has real dimensions.
  const recompute = useCallback(() => {
    const viewport = viewportRef.current
    const measure = measureRef.current
    if (!viewport || !measure) return
    const maxHeight = viewport.clientHeight
    const kids = measure.children
    if (kids.length === 0) {
      setPages([[]])
      return
    }
    const heights: number[] = []
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i] as HTMLElement
      // Include vertical margins in the effective height so paragraphs with
      // top/bottom spacing don't overflow the visible slice.
      const style = window.getComputedStyle(el)
      const marginTop = parseFloat(style.marginTop) || 0
      const marginBottom = parseFloat(style.marginBottom) || 0
      heights.push(el.offsetHeight + marginTop + marginBottom)
    }
    setPages(groupByHeight(heights, maxHeight))
  }, [viewportRef, measureRef])

  // Reset page index whenever the content identity changes.
  useLayoutEffect(() => {
    setPageIndex(0)
  }, [contentKey])

  // Recompute on content change and on viewport resize. useLayoutEffect so we
  // measure after the DOM has been updated with the new children in the same
  // frame, avoiding a paint at the wrong page count.
  useLayoutEffect(() => {
    recompute()
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === 'undefined') return
    let raf = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(recompute)
    })
    observer.observe(viewport)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [recompute, contentKey, viewportRef])

  // Clamp page index if pages shrink underneath us (e.g. a resize collapses
  // 3 pages into 2 while we're on page 3).
  useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1))
  }, [pages, pageIndex])

  const pageCount = pages.length
  const hasNext = pageIndex < pageCount - 1
  const hasPrev = pageIndex > 0
  const next = useCallback(() => {
    setPageIndex((i) => Math.min(i + 1, pageCount - 1))
  }, [pageCount])
  const prev = useCallback(() => {
    setPageIndex((i) => Math.max(i - 1, 0))
  }, [])

  return { pages, pageIndex, pageCount, hasNext, hasPrev, next, prev, setPageIndex }
}
