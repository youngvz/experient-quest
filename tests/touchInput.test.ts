import { beforeEach, describe, expect, it } from 'vitest'
import { touchInput } from '../src/game/input/touchInput'

describe('touchInput', () => {
  beforeEach(() => {
    touchInput.reset()
  })

  it('setMove / getMove round-trip', () => {
    touchInput.setMove(0.4, -0.7)
    expect(touchInput.getMove()).toEqual({ x: 0.4, z: -0.7 })
    // getMove does not clear — repeated reads return the same value.
    expect(touchInput.getMove()).toEqual({ x: 0.4, z: -0.7 })
  })

  it('consumeInteract fires once per emit', () => {
    expect(touchInput.consumeInteract()).toBe(false)
    touchInput.emitInteract()
    expect(touchInput.consumeInteract()).toBe(true)
    expect(touchInput.consumeInteract()).toBe(false)
  })

  it('consumeYawDelta accumulates additions and clears on read', () => {
    touchInput.addYawDelta(0.1)
    touchInput.addYawDelta(0.05)
    expect(touchInput.consumeYawDelta()).toBeCloseTo(0.15, 10)
    expect(touchInput.consumeYawDelta()).toBe(0)
  })

  it('consumeZoomFactor multiplies additions and resets to 1', () => {
    expect(touchInput.consumeZoomFactor()).toBe(1)
    touchInput.addZoomFactor(1.2)
    touchInput.addZoomFactor(0.5)
    expect(touchInput.consumeZoomFactor()).toBeCloseTo(0.6, 10)
    expect(touchInput.consumeZoomFactor()).toBe(1)
  })

  it('reset zeroes everything', () => {
    touchInput.setMove(0.9, 0.9)
    touchInput.addYawDelta(0.3)
    touchInput.addZoomFactor(2)
    touchInput.emitInteract()
    touchInput.reset()
    expect(touchInput.getMove()).toEqual({ x: 0, z: 0 })
    expect(touchInput.consumeYawDelta()).toBe(0)
    expect(touchInput.consumeZoomFactor()).toBe(1)
    expect(touchInput.consumeInteract()).toBe(false)
  })
})
