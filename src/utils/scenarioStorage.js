/**
 * データ永続化とシナリオ管理ユーティリティ
 */

const STORAGE_KEY = 'asset-chisel-scenarios';
const CURRENT_SCENARIO_KEY = 'asset-chisel-current-scenario';

/**
 * シナリオデータの構造
 */
export const createScenario = (name, data) => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name,
  data,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * 全シナリオを取得
 */
export const getAllScenarios = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    return [];
  }
};

/**
 * 現在のシナリオIDを取得
 */
export const getCurrentScenarioId = () => {
  return localStorage.getItem(CURRENT_SCENARIO_KEY);
};

/**
 * 現在のシナリオを設定
 */
export const setCurrentScenarioId = (id) => {
  localStorage.setItem(CURRENT_SCENARIO_KEY, id);
};

/**
 * シナリオを保存（新規または上書き）
 */
export const saveScenario = (scenario) => {
  try {
    const scenarios = getAllScenarios();
    const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
    
    const updatedScenario = {
      ...scenario,
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      scenarios[existingIndex] = updatedScenario;
    } else {
      scenarios.push(updatedScenario);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    setCurrentScenarioId(updatedScenario.id);
    
    return updatedScenario;
  } catch (error) {
    console.error('Failed to save scenario:', error);
    throw new Error('シナリオの保存に失敗しました');
  }
};

/**
 * シナリオを削除
 */
export const deleteScenario = (id) => {
  try {
    const scenarios = getAllScenarios();
    const filtered = scenarios.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // 削除したシナリオが現在のシナリオだった場合
    if (getCurrentScenarioId() === id) {
      const newCurrent = filtered.length > 0 ? filtered[0].id : null;
      if (newCurrent) {
        setCurrentScenarioId(newCurrent);
      } else {
        localStorage.removeItem(CURRENT_SCENARIO_KEY);
      }
    }
    
    return filtered;
  } catch (error) {
    console.error('Failed to delete scenario:', error);
    throw new Error('シナリオの削除に失敗しました');
  }
};

/**
 * シナリオをIDで取得
 */
export const getScenarioById = (id) => {
  const scenarios = getAllScenarios();
  return scenarios.find(s => s.id === id);
};

/**
 * JSONファイルとしてエクスポート
 */
export const exportToJSON = (scenario) => {
  const json = JSON.stringify(scenario, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${scenario.name}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * JSONファイルからインポート
 */
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        // 基本的な検証
        if (!imported.data) {
          throw new Error('Invalid scenario format');
        }
        
        // 新しいIDを付与（重複を避けるため）
        const newScenario = {
          ...imported,
          id: Date.now().toString(),
          name: imported.name ? `${imported.name} (インポート)` : 'インポートしたシナリオ',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        resolve(newScenario);
      } catch (error) {
        reject(new Error('JSONファイルの読み込みに失敗しました'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * 全データをクリア
 */
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_SCENARIO_KEY);
  } catch (error) {
    console.error('Failed to clear data:', error);
    throw new Error('データのクリアに失敗しました');
  }
};

/**
 * デフォルトシナリオを作成
 */
export const createDefaultScenario = (data) => {
  return createScenario('新しいシナリオ', data);
};