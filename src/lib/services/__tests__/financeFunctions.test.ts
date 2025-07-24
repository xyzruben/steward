import { getSpendingForCustomPeriod, getSpendingComparison, detectSpendingAnomalies, getSpendingTrends, summarizeTopVendors, summarizeTopCategories } from '../financeFunctions';

describe('financeFunctions (Tier 4)', () => {
  describe('getSpendingForCustomPeriod', () => {
    it('returns expected structure for valid input', async () => {
      const result = await getSpendingForCustomPeriod({
        userId: 'user1',
        timeframe: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
      });
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('breakdown');
      expect(Array.isArray(result.breakdown)).toBe(true);
      expect(result).toHaveProperty('currency');
    });
    it('handles empty breakdown and zero totals', async () => {
      const result = await getSpendingForCustomPeriod({
        userId: 'user2',
        timeframe: { start: new Date('2024-02-01'), end: new Date('2024-02-28') },
      });
      expect(result.total).toBe(0);
      expect(result.breakdown).toEqual([]);
    });
  });

  describe('getSpendingComparison', () => {
    it('returns expected structure for valid input', async () => {
      const result = await getSpendingComparison({
        userId: 'user1',
        periodA: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        periodB: { start: new Date('2024-02-01'), end: new Date('2024-02-28') },
      });
      expect(result).toHaveProperty('periodA');
      expect(result).toHaveProperty('periodB');
      expect(result).toHaveProperty('difference');
      expect(result).toHaveProperty('currency');
    });
    it('handles zero totals and difference', async () => {
      const result = await getSpendingComparison({
        userId: 'user2',
        periodA: { start: new Date('2024-03-01'), end: new Date('2024-03-31') },
        periodB: { start: new Date('2024-04-01'), end: new Date('2024-04-30') },
      });
      expect(result.periodA.total).toBe(0);
      expect(result.periodB.total).toBe(0);
      expect(result.difference).toBe(0);
    });
  });

  describe('detectSpendingAnomalies', () => {
    it('returns an array (empty if no anomalies)', async () => {
      const result = await detectSpendingAnomalies({
        userId: 'user1',
        timeframe: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    it('handles valid input and edge cases', async () => {
      const result = await detectSpendingAnomalies({
        userId: 'user2',
        timeframe: { start: new Date('2024-02-01'), end: new Date('2024-02-28') },
        category: 'food',
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getSpendingTrends', () => {
    it('returns an array (empty if no data)', async () => {
      const result = await getSpendingTrends({
        userId: 'user1',
        timeframe: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        interval: 'month',
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('summarizeTopVendors', () => {
    it('returns an array (empty if no data)', async () => {
      const result = await summarizeTopVendors({
        userId: 'user1',
        timeframe: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        N: 3,
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('summarizeTopCategories', () => {
    it('returns an array (empty if no data)', async () => {
      const result = await summarizeTopCategories({
        userId: 'user1',
        timeframe: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        N: 3,
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
}); 