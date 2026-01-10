import React, { useState, useRef } from 'react';
import { Save, FolderOpen, Download, Upload, Trash2, Plus } from 'lucide-react';

const ScenarioManager = ({ 
  scenarios, 
  currentScenarioId, 
  onScenarioChange, 
  onSave,
  onDelete,
  onExport,
  onImport,
  onNew
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef(null);

  const currentScenario = scenarios.find(s => s.id === currentScenarioId);

  const handleRename = () => {
    if (newName.trim() && currentScenario) {
      onSave({ ...currentScenario, name: newName.trim() });
      setIsRenaming(false);
      setNewName('');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImport(file);
        e.target.value = ''; // リセット
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* シナリオ名表示・編集 */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-gray-600 text-sm sm:text-base whitespace-nowrap">💾 シナリオ:</span>
          {isRenaming ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="シナリオ名"
                autoFocus
              />
              <button
                onClick={handleRename}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsRenaming(false);
                  setNewName('');
                }}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <select
                value={currentScenarioId || ''}
                onChange={(e) => onScenarioChange(e.target.value)}
                className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-0"
              >
                {scenarios.length === 0 && (
                  <option value="">シナリオなし</option>
                )}
                {scenarios.map(scenario => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
              {currentScenario && (
                <button
                  onClick={() => {
                    setNewName(currentScenario.name);
                    setIsRenaming(true);
                  }}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                  title="名前を変更"
                >
                  ✏️
                </button>
              )}
            </>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onNew}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap touch-manipulation"
            title="新規シナリオ"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新規</span>
          </button>

          <button
            onClick={() => currentScenario && onSave(currentScenario)}
            disabled={!currentScenario}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base whitespace-nowrap touch-manipulation"
            title="保存"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">保存</span>
          </button>

          <button
            onClick={() => currentScenario && onExport(currentScenario)}
            disabled={!currentScenario}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 active:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base whitespace-nowrap touch-manipulation"
            title="エクスポート"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">出力</span>
          </button>

          <button
            onClick={handleImportClick}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 active:bg-indigo-700 transition-colors text-sm sm:text-base whitespace-nowrap touch-manipulation"
            title="インポート"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">読込</span>
          </button>

          {scenarios.length > 1 && currentScenario && (
            <button
              onClick={() => {
                if (window.confirm(`「${currentScenario.name}」を削除しますか？`)) {
                  onDelete(currentScenario.id);
                }
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors text-sm sm:text-base whitespace-nowrap touch-manipulation"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">削除</span>
            </button>
          )}
        </div>
      </div>

      {/* ファイル入力（非表示） */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 最終更新日時 */}
      {currentScenario && (
        <div className="mt-3 text-xs sm:text-sm text-gray-500">
          最終更新: {new Date(currentScenario.updatedAt).toLocaleString('ja-JP')}
        </div>
      )}
    </div>
  );
};

export default ScenarioManager;
