# Asset Chisel - Vercelデプロイ手順書

このドキュメントでは、Asset Chisel（資産形成シミュレーター）をVercelにデプロイする手順を説明します。

## 📦 必要なもの

- GitHubアカウント（推奨）
- ダウンロードした`asset-chisel.zip`

---

## 🚀 方法1: GitHub経由でデプロイ（推奨）

### ステップ1: プロジェクトファイルを解凍

`asset-chisel.zip`を解凍してください。
Windows の場合は、右クリック→「すべて展開」で解凍できます。

### ステップ2: GitHubリポジトリを作成

1. [GitHub](https://github.com)にアクセスしてログイン
2. 右上の「+」→「New repository」をクリック
3. Repository name: **`asset-chisel`**
4. **Public**を選択
5. ⚠️ **「Add a README file」のチェックは外す**
6. ⚠️ **「.gitignore」と「license」も「None」のまま**
7. 「Create repository」をクリック

### ステップ3: コードをGitHubにプッシュ

解凍したプロジェクトフォルダで以下のコマンドを実行：

**Git Bashまたはターミナルで：**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/asset-chisel.git
git branch -M main
git push -u origin main
```

**注意：** YOUR_USERNAMEは自分のGitHubユーザー名に置き換えてください

### ステップ4: Vercelにデプロイ

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」をクリック
3. 「Continue with GitHub」を選択
4. GitHubの認証を許可
5. ダッシュボードで「New Project」をクリック
6. GitHubリポジトリ一覧から`asset-chisel`を選択
7. 「Deploy」ボタンをクリック

**完了！** 数分でデプロイが完了し、URLが発行されます。

例：`https://asset-chisel.vercel.app`

---

## 🎯 方法2: Vercel CLIでデプロイ

### ステップ1: Node.jsとnpmのインストール

まず、Node.jsがインストールされているか確認：

```bash
node --version
npm --version
```

インストールされていない場合は[Node.js公式サイト](https://nodejs.org/)からダウンロード

### ステップ2: プロジェクトファイルを解凍

`asset-chisel.zip`を解凍し、フォルダを開きます

### ステップ3: Vercel CLIをインストール

```bash
npm install -g vercel
```

### ステップ4: Vercelにログイン

```bash
vercel login
```

メールアドレスを入力すると、確認メールが届きます。

### ステップ5: デプロイ

```bash
vercel
```

質問に答えるだけで自動的にデプロイされます：
- Set up and deploy? → `Y`
- Which scope? → 自分のアカウントを選択
- Link to existing project? → `N`
- What's your project's name? → そのままEnter（または`asset-chisel`と入力）
- In which directory is your code located? → `./`

**完了！** URLが表示されます。

### 本番環境にデプロイ

```bash
vercel --prod
```

---

## ✅ デプロイ後の確認

デプロイが成功すると、以下のようなURLが発行されます：
```
https://asset-chisel.vercel.app
```

このURLをブラウザで開いて、アプリが正常に動作しているか確認してください。

---

## 🔄 更新方法

### GitHub経由の場合

コードを変更したら：

```bash
git add .
git commit -m "Update description"
git push
```

Vercelが自動的に再デプロイします。

### Vercel CLI の場合

```bash
vercel --prod
```

---

## 🎨 カスタムドメイン設定（オプション）

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Domains」
3. 「Add」をクリックして独自ドメインを追加

---

## 📱 スマホで使う

デプロイが完了したら：
1. スマホのブラウザでURLを開く
2. ブラウザのメニューから「ホーム画面に追加」
3. アプリのように使える！

---

## ❓ トラブルシューティング

### Gitがインストールされていない（Windows）

[Git for Windows](https://gitforwindows.org/)をダウンロードしてインストール

### ビルドエラーが出る場合

依存関係を確認：
```bash
npm install
npm run build
```

ローカルでビルドが成功するか確認してから再デプロイ

### 画面が真っ白

ブラウザの開発者ツール（F12）でエラーを確認

---

## 📚 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vite公式ドキュメント](https://vitejs.dev/)
- [React公式ドキュメント](https://react.dev/)

---

## 🎉 完成！

これでAsset Chiselが世界中からアクセス可能になりました！

**あなたの未来を彫り込む道具** として、ぜひご活用ください。
