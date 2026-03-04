import { nextCursor, normalizeLimit } from '../../packages/shared/src/pagination';

describe('pagination helpers', () => {
  it('normalizes invalid limit to default', () => {
    expect(normalizeLimit(undefined)).toBe(20);
  });

  it('caps limit within min and max', () => {
    expect(normalizeLimit(500)).toBe(100);
    expect(normalizeLimit(0)).toBe(1);
  });

  it('returns next cursor for full page', () => {
    const rows = [{ id: 'a' }, { id: 'b' }];
    expect(nextCursor(rows, 2)).toBe('b');
  });

  it('returns null cursor for partial page', () => {
    const rows = [{ id: 'a' }];
    expect(nextCursor(rows, 2)).toBeNull();
  });
});