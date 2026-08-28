import { describe, it, expect } from 'vitest';
import { xpToLevel } from '@/lib/xp';

describe('xpToLevel', () => {
  it('level 1 at 0 XP', () => {
    const r = xpToLevel(0);
    expect(r.level).toBe(1);
    expect(r.intoLevel).toBe(0);
    expect(r.nextLevelAt).toBe(100);
  });

  it('level 1 below 100 XP', () => {
    const r = xpToLevel(50);
    expect(r.level).toBe(1);
    expect(r.intoLevel).toBe(50);
    expect(r.nextLevelAt).toBe(100);
  });

  it('levels up at 100 XP', () => {
    const r = xpToLevel(100);
    expect(r.level).toBe(2);
    expect(r.intoLevel).toBe(0);
  });

  it('tracks XP progress correctly', () => {
    const r = xpToLevel(150);
    expect(r.level).toBe(2);
    expect(r.intoLevel).toBe(50);
    expect(r.nextLevelAt).toBe(100);
  });

  it('doubles threshold at level 5 (500 XP boundary)', () => {
    // Levels 1-4: 100 XP each = 400 XP cumulative.
    // 500 XP: 100 in level 5, threshold now 200.
    const r = xpToLevel(500);
    expect(r.level).toBe(5);
    expect(r.nextLevelAt).toBe(200);
  });

  it('reaches level 5 with 100 XP into the level at 500 XP', () => {
    // 500 XP: 100 into level 5 (since level 5 starts at 400 XP)
    const r = xpToLevel(500);
    expect(r.intoLevel).toBe(100);
  });

  it('maintains 200 XP threshold for levels 5-9', () => {
    // 900 XP: 500+(200*2) = 900, exactly level 7.
    const r = xpToLevel(900);
    expect(r.level).toBe(7);
    expect(r.nextLevelAt).toBe(200);
  });

  it('doubles threshold again at level 10', () => {
    // Level 10 begins around 1500 XP, threshold becomes 400.
    const r = xpToLevel(1500);
    expect(r.level).toBe(10);
    expect(r.nextLevelAt).toBe(400);
  });

  it('handles high XP gracefully', () => {
    const r = xpToLevel(10000);
    expect(r.level).toBeGreaterThan(10);
    expect(r.intoLevel).toBeLessThan(r.nextLevelAt);
    expect(r.intoLevel).toBeGreaterThanOrEqual(0);
  });
});
