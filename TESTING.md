# Testing Guide - Asset Chisel

このドキュメントでは、Asset Chiselのテスト方法について説明します。

## テスト環境

- **Vitest**: 高速なテストランナー（Vite専用）
- **React Testing Library**: Reactコンポーネントのテスト
- **jsdom**: ブラウザ環境のシミュレーション

## テストコマンド

### 基本的なテスト実行
```bash
npm test
```

### ウォッチモード（ファイル変更を監視）
```bash
npm test -- --watch
```

### UI付きテスト実行（ブラウザで結果を確認）
```bash
npm run test:ui
```

### カバレッジ測定
```bash
npm run test:coverage
```

カバレッジレポートは `coverage/` ディレクトリに生成されます。
`coverage/index.html` をブラウザで開くと詳細なレポートが見られます。

## テストファイルの配置

テストファイルは以下の命名規則に従います：

```
src/
├── utils/
│   ├── assetCalculations.js        # 実装
│   └── assetCalculations.test.js   # テスト
└── components/
    ├── MyComponent.jsx              # 実装
    └── MyComponent.test.jsx         # テスト
```

## テストの種類

### 1. ユニットテスト（計算ロジック）

**目的**: 個別の関数が正しく動作するか確認

**例**: `src/utils/assetCalculations.test.js`

```javascript
import { calculateAssetSimulation } from '../utils/assetCalculations';

it('シンプルな積立投資のシミュレーションが正しく計算できる', () => {
  const asset = {
    initialAmount: 0,
    returnRates: [{ id: 1, startYear: 1, endYear: 10, rate: 5 }],
    investments: [{ id: 1, startYear: 1, endYear: 10, monthlyAmount: 50000 }],
    events: [],
    investmentLimit: { enabled: false, amount: 0 }
  };

  const results = calculateAssetSimulation(asset, 3);
  
  expect(results[1].total).toBe(600000);
});
```

### 2. コンポーネントテスト（UI）

**目的**: コンポーネントが正しくレンダリングされるか確認

**例**:
```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

it('ボタンが表示される', () => {
  render(<MyComponent />);
  expect(screen.getByText('資産を追加')).toBeInTheDocument();
});
```

### 3. 統合テスト（ユーザー操作）

**目的**: ユーザーの操作フローが正しく動作するか確認

**例**:
```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetSimulator from './AssetSimulator';

it('資産を追加できる', async () => {
  const user = userEvent.setup();
  render(<AssetSimulator />);
  
  const addButton = screen.getByText('資産を追加');
  await user.click(addButton);
  
  expect(screen.getByText('資産3')).toBeInTheDocument();
});
```

## 現在のテストカバレッジ

現時点では、以下のテストが実装されています：

✅ **計算ロジック** (`assetCalculations.js`)
- 年利の取得
- 積立額の計算
- イベント金額の取得
- 資産シミュレーション
- 複数資産の合算
- 投資上限（NISA）の処理

## テスト実装のベストプラクティス

### 1. AAA パターンを使う
```javascript
it('テスト名', () => {
  // Arrange（準備）
  const input = { ... };
  
  // Act（実行）
  const result = myFunction(input);
  
  // Assert（検証）
  expect(result).toBe(expected);
});
```

### 2. わかりやすいテスト名
```javascript
// ❌ 悪い例
it('test1', () => { ... });

// ✅ 良い例
it('投資上限に達している場合は0を返す', () => { ... });
```

### 3. エッジケースもテストする
- 境界値（0, 上限ギリギリ）
- 異常値（負の数、null、undefined）
- 空配列や空文字列

## CI/CD での自動テスト

GitHubにpushすると、自動的にテストが実行されます（将来実装予定）。

## トラブルシューティング

### テストが失敗する場合

1. **依存関係を再インストール**
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **キャッシュをクリア**
   ```bash
   npm test -- --clearCache
   ```

3. **詳細なエラーメッセージを表示**
   ```bash
   npm test -- --reporter=verbose
   ```

## 参考リンク

- [Vitest公式ドキュメント](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
