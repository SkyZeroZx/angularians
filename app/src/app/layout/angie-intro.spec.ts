import { TestBed } from '@angular/core/testing'
import { vi } from 'vitest'
import { AngieIntro } from './angie-intro'
import { AngieService } from './angie.service'

describe('AngieIntro', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  it('offers the close button five seconds after it opens', () => {
    const fixture = TestBed.createComponent(AngieIntro)
    const canClose = () => (fixture.componentInstance as unknown as { canClose(): boolean }).canClose()
    TestBed.inject(AngieService).stormEnded()
    TestBed.tick()
    vi.advanceTimersByTime(4999)
    expect(canClose()).toBe(false)
    vi.advanceTimersByTime(1)
    expect(canClose()).toBe(true)
  })

  it('stays open when the lightning is turned off', () => {
    const fixture = TestBed.createComponent(AngieIntro)
    const intro = fixture.componentInstance as unknown as { toggleLightning(): void, lightningLabel(): string }
    const angie = TestBed.inject(AngieService)
    angie.stormEnded()
    intro.toggleLightning()
    expect(angie.on()).toBe(false)
    expect(angie.introOpen()).toBe(true)
    expect(intro.lightningLabel()).toContain('Turn it back on')
  })

  it('thanks for the star', () => {
    const intro = TestBed.createComponent(AngieIntro).componentInstance as unknown as { markStarred(): void, starLabel(): string }
    expect(intro.starLabel()).toBe('Star on GitHub')
    intro.markStarred()
    expect(intro.starLabel()).toBe('Thanks for the star')
  })
})
