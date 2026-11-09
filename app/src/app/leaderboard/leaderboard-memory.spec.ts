import { TestBed } from '@angular/core/testing';
import type { LeaderboardPage } from '@angularians/shared';
import { LeaderboardMemory, showOneMore, STEP } from './leaderboard-memory';

describe('LeaderboardMemory', () => {
  const page = (badges: string[], match: 'any' | 'all') => ({ period: 'all', country: null, badges, match, collectedAt: null }) as unknown as LeaderboardPage;

  it('keeps each filtered board apart', () => {
    const memory = TestBed.inject(LeaderboardMemory);
    const shown = { more: [], wide: STEP.wide * 2, phone: STEP.phone };
    memory.set(page(['a', 'b'], 'any'), shown);
    expect(memory.get(page(['a', 'b'], 'any'))).toEqual(shown);
    expect(memory.get(page(['a', 'b'], 'all')).wide).toBe(STEP.wide);
    expect(memory.get(page(['a'], 'any')).wide).toBe(STEP.wide);
  });
});

describe('showOneMore', () => {
  it('adds a step on the screen size it was pressed on, keeping the loaded pages', () => {
    const state = { more: [], wide: STEP.wide, phone: STEP.phone };
    expect(showOneMore(state, true)).toEqual({ more: [], wide: STEP.wide, phone: STEP.phone * 2 });
    expect(showOneMore(state, false)).toEqual({ more: [], wide: STEP.wide * 2, phone: STEP.phone });
  });
});
