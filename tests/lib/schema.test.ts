import { describe, it, expect } from 'vitest';
import { SignComponentRefSchema, SignComponentsSchema } from '@/content/schema';

describe('SignComponentRefSchema', () => {
  it('parses a valid component reference', () => {
    const result = SignComponentRefSchema.parse({ slug: 'g3-1', name: 'Гарын хэлбэр 3' });
    expect(result.slug).toBe('g3-1');
    expect(result.name).toBe('Гарын хэлбэр 3');
  });

  it('rejects missing slug field', () => {
    expect(() => SignComponentRefSchema.parse({ name: 'Test' })).toThrow();
  });
});

describe('SignComponentsSchema', () => {
  it('applies empty defaults', () => {
    const result = SignComponentsSchema.parse({});
    expect(result.handshape).toEqual([]);
    expect(result.location).toEqual([]);
    expect(result.movement).toEqual([]);
    expect(result.palmOrientation).toEqual([]);
    expect(result.nonManualMarkers).toEqual([]);
  });

  it('parses populated components', () => {
    const result = SignComponentsSchema.parse({
      handshape: [{ slug: 'g1', name: 'Гар' }],
      movement: [{ slug: 'm2', name: 'Дээш' }],
    });
    expect(result.handshape).toHaveLength(1);
    expect(result.movement).toHaveLength(1);
  });

  it('parses partial components', () => {
    const result = SignComponentsSchema.parse({
      location: [{ slug: 'loc1', name: 'Толгой' }],
    });
    expect(result.location).toHaveLength(1);
    expect(result.handshape).toEqual([]);
  });
});
