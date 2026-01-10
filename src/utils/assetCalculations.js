/**
 * 資産シミュレーション計算ユーティリティ
 */

/**
 * 指定年の年利を取得
 */
export const getReturnRateForYear = (year, returnRates) => {
  const rate = returnRates.find(r => year >= r.startYear && year <= r.endYear);
  return rate ? rate.rate : 0;
};

/**
 * 指定年の積立額を計算（月額×12ヶ月）
 */
export const getInvestmentForYear = (year, investments, investmentLimit, currentCumulativeInvestment) => {
  let totalYearlyInvestment = 0;

  investments.forEach(inv => {
    if (year >= inv.startYear && year <= inv.endYear) {
      totalYearlyInvestment += inv.monthlyAmount * 12;
    }
  });

  // 投資上限チェック
  if (investmentLimit.enabled) {
    const remainingLimit = investmentLimit.amount - currentCumulativeInvestment;
    if (remainingLimit <= 0) {
      return 0; // 上限到達
    }
    return Math.min(totalYearlyInvestment, remainingLimit);
  }

  return totalYearlyInvestment;
};

/**
 * 指定年のイベント金額を取得
 */
export const getEventAmountForYear = (year, events) => {
  return events
    .filter(event => event.year === year)
    .reduce((sum, event) => sum + event.amount, 0);
};

/**
 * 資産シミュレーションを計算
 */
export const calculateAssetSimulation = (asset, simulationYears) => {
  const results = [];
  let currentTotal = asset.initialAmount;
  let cumulativePrincipal = asset.initialAmount;
  let cumulativeInvestment = 0;

  for (let year = 0; year <= simulationYears; year++) {
    // 0年目の初期状態
    if (year === 0) {
      results.push({
        year: 0,
        total: currentTotal,
        principal: cumulativePrincipal,
        profit: 0,
        cumulativeInvestment: 0
      });
      continue;
    }

    // 年利を適用
    const rate = getReturnRateForYear(year, asset.returnRates);
    currentTotal = currentTotal * (1 + rate / 100);

    // 積立額を追加
    const yearlyInvestment = getInvestmentForYear(
      year, 
      asset.investments, 
      asset.investmentLimit, 
      cumulativeInvestment
    );
    currentTotal += yearlyInvestment;
    cumulativePrincipal += yearlyInvestment;
    cumulativeInvestment += yearlyInvestment;

    // イベント金額を適用
    const eventAmount = getEventAmountForYear(year, asset.events);
    currentTotal += eventAmount;
    
    // イベントが引き出し（マイナス）の場合は原資から減らす
    // イベントが投資（プラス）の場合は原資と累計投資額に加える
    if (eventAmount >= 0) {
      cumulativePrincipal += eventAmount;
      cumulativeInvestment += eventAmount;
    } else {
      cumulativePrincipal += eventAmount;
      // 引き出しは累計投資額には影響しない
    }

    // 運用益を計算
    const profit = currentTotal - cumulativePrincipal;

    results.push({
      year,
      total: currentTotal,
      principal: cumulativePrincipal,
      profit,
      cumulativeInvestment
    });
  }

  return results;
};

/**
 * 複数資産の合計シミュレーションを計算
 */
export const calculateCombinedSimulation = (assets, simulationYears) => {
  const assetSimulations = assets.map(asset => ({
    asset: asset,
    data: calculateAssetSimulation(asset, simulationYears)
  }));

  const combinedData = [];
  for (let year = 0; year <= simulationYears; year++) {
    let yearData = { year: year, total: 0, principal: 0, profit: 0 };
    
    assetSimulations.forEach(({ asset, data }) => {
      const assetYearData = data[year];
      yearData.total += assetYearData.total;
      yearData.principal += assetYearData.principal;
      yearData.profit += assetYearData.profit;
      yearData[`${asset.name}_total`] = assetYearData.total;
    });

    combinedData.push(yearData);
  }

  return { assetSimulations, combinedData };
};
