import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Plus, Trash2, TrendingUp, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import ScenarioManager from './components/ScenarioManager';
import {
  getAllScenarios,
  getCurrentScenarioId,
  setCurrentScenarioId,
  saveScenario,
  deleteScenario,
  getScenarioById,
  exportToJSON,
  importFromJSON,
  createDefaultScenario
} from './utils/scenarioStorage';

const AssetSimulator = () => {
  // シナリオ管理
  const [scenarios, setScenarios] = useState([]);
  const [currentScenarioId, setCurrentScenarioIdState] = useState(null);
  
  const [simulationYears, setSimulationYears] = useState(30);
  
  // 資産リスト（ユーザーが自由に追加）
  const [assets, setAssets] = useState([
    {
      id: 1,
      name: '現金貯金',
      initialAmount: 1000000,
      returnRates: [{ id: 1, startYear: 1, endYear: 30, rate: 0 }],
      investments: [],
      events: [],
      investmentLimit: { enabled: false, amount: 0 },
      expanded: true
    },
    {
      id: 2,
      name: 'つみたてNISA',
      initialAmount: 0,
      returnRates: [{ id: 1, startYear: 1, endYear: 30, rate: 5 }],
      investments: [{ id: 1, name: '毎月積立', startYear: 1, endYear: 30, monthlyAmount: 50000 }],
      events: [],
      investmentLimit: { enabled: true, amount: 18000000 },
      expanded: false
    }
  ]);

  // 初回ロード時にシナリオを読み込む
  useEffect(() => {
    const loadedScenarios = getAllScenarios();
    const savedCurrentId = getCurrentScenarioId();
    
    if (loadedScenarios.length > 0) {
      setScenarios(loadedScenarios);
      
      // 現在のシナリオを復元
      const currentId = savedCurrentId && loadedScenarios.find(s => s.id === savedCurrentId)
        ? savedCurrentId
        : loadedScenarios[0].id;
      
      setCurrentScenarioIdState(currentId);
      
      // データを復元
      const currentScenario = loadedScenarios.find(s => s.id === currentId);
      if (currentScenario && currentScenario.data) {
        setSimulationYears(currentScenario.data.simulationYears);
        setAssets(currentScenario.data.assets);
      }
    } else {
      // 初回起動時：デフォルトシナリオを作成
      const defaultData = {
        simulationYears,
        assets
      };
      const defaultScenario = createDefaultScenario(defaultData);
      const saved = saveScenario(defaultScenario);
      setScenarios([saved]);
      setCurrentScenarioIdState(saved.id);
    }
  }, []); // 初回のみ実行

  // データが変更されたら自動保存（デバウンス付き）
  useEffect(() => {
    if (!currentScenarioId) return;
    
    const timeoutId = setTimeout(() => {
      const currentScenario = scenarios.find(s => s.id === currentScenarioId);
      if (currentScenario) {
        const updatedScenario = {
          ...currentScenario,
          data: {
            simulationYears,
            assets
          }
        };
        const saved = saveScenario(updatedScenario);
        setScenarios(prev => prev.map(s => s.id === saved.id ? saved : s));
      }
    }, 1000); // 1秒後に自動保存
    
    return () => clearTimeout(timeoutId);
  }, [simulationYears, assets, currentScenarioId]);

  // シナリオ切り替え
  const handleScenarioChange = (scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario && scenario.data) {
      setSimulationYears(scenario.data.simulationYears);
      setAssets(scenario.data.assets);
      setCurrentScenarioIdState(scenarioId);
      setCurrentScenarioId(scenarioId);
    }
  };

  // シナリオ保存
  const handleSaveScenario = (scenario) => {
    const saved = saveScenario(scenario);
    setScenarios(prev => {
      const existing = prev.find(s => s.id === saved.id);
      if (existing) {
        return prev.map(s => s.id === saved.id ? saved : s);
      }
      return [...prev, saved];
    });
  };

  // シナリオ削除
  const handleDeleteScenario = (scenarioId) => {
    const remaining = deleteScenario(scenarioId);
    setScenarios(remaining);
    
    if (remaining.length > 0) {
      const newCurrent = getCurrentScenarioId() || remaining[0].id;
      handleScenarioChange(newCurrent);
    } else {
      // 全削除された場合：新規作成
      handleNewScenario();
    }
  };

  // 新規シナリオ
  const handleNewScenario = () => {
    const newData = {
      simulationYears: 30,
      assets: [
        {
          id: 1,
          name: '現金貯金',
          initialAmount: 1000000,
          returnRates: [{ id: 1, startYear: 1, endYear: 30, rate: 0 }],
          investments: [],
          events: [],
          investmentLimit: { enabled: false, amount: 0 },
          expanded: true
        }
      ]
    };
    
    const newScenario = createDefaultScenario(newData);
    const saved = saveScenario(newScenario);
    setScenarios(prev => [...prev, saved]);
    setCurrentScenarioIdState(saved.id);
    setSimulationYears(newData.simulationYears);
    setAssets(newData.assets);
  };

  // エクスポート
  const handleExportScenario = (scenario) => {
    const currentScenario = scenarios.find(s => s.id === scenario.id);
    if (currentScenario) {
      exportToJSON(currentScenario);
    }
  };

  // インポート
  const handleImportScenario = async (file) => {
    try {
      const imported = await importFromJSON(file);
      const saved = saveScenario(imported);
      setScenarios(prev => [...prev, saved]);
      
      // インポートしたシナリオのデータを即座に反映
      setCurrentScenarioIdState(saved.id);
      setCurrentScenarioId(saved.id);
      setSimulationYears(saved.data.simulationYears);
      setAssets(saved.data.assets);
    } catch (error) {
      throw error;
    }
  };

  // 資産を追加
  const addAsset = () => {
    const newId = Math.max(...assets.map(a => a.id), 0) + 1;
    setAssets([...assets, {
      id: newId,
      name: `資産${newId}`,
      initialAmount: 0,
      returnRates: [{ id: 1, startYear: 1, endYear: simulationYears, rate: 3 }],
      investments: [],
      events: [],
      investmentLimit: { enabled: false, amount: 0 },
      expanded: true
    }]);
  };

  // 資産を削除
  const removeAsset = (id) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  // 資産を更新
  const updateAsset = (id, field, value) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, [field]: value } : asset
    ));
  };

  // 資産の展開/折りたたみ
  const toggleAssetExpanded = (id) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, expanded: !asset.expanded } : asset
    ));
  };

  // 積立を追加（特定の資産に）
  const addInvestmentToAsset = (assetId) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        const newId = Math.max(...(asset.investments.map(i => i.id)), 0) + 1;
        
        // 既存の積立の中で最も終了年が遅いものを探す
        const maxEndYear = asset.investments.length > 0 
          ? Math.max(...asset.investments.map(inv => inv.endYear))
          : 0;
        
        // 新しい積立の開始年は、既存の最大終了年+1（ただし最小1）
        const newStartYear = Math.max(1, maxEndYear + 1);
        
        return {
          ...asset,
          investments: [...asset.investments, {
            id: newId,
            name: `積立${newId}`,
            startYear: newStartYear,
            endYear: simulationYears,
            monthlyAmount: 30000
          }]
        };
      }
      return asset;
    }));
  };

  // 積立を削除
  const removeInvestmentFromAsset = (assetId, investmentId) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          investments: asset.investments.filter(i => i.id !== investmentId)
        };
      }
      return asset;
    }));
  };

  // 積立を更新
  const updateInvestmentInAsset = (assetId, investmentId, field, value) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          investments: asset.investments.map(inv =>
            inv.id === investmentId ? { ...inv, [field]: value } : inv
          )
        };
      }
      return asset;
    }));
  };

  // 年利設定を追加
  const addReturnRateToAsset = (assetId) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        const newId = Math.max(...asset.returnRates.map(r => r.id), 0) + 1;
        const lastRate = asset.returnRates[asset.returnRates.length - 1];
        const newStartYear = lastRate ? lastRate.endYear + 1 : 1;
        
        return {
          ...asset,
          returnRates: [...asset.returnRates, {
            id: newId,
            startYear: newStartYear,
            endYear: simulationYears,
            rate: 3
          }]
        };
      }
      return asset;
    }));
  };

  // 年利設定を削除
  const removeReturnRateFromAsset = (assetId, rateId) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId && asset.returnRates.length > 1) {
        return {
          ...asset,
          returnRates: asset.returnRates.filter(r => r.id !== rateId)
        };
      }
      return asset;
    }));
  };

  // 年利設定を更新
  const updateReturnRateInAsset = (assetId, rateId, field, value) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          returnRates: asset.returnRates.map(rate =>
            rate.id === rateId ? { ...rate, [field]: value } : rate
          )
        };
      }
      return asset;
    }));
  };

  // イベントを追加（特定の資産に）
  const addEventToAsset = (assetId) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        const newId = Math.max(...(asset.events.map(e => e.id)), 0) + 1;
        return {
          ...asset,
          events: [...asset.events, {
            id: newId,
            name: `イベント${newId}`,
            year: 1,
            amount: 0
          }]
        };
      }
      return asset;
    }));
  };

  // イベントを削除
  const removeEventFromAsset = (assetId, eventId) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          events: asset.events.filter(e => e.id !== eventId)
        };
      }
      return asset;
    }));
  };

  // イベントを更新
  const updateEventInAsset = (assetId, eventId, field, value) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          events: asset.events.map(event =>
            event.id === eventId ? { ...event, [field]: value } : event
          )
        };
      }
      return asset;
    }));
  };

  // 投資上限設定を更新
  const updateInvestmentLimit = (assetId, field, value) => {
    setAssets(assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          investmentLimit: { ...asset.investmentLimit, [field]: value }
        };
      }
      return asset;
    }));
  };

  // 各資産のシミュレーション計算
  const calculateAssetSimulation = (asset) => {
    const data = [];
    let currentAsset = asset.initialAmount;
    let totalPrincipal = asset.initialAmount;
    let cumulativeInvestment = asset.initialAmount; // 累計投資額（上限チェック用）

    for (let year = 0; year <= simulationYears; year++) {
      if (year === 0) {
        data.push({
          year: 0,
          total: asset.initialAmount,
          principal: asset.initialAmount,
          profit: 0,
          cumulativeInvestment: asset.initialAmount,
          investmentStopped: false
        });
        continue;
      }

      // この年の年利を取得
      const rateConfig = asset.returnRates
        .filter(r => year >= r.startYear && year <= r.endYear)
        .sort((a, b) => b.startYear - a.startYear)[0];
      const annualRate = rateConfig ? rateConfig.rate / 100 : 0;

      // 年初の資産に年利を適用
      currentAsset = currentAsset * (1 + annualRate);

      // この年の積立額を計算
      let yearlyInvestment = 0;
      let investmentStopped = false;
      
      asset.investments.forEach(inv => {
        if (year >= inv.startYear && year <= inv.endYear) {
          const plannedInvestment = inv.monthlyAmount * 12;
          
          // 投資上限がある場合はチェック
          if (asset.investmentLimit.enabled) {
            const remainingLimit = asset.investmentLimit.amount - cumulativeInvestment;
            if (remainingLimit > 0) {
              // 残り枠以内で投資
              const actualInvestment = Math.min(plannedInvestment, remainingLimit);
              yearlyInvestment += actualInvestment;
              if (actualInvestment < plannedInvestment) {
                investmentStopped = true;
              }
            } else {
              // 上限到達済み
              investmentStopped = true;
            }
          } else {
            // 上限なしの場合は予定通り投資
            yearlyInvestment += plannedInvestment;
          }
        }
      });

      // 積立額を追加
      currentAsset += yearlyInvestment;
      totalPrincipal += yearlyInvestment;
      cumulativeInvestment += yearlyInvestment;

      // この年のイベント（一括投資・引き出し）を適用
      const yearEvents = asset.events.filter(e => e.year === year);
      yearEvents.forEach(event => {
        if (event.amount > 0) {
          // 一括投資の場合も上限チェック
          let actualEventAmount = event.amount;
          if (asset.investmentLimit.enabled) {
            const remainingLimit = asset.investmentLimit.amount - cumulativeInvestment;
            actualEventAmount = Math.max(0, Math.min(event.amount, remainingLimit));
          }
          currentAsset += actualEventAmount;
          totalPrincipal += actualEventAmount;
          cumulativeInvestment += actualEventAmount;
        } else {
          // 引き出しの場合は上限に影響しない
          currentAsset += event.amount;
          totalPrincipal += event.amount;
        }
      });

      data.push({
        year: year,
        total: Math.round(currentAsset),
        principal: totalPrincipal,
        profit: Math.round(currentAsset - totalPrincipal),
        cumulativeInvestment: cumulativeInvestment,
        investmentStopped: investmentStopped
      });
    }

    return data;
  };

  // 全資産のシミュレーション
  const allAssetsSimulation = useMemo(() => {
    const assetSimulations = assets.map(asset => ({
      asset: asset,
      data: calculateAssetSimulation(asset)
    }));

    // 年ごとに全資産を集計
    const combinedData = [];
    for (let year = 0; year <= simulationYears; year++) {
      let yearData = { year: year, total: 0, principal: 0, profit: 0 };
      
      // 各資産ごとのデータも保持
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
  }, [assets, simulationYears]);

  const finalData = allAssetsSimulation.combinedData[allAssetsSimulation.combinedData.length - 1];

  // 数値をフォーマット
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num));
  };

  // グラフ用のカスタムツールチップ
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border-2 border-gray-300 rounded shadow-lg max-w-xs">
          <p className="font-semibold mb-2">{`${payload[0].payload.year}年目`}</p>
          <p className="text-blue-600 font-semibold">{`総資産: ¥${formatNumber(payload[0].payload.total)}`}</p>
          <p className="text-gray-600">{`原資: ¥${formatNumber(payload[0].payload.principal)}`}</p>
          <p className="text-green-600">{`運用益: ¥${formatNumber(payload[0].payload.profit)}`}</p>
        </div>
      );
    }
    return null;
  };

  // 資産別ツールチップ
  const AssetBreakdownTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border-2 border-gray-300 rounded shadow-lg max-w-xs">
          <p className="font-semibold mb-2">{`${data.year}年目`}</p>
          {assets.map(asset => (
            <p key={asset.id} className="text-sm">
              {asset.name}: ¥{formatNumber(data[`${asset.name}_total`] || 0)}
            </p>
          ))}
          <p className="text-blue-600 font-semibold mt-2 pt-2 border-t">
            合計: ¥{formatNumber(data.total)}
          </p>
        </div>
      );
    }
    return null;
  };

  // ランダムな色を生成
  const getColorForAsset = (index) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Asset Chisel</h1>
            <span className="text-sm sm:text-base text-gray-500">- あなたの未来を彫り込む道具</span>
          </div>
        </div>

        {/* シナリオ管理 */}
        <ScenarioManager
          scenarios={scenarios}
          currentScenarioId={currentScenarioId}
          onScenarioChange={handleScenarioChange}
          onSave={handleSaveScenario}
          onDelete={handleDeleteScenario}
          onExport={handleExportScenario}
          onImport={handleImportScenario}
          onNew={handleNewScenario}
        />

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-6">
          {/* サマリー */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="text-xs sm:text-sm opacity-90 mb-1">最終資産合計</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">¥{formatNumber(finalData.total)}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="text-xs sm:text-sm opacity-90 mb-1">投資元本合計</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">¥{formatNumber(finalData.principal)}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="text-xs sm:text-sm opacity-90 mb-1">運用益合計</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">¥{formatNumber(finalData.profit)}</div>
              <div className="text-xs sm:text-sm opacity-90 mt-1">
                (+{finalData.principal > 0 ? ((finalData.profit / finalData.principal) * 100).toFixed(1) : 0}%)
              </div>
            </div>
          </div>

          {/* グラフ：全資産合計 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">全資産推移（原資と運用益）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={allAssetsSimulation.combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: '年', position: 'insideBottomRight', offset: -5, style: { fontSize: 12 } }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                  label={{ value: '資産額', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
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

          {/* グラフ：資産別内訳 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">資産別内訳</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={allAssetsSimulation.combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: '年', position: 'insideBottomRight', offset: -5, style: { fontSize: 12 } }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                  label={{ value: '資産額', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<AssetBreakdownTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {assets.map((asset, index) => (
                  <Area
                    key={asset.id}
                    type="monotone"
                    dataKey={`${asset.name}_total`}
                    stackId="1"
                    stroke={getColorForAsset(index)}
                    fill={getColorForAsset(index)}
                    name={asset.name}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 基本設定 */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">基本設定</h2>
            <div className="max-w-full sm:max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                シミュレーション期間（年）
              </label>
              <input
                type="number"
                value={simulationYears}
                onChange={(e) => setSimulationYears(Number(e.target.value))}
                min="1"
                max="50"
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 資産リスト */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              資産一覧
            </h2>
            <button
              onClick={addAsset}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-lg text-sm sm:text-base touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              資産を追加
            </button>
          </div>

          {assets.map((asset, assetIndex) => {
            const assetData = allAssetsSimulation.assetSimulations.find(s => s.asset.id === asset.id);
            const finalAssetData = assetData ? assetData.data[assetData.data.length - 1] : null;

            return (
              <div key={asset.id} className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
                {/* 資産ヘッダー */}
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 sm:p-6 cursor-pointer touch-manipulation"
                  onClick={() => toggleAssetExpanded(asset.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={asset.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateAsset(asset.id, 'name', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-lg sm:text-xl md:text-2xl font-bold text-white bg-transparent border-b-2 border-white/50 focus:border-white outline-none w-full"
                      />
                      {finalAssetData && (
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4 text-white">
                          <div>
                            <div className="text-xs opacity-80">最終資産</div>
                            <div className="text-sm sm:text-base md:text-lg font-semibold truncate">¥{formatNumber(finalAssetData.total)}</div>
                          </div>
                          <div>
                            <div className="text-xs opacity-80">元本</div>
                            <div className="text-sm sm:text-base md:text-lg font-semibold truncate">¥{formatNumber(finalAssetData.principal)}</div>
                          </div>
                          <div>
                            <div className="text-xs opacity-80">運用益</div>
                            <div className="text-sm sm:text-base md:text-lg font-semibold truncate">¥{formatNumber(finalAssetData.profit)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAsset(asset.id);
                        }}
                        className="text-white hover:text-red-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {asset.expanded ? (
                        <ChevronUp className="w-6 h-6 text-white" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 資産詳細 */}
                {asset.expanded && (
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-6">
                      {/* 基本設定と積立 */}
                      <div className="space-y-6">
                        {/* 初期保有額 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            初期保有額（円）
                          </label>
                          <input
                            type="number"
                            value={asset.initialAmount}
                            onChange={(e) => updateAsset(asset.id, 'initialAmount', Number(e.target.value))}
                            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* 投資上限設定 */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-700">投資上限設定</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={asset.investmentLimit.enabled}
                                onChange={(e) => updateInvestmentLimit(asset.id, 'enabled', e.target.checked)}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-600">上限を設定</span>
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">NISA（1800万円）やiDeCoなどの上限制約に対応</p>
                          {asset.investmentLimit.enabled ? (
                            <div>
                              <label className="block text-sm text-gray-600 mb-2">投資上限額（円）</label>
                              <input
                                type="number"
                                value={asset.investmentLimit.amount}
                                onChange={(e) => updateInvestmentLimit(asset.id, 'amount', Number(e.target.value))}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="例：18000000（1800万円）"
                              />
                              {assetData && (
                                <div className="mt-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">累計投資額：</span>
                                      <span className="font-semibold text-gray-800">
                                        ¥{formatNumber(assetData.data[assetData.data.length - 1].cumulativeInvestment)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">投資上限：</span>
                                      <span className="font-semibold text-gray-800">
                                        ¥{formatNumber(asset.investmentLimit.amount)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-orange-300">
                                      <span className="text-gray-600">残り枠：</span>
                                      <span className="font-semibold text-orange-600">
                                        ¥{formatNumber(Math.max(0, asset.investmentLimit.amount - assetData.data[assetData.data.length - 1].cumulativeInvestment))}
                                      </span>
                                    </div>
                                    {assetData.data[assetData.data.length - 1].cumulativeInvestment >= asset.investmentLimit.amount && (
                                      <div className="mt-2 pt-2 border-t border-orange-300">
                                        <span className="text-orange-600 font-semibold text-xs sm:text-sm">⚠️ 投資上限に到達しています</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">投資上限は設定されていません</p>
                          )}
                        </div>

                        {/* 積立設定 */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-700">積立設定</h3>
                            <button
                              onClick={() => addInvestmentToAsset(asset.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-sm touch-manipulation"
                            >
                              <Plus className="w-4 h-4" />
                              追加
                            </button>
                          </div>
                          {asset.investments.length === 0 ? (
                            <p className="text-gray-500 text-sm">積立設定がありません</p>
                          ) : (
                            <div className="space-y-3">
                              {asset.investments.map((inv) => (
                                <div key={inv.id} className="bg-gray-50 p-3 sm:p-4 rounded-lg border-2 border-gray-200">
                                  <div className="flex items-center justify-between mb-3 gap-2">
                                    <input
                                      type="text"
                                      value={inv.name}
                                      onChange={(e) => updateInvestmentInAsset(asset.id, inv.id, 'name', e.target.value)}
                                      className="flex-1 font-medium text-sm sm:text-base text-gray-700 bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none px-1 py-1"
                                    />
                                    <button
                                      onClick={() => removeInvestmentFromAsset(asset.id, inv.id)}
                                      className="text-red-500 hover:text-red-700 active:text-red-800 p-2 touch-manipulation"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">開始年</label>
                                      <input
                                        type="number"
                                        value={inv.startYear}
                                        onChange={(e) => updateInvestmentInAsset(asset.id, inv.id, 'startYear', Number(e.target.value))}
                                        min="1"
                                        className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">終了年</label>
                                      <input
                                        type="number"
                                        value={inv.endYear}
                                        onChange={(e) => updateInvestmentInAsset(asset.id, inv.id, 'endYear', Number(e.target.value))}
                                        min="1"
                                        className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">月額（円）</label>
                                      <input
                                        type="number"
                                        value={inv.monthlyAmount}
                                        onChange={(e) => updateInvestmentInAsset(asset.id, inv.id, 'monthlyAmount', Number(e.target.value))}
                                        min="0"
                                        className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* イベント設定 */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-700">イベント設定</h3>
                            <button
                              onClick={() => addEventToAsset(asset.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors text-sm touch-manipulation"
                            >
                              <Plus className="w-4 h-4" />
                              追加
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">一括投資や資金の引き出しを設定できます</p>
                          {asset.events.length === 0 ? (
                            <p className="text-gray-500 text-sm">イベント設定がありません</p>
                          ) : (
                            <div className="space-y-3">
                              {asset.events.map((event) => (
                                <div key={event.id} className="bg-purple-50 p-3 sm:p-4 rounded-lg border-2 border-purple-200">
                                  <div className="flex items-center justify-between mb-3 gap-2">
                                    <input
                                      type="text"
                                      value={event.name}
                                      onChange={(e) => updateEventInAsset(asset.id, event.id, 'name', e.target.value)}
                                      placeholder="イベント名（例：車購入）"
                                      className="flex-1 font-medium text-sm sm:text-base text-gray-700 bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none px-1 py-1"
                                    />
                                    <button
                                      onClick={() => removeEventFromAsset(asset.id, event.id)}
                                      className="text-red-500 hover:text-red-700 active:text-red-800 p-2 touch-manipulation"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">発生年</label>
                                      <input
                                        type="number"
                                        value={event.year}
                                        onChange={(e) => updateEventInAsset(asset.id, event.id, 'year', Number(e.target.value))}
                                        min="1"
                                        className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">
                                        金額（円）
                                        <span className="text-xs text-gray-500 ml-1 block sm:inline">※マイナスで引き出し</span>
                                      </label>
                                      <input
                                        type="number"
                                        value={event.amount}
                                        onChange={(e) => updateEventInAsset(asset.id, event.id, 'amount', Number(e.target.value))}
                                        className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs">
                                    {event.amount >= 0 ? (
                                      <span className="text-green-600">💰 {event.year}年目に ¥{formatNumber(event.amount)} を一括投資</span>
                                    ) : (
                                      <span className="text-red-600">💸 {event.year}年目に ¥{formatNumber(Math.abs(event.amount))} を引き出し</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 年利設定 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-700">年利設定</h3>
                          <button
                            onClick={() => addReturnRateToAsset(asset.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm touch-manipulation"
                          >
                            <Plus className="w-4 h-4" />
                            追加
                          </button>
                        </div>
                        <div className="space-y-3">
                          {asset.returnRates.sort((a, b) => a.startYear - b.startYear).map((rate) => (
                            <div key={rate.id} className="bg-green-50 p-3 sm:p-4 rounded-lg border-2 border-green-200">
                              <div className="flex items-center justify-between mb-3 gap-2">
                                <span className="font-medium text-sm sm:text-base text-gray-700">
                                  {rate.startYear}年目 〜 {rate.endYear}年目
                                </span>
                                {asset.returnRates.length > 1 && (
                                  <button
                                    onClick={() => removeReturnRateFromAsset(asset.id, rate.id)}
                                    className="text-red-500 hover:text-red-700 active:text-red-800 p-2 touch-manipulation"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">開始年</label>
                                  <input
                                    type="number"
                                    value={rate.startYear}
                                    onChange={(e) => updateReturnRateInAsset(asset.id, rate.id, 'startYear', Number(e.target.value))}
                                    min="1"
                                    className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">終了年</label>
                                  <input
                                    type="number"
                                    value={rate.endYear}
                                    onChange={(e) => updateReturnRateInAsset(asset.id, rate.id, 'endYear', Number(e.target.value))}
                                    min="1"
                                    className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">年利（%）</label>
                                  <input
                                    type="number"
                                    value={rate.rate}
                                    onChange={(e) => updateReturnRateInAsset(asset.id, rate.id, 'rate', Number(e.target.value))}
                                    step="0.1"
                                    className="w-full px-2 py-2 text-base border border-gray-300 rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* この資産のグラフ */}
                    {assetData && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-700">この資産の推移</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={assetData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 詳細データテーブル */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">年次詳細データ（全資産合計）</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 sm:px-4 py-2 text-left whitespace-nowrap">年</th>
                    <th className="px-2 sm:px-4 py-2 text-right whitespace-nowrap">総資産</th>
                    <th className="px-2 sm:px-4 py-2 text-right whitespace-nowrap hidden sm:table-cell">原資</th>
                    <th className="px-2 sm:px-4 py-2 text-right whitespace-nowrap">運用益</th>
                    <th className="px-2 sm:px-4 py-2 text-right whitespace-nowrap hidden md:table-cell">運用益率</th>
                  </tr>
                </thead>
                <tbody>
                  {allAssetsSimulation.combinedData.filter((_, i) => i % 5 === 0 || i === allAssetsSimulation.combinedData.length - 1).map((data) => (
                    <tr key={data.year} className="border-b hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{data.year}年目</td>
                      <td className="px-2 sm:px-4 py-2 text-right font-semibold whitespace-nowrap">¥{formatNumber(data.total)}</td>
                      <td className="px-2 sm:px-4 py-2 text-right text-gray-600 whitespace-nowrap hidden sm:table-cell">¥{formatNumber(data.principal)}</td>
                      <td className="px-2 sm:px-4 py-2 text-right text-green-600 whitespace-nowrap">¥{formatNumber(data.profit)}</td>
                      <td className="px-2 sm:px-4 py-2 text-right whitespace-nowrap hidden md:table-cell">
                        {data.principal > 0 ? ((data.profit / data.principal) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 sm:hidden">※横スクロールで全データを表示</p>
        </div>
      </div>
    </div>
  );
};

export default AssetSimulator;