import { describe, it, expect } from 'vitest';
import { DEFAULT_CHECKLIST_ITEMS, DEFAULT_AREAS, PILLAR_LABELS, Pillar } from '../types';

describe('5S Audit Data Model', () => {
  it('has 20 default checklist items (4 per pillar)', () => {
    expect(DEFAULT_CHECKLIST_ITEMS).toHaveLength(20);
  });

  it('has 4 items per pillar', () => {
    const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
    for (const pillar of pillars) {
      const items = DEFAULT_CHECKLIST_ITEMS.filter((i) => i.pillar === pillar);
      expect(items).toHaveLength(4);
    }
  });

  it('has 5 default factory areas including Packaging and Metal Elements', () => {
    expect(DEFAULT_AREAS).toHaveLength(5);
    expect(DEFAULT_AREAS[0].name).toBe('Packaging');
    expect(DEFAULT_AREAS[1].name).toBe('Metal Elements');
  });

  it('has all 5 pillar labels defined with name and color', () => {
    const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
    for (const p of pillars) {
      expect(PILLAR_LABELS[p]).toBeDefined();
      expect(PILLAR_LABELS[p].name).toBeTruthy();
      expect(PILLAR_LABELS[p].color).toMatch(/^#/);
    }
  });

  it('all checklist items have pillar and description', () => {
    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      expect(item.pillar).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.description.length).toBeGreaterThan(10);
    }
  });
});

describe('Score calculation logic', () => {
  it('calculates 100% when all items pass', () => {
    const items = DEFAULT_CHECKLIST_ITEMS.map((i, idx) => ({
      ...i,
      id: `item-${idx}`,
      status: 'pass' as const,
    }));

    const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
    const scores: Record<string, number> = {};

    for (const pillar of pillars) {
      const pillarItems = items.filter((i) => i.pillar === pillar);
      const total = pillarItems.reduce((sum, item) => {
        if (item.status === 'pass') return sum + 2;
        if (item.status === 'partial') return sum + 1;
        return sum;
      }, 0);
      scores[pillar] = Math.round((total / (pillarItems.length * 2)) * 100);
    }

    for (const p of pillars) {
      expect(scores[p]).toBe(100);
    }
  });

  it('calculates 0% when all items fail', () => {
    const items = DEFAULT_CHECKLIST_ITEMS.map((i, idx) => ({
      ...i,
      id: `item-${idx}`,
      status: 'fail' as const,
    }));

    const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
    for (const pillar of pillars) {
      const pillarItems = items.filter((i) => i.pillar === pillar);
      const total = pillarItems.reduce((sum, item) => {
        const s = item.status as string;
        if (s === 'pass') return sum + 2;
        if (s === 'partial') return sum + 1;
        return sum;
      }, 0);
      const score = Math.round((total / (pillarItems.length * 2)) * 100);
      expect(score).toBe(0);
    }
  });

  it('calculates 50% when all items are partial', () => {
    const items = DEFAULT_CHECKLIST_ITEMS.map((i, idx) => ({
      ...i,
      id: `item-${idx}`,
      status: 'partial' as const,
    }));

    const pillarItems = items.filter((i) => i.pillar === '1S');
    const total = pillarItems.reduce((sum, item) => {
      const s = item.status as string;
      if (s === 'pass') return sum + 2;
      if (s === 'partial') return sum + 1;
      return sum;
    }, 0);
    const score = Math.round((total / (pillarItems.length * 2)) * 100);
    expect(score).toBe(50);
  });
});
