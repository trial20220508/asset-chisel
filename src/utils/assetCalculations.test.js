import { describe, it, expect } from 'vitest';
import {
  getReturnRateForYear,
  getInvestmentForYear,
  getEventAmountForYear,
  calculateAssetSimulation,
  calculateCombinedSimulation
} from '../utils/assetCalculations';

describe('assetCalculations', () => {
  describe('getReturnRateForYear', () => {
    it('指定年の年利を正しく取得できる', () => {
      const returnRates = [
        { id: 1, startYear: 1, endYear: 10, rate: 5 },
        { id: 2, startYear: 11, endYear: 30, rate: 3 }
      ];

      expect(getReturnRateForYear(5, returnRates)).toBe(5);
      expect(getReturnRateForYear(15, returnRates)).toBe(3);
    });

    it('該当する年利がない場合は0を返す', () => {
      const returnRates = [
        { id: 1, startYear: 1, endYear: 10, rate: 5 }
      ];

      expect(getReturnRateForYear(15, returnRates)).toBe(0);
    });
  });

  describe('getInvestmentForYear', () => {
    it('指定年の積立額を正しく計算できる（月額×12）', () => {
      const investments = [
        { id: 1, startYear: 1, endYear: 10, monthlyAmount: 50000 }
      ];

      const result = getInvestmentForYear(5, investments, { enabled: false }, 0);
      expect(result).toBe(600000); // 50000 × 12
    });

    it('複数の積立設定を合算できる', () => {
      const investments = [
        { id: 1, startYear: 1, endYear: 10, monthlyAmount: 30000 },
        { id: 2, startYear: 5, endYear: 15, monthlyAmount: 20000 }
      ];

      const result = getInvestmentForYear(7, investments, { enabled: false }, 0);
      expect(result).toBe(600000); // (30000 + 20000) × 12
    });

    it('投資上限に達している場合は0を返す', () => {
      const investments = [
        { id: 1, startYear: 1, endYear: 10, monthlyAmount: 50000 }
      ];
      const investmentLimit = { enabled: true, amount: 18000000 };

      const result = getInvestmentForYear(5, investments, investmentLimit, 18000000);
      expect(result).toBe(0);
    });

    it('投資上限を超える場合は残り枠まで投資する', () => {
      const investments = [
        { id: 1, startYear: 1, endYear: 10, monthlyAmount: 50000 }
      ];
      const investmentLimit = { enabled: true, amount: 18000000 };

      const result = getInvestmentForYear(5, investments, investmentLimit, 17800000);
      expect(result).toBe(200000); // 残り20万円まで
    });
  });

  describe('getEventAmountForYear', () => {
    it('指定年のイベント金額を合計できる', () => {
      const events = [
        { id: 1, year: 5, amount: 1000000 },
        { id: 2, year: 5, amount: 500000 }
      ];

      expect(getEventAmountForYear(5, events)).toBe(1500000);
    });

    it('該当するイベントがない場合は0を返す', () => {
      const events = [
        { id: 1, year: 5, amount: 1000000 }
      ];

      expect(getEventAmountForYear(10, events)).toBe(0);
    });

    it('マイナス金額（引き出し）も正しく計算できる', () => {
      const events = [
        { id: 1, year: 10, amount: -2000000 }
      ];

      expect(getEventAmountForYear(10, events)).toBe(-2000000);
    });
  });

  describe('calculateAssetSimulation', () => {
    it('シンプルな積立投資のシミュレーションが正しく計算できる', () => {
      const asset = {
        initialAmount: 0,
        returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 5 }],
        investments: [{ id: 1, startYear: 1, endYear: 10, monthlyAmount: 50000 }],
        events: [],
        investmentLimit: { enabled: false, amount: 0 }
      };

      const results = calculateAssetSimulation(asset, 3);

      // 0年目
      expect(results[0].total).toBe(0);
      expect(results[0].principal).toBe(0);
      expect(results[0].profit).toBe(0);

      // 1年目: 60万円積立
      expect(results[1].total).toBe(600000);
      expect(results[1].principal).toBe(600000);
      expect(results[1].profit).toBe(0);

      // 2年目: (60万 × 1.05) + 60万 = 123万
      expect(results[2].total).toBe(1230000);
      expect(results[2].principal).toBe(1200000);
      expect(results[2].profit).toBe(30000);
    });

    it('初期保有額がある場合の計算が正しい', () => {
      const asset = {
        initialAmount: 1000000,
        returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 5 }],
        investments: [],
        events: [],
        investmentLimit: { enabled: false, amount: 0 }
      };

      const results = calculateAssetSimulation(asset, 1);

      // 0年目
      expect(results[0].total).toBe(1000000);

      // 1年目: 100万 × 1.05 = 105万
      expect(results[1].total).toBe(1050000);
      expect(results[1].principal).toBe(1000000);
      expect(results[1].profit).toBe(50000);
    });

    it('イベント（一括投資）が正しく反映される', () => {
      const asset = {
        initialAmount: 0,
        returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 0 }],
        investments: [],
        events: [{ id: 1, year: 2, amount: 1000000 }],
        investmentLimit: { enabled: false, amount: 0 }
      };

      const results = calculateAssetSimulation(asset, 3);

      expect(results[1].total).toBe(0);
      expect(results[2].total).toBe(1000000);
      expect(results[2].cumulativeInvestment).toBe(1000000);
    });

    it('イベント（引き出し）が正しく反映される', () => {
      const asset = {
        initialAmount: 2000000,
        returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 0 }],
        investments: [],
        events: [{ id: 1, year: 2, amount: -500000 }],
        investmentLimit: { enabled: false, amount: 0 }
      };

      const results = calculateAssetSimulation(asset, 3);

      expect(results[1].total).toBe(2000000);
      expect(results[2].total).toBe(1500000);
      expect(results[2].principal).toBe(1500000);
      // 引き出しは累計投資額に影響しない
      expect(results[2].cumulativeInvestment).toBe(0);
    });

    it('投資上限（NISA）が正しく機能する', () => {
      const asset = {
        initialAmount: 0,
        returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 0 }],
        investments: [{ id: 1, startYear: 1, endYear: 10, monthlyAmount: 100000 }], // 年120万
        events: [],
        investmentLimit: { enabled: true, amount: 1800000 } // 180万円上限
      };

      const results = calculateAssetSimulation(asset, 3);

      // 1年目: 120万円投資
      expect(results[1].cumulativeInvestment).toBe(1200000);
      expect(results[1].total).toBe(1200000);

      // 2年目: 60万円のみ投資（残り枠）
      expect(results[2].cumulativeInvestment).toBe(1800000);
      expect(results[2].total).toBe(1800000);

      // 3年目: 上限到達のため投資なし
      expect(results[3].cumulativeInvestment).toBe(1800000);
      expect(results[3].total).toBe(1800000);
    });
  });

  describe('calculateCombinedSimulation', () => {
    it('複数資産の合計が正しく計算できる', () => {
      const assets = [
        {
          id: 1,
          name: '資産A',
          initialAmount: 1000000,
          returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 0 }],
          investments: [],
          events: [],
          investmentLimit: { enabled: false, amount: 0 }
        },
        {
          id: 2,
          name: '資産B',
          initialAmount: 500000,
          returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 0 }],
          investments: [],
          events: [],
          investmentLimit: { enabled: false, amount: 0 }
        }
      ];

      const result = calculateCombinedSimulation(assets, 1);

      expect(result.combinedData[0].total).toBe(1500000);
      expect(result.combinedData[0]['資産A_total']).toBe(1000000);
      expect(result.combinedData[0]['資産B_total']).toBe(500000);
    });
  });
});
