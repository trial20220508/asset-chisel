import React, { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

const AssetSimulator = () => {
  // 初期資産
  const [initialAsset, setInitialAsset] = useState(1000000);
  
  // 積立設定（複数対応）
  const [investments, setInvestments] = useState([
    { id: 1, name: '基本積立', startYear: 1, endYear: 30, monthlyAmount: 50000 }
  ]);
  
  // 年利設定（年ごと）
  const [returnRates, setReturnRates] = useState([
    { id: 1, startYear: 1, endYear: 10, rate: 5 },
    { id: 2, startYear: 11, endYear: 30, rate: 3 }
  ]);
  
  const [simulationYears, setSimulationYears] = useState(30);

  // 積立を追加
  const addInvestment = () => {
    const newId = Math.max(...investments.map(i => i.id), 0) + 1;
    setInvestments([...investments, {
      id: newId,
      name: `積立${newId}`,
      startYear: 1,
      endYear: simulationYears,
      monthlyAmount: 30000
    }]);
  };

  // 積立を削除
  const removeInvestment = (id) => {
    setInvestments(investments.filter(i => i.id !== id));
  };

  // 積立を更新
  const updateInvestment = (id, field, value) => {
    setInvestments(investments.map(inv => 
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  // 年利設定を追加
  const addReturnRate = () => {
    const newId = Math.max(...returnRates.map(r => r.id), 0) + 1;
    const lastRate = returnRates[returnRates.length - 1];
    const newStartYear = lastRate ? lastRate.endYear + 1 : 1;
    
    setReturnRates([...returnRates, {
      id: newId,
      startYear: newStartYear,
      endYear: simulationYears,
      rate: 3
    }]);
  };

  // 年利設定を削除
  const removeReturnRate = (id) => {
    if (returnRates.length > 1) {
      setReturnRates(returnRates.filter(r => r.id !== id));
    }
  };

  // 年利設定を更新
  const updateReturnRate = (id, field, value) => {
    setReturnRates(returnRates.map(rate => 
      rate.id === id ? { ...rate, [field]: value } : rate
    ));
  };

  // シミュレーション計算
  const simulationData = useMemo(() => {
    const data = [];
    let currentAsset = initialAsset;
    let totalPrincipal = initialAsset; // 原資累計

    for (let year = 0; year <= simulationYears; year++) {
      if (year === 0) {
        data.push({
          year: 0,
          total: initialAsset,
          principal: initialAsset,
          profit: 0
        });
        continue;
      }

      // この年の年利を取得
      const rateConfig = returnRates
        .filter(r => year >= r.startYear && year <= r.endYear)
        .sort((a, b) => b.startYear - a.startYear)[0];
      const annualRate = rateConfig ? rateConfig.rate / 100 : 0.03;

      // 年初の資産に年利を適用
      currentAsset = currentAsset * (1 + annualRate);

      // この年の積立額を計算
      let yearlyInvestment = 0;
      investments.forEach(inv => {
        if (year >= inv.startYear && year <= inv.endYear) {
          yearlyInvestment += inv.monthlyAmount * 12;
        }
      });

      // 積立額を追加（年末に一括投資と仮定）
      currentAsset += yearlyInvestment;
      totalPrincipal += yearlyInvestment;

      data.push({
        year: year,
        total: Math.round(currentAsset),
        principal: totalPrincipal,
        profit: Math.round(currentAsset - totalPrincipal)
      });
    }

    return data;
  }, [initialAsset, investments, returnRates, simulationYears]);

  const finalData = simulationData[simulationData.length - 1];

  // 数値をフォーマット
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  // グラフ用のカスタムツールチップ
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border-2 border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${payload[0].payload.year}年目`}</p>
          <p className="text-blue-600">{`総資産: ¥${formatNumber(payload[0].payload.total)}`}</p>
          <p className="text-gray-600">{`原資: ¥${formatNumber(payload[0].payload.principal)}`}</p>
          <p className="text-green-600">{`運用益: ¥${formatNumber(payload[0].payload.profit)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">資産形成シミュレーター</h1>
          </div>

          {/* サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">最終資産</div>
              <div className="text-3xl font-bold">¥{formatNumber(finalData.total)}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">投資元本</div>
              <div className="text-3xl font-bold">¥{formatNumber(finalData.principal)}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">運用益</div>
              <div className="text-3xl font-bold">¥{formatNumber(finalData.profit)}</div>
              <div className="text-sm opacity-90 mt-1">
                (+{((finalData.profit / finalData.principal) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* グラフ */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">資産推移グラフ</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={simulationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: '年', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                  label={{ value: '資産額', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="principal" 
                  stackId="1"
                  stroke="#6B7280" 
                  fill="#9CA3AF" 
                  name="原資"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#34D399" 
                  name="運用益"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 設定エリア */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本設定 */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">基本設定</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      初期資産（円）
                    </label>
                    <input
                      type="number"
                      value={initialAsset}
                      onChange={(e) => setInitialAsset(Number(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      シミュレーション期間（年）
                    </label>
                    <input
                      type="number"
                      value={simulationYears}
                      onChange={(e) => setSimulationYears(Number(e.target.value))}
                      min="1"
                      max="50"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 積立設定 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">積立設定</h2>
                  <button
                    onClick={addInvestment}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    追加
                  </button>
                </div>
                <div className="space-y-3">
                  {investments.map((inv) => (
                    <div key={inv.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={inv.name}
                          onChange={(e) => updateInvestment(inv.id, 'name', e.target.value)}
                          className="font-medium text-gray-700 bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none"
                        />
                        {investments.length > 1 && (
                          <button
                            onClick={() => removeInvestment(inv.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">開始年</label>
                          <input
                            type="number"
                            value={inv.startYear}
                            onChange={(e) => updateInvestment(inv.id, 'startYear', Number(e.target.value))}
                            min="1"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">終了年</label>
                          <input
                            type="number"
                            value={inv.endYear}
                            onChange={(e) => updateInvestment(inv.id, 'endYear', Number(e.target.value))}
                            min="1"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">月額（円）</label>
                          <input
                            type="number"
                            value={inv.monthlyAmount}
                            onChange={(e) => updateInvestment(inv.id, 'monthlyAmount', Number(e.target.value))}
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 年利設定 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">年利設定</h2>
                <button
                  onClick={addReturnRate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  追加
                </button>
              </div>
              <div className="space-y-3">
                {returnRates.sort((a, b) => a.startYear - b.startYear).map((rate) => (
                  <div key={rate.id} className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">
                        {rate.startYear}年目 〜 {rate.endYear}年目
                      </span>
                      {returnRates.length > 1 && (
                        <button
                          onClick={() => removeReturnRate(rate.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">開始年</label>
                        <input
                          type="number"
                          value={rate.startYear}
                          onChange={(e) => updateReturnRate(rate.id, 'startYear', Number(e.target.value))}
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">終了年</label>
                        <input
                          type="number"
                          value={rate.endYear}
                          onChange={(e) => updateReturnRate(rate.id, 'endYear', Number(e.target.value))}
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">年利（%）</label>
                        <input
                          type="number"
                          value={rate.rate}
                          onChange={(e) => updateReturnRate(rate.id, 'rate', Number(e.target.value))}
                          step="0.1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 詳細データテーブル */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">年次詳細データ</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">年</th>
                  <th className="px-4 py-2 text-right">総資産</th>
                  <th className="px-4 py-2 text-right">原資</th>
                  <th className="px-4 py-2 text-right">運用益</th>
                  <th className="px-4 py-2 text-right">運用益率</th>
                </tr>
              </thead>
              <tbody>
                {simulationData.filter((_, i) => i % 5 === 0 || i === simulationData.length - 1).map((data) => (
                  <tr key={data.year} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{data.year}年目</td>
                    <td className="px-4 py-2 text-right font-semibold">¥{formatNumber(data.total)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">¥{formatNumber(data.principal)}</td>
                    <td className="px-4 py-2 text-right text-green-600">¥{formatNumber(data.profit)}</td>
                    <td className="px-4 py-2 text-right">
                      {data.principal > 0 ? ((data.profit / data.principal) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetSimulator;