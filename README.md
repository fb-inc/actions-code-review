# Claude PR Review Action

Claude PR Review は、Anthropic の Claude AI を使用して Pull Request のレビューを自動化する再利用可能な GitHub Action です。

## 機能

- Pull Request の差分を自動的に分析
- Claude AI による高品質なコードレビュー
- GitHub PR コメントとしてレビュー結果を自動投稿

## 必要要件

- Node.js 20以上
- pnpm 9以上
- Anthropic API キー

## セットアップ

1. Anthropic API キーを取得します。
2. GitHub リポジトリの Secrets に `ANTHROPIC_API_KEY` を追加します。
3. ワークフローファイル（例：`.github/workflows/pr-review.yml`）を作成します。

```yaml
name: PR Review

on:
  pull_request:
    # 任意のPRイベントを指定
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: fb-inc/actions-code-review@main
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          # オプション: Node.jsとpnpmのバージョンを指定
          # node-version: '20'
          # pnpm-version: '9'
```

## 入力パラメータ

| パラメータ | 必須 | デフォルト値 | 説明 |
|------------|------|--------------|------|
| `anthropic-api-key` | はい | - | Anthropic API キー |
| `node-version` | いいえ | '20' | 使用する Node.js のバージョン |
| `pnpm-version` | いいえ | '9' | 使用する pnpm のバージョン |

## 機能の仕組み

1. ベースブランチとPRブランチの差分を抽出します。
2. 差分をClaude AIに送信し、コードレビューを実行します。
3. レビュー結果をGitHub PRにコメントとして投稿します。

## ローカル開発

```bash
# 依存関係のインストール
pnpm install

# TypeScriptのビルド
pnpm build

# リンター実行
pnpm lint

# コードフォーマット
pnpm format

# テスト実行
pnpm test
```

## ライセンス

MIT License

## 注意事項

- Anthropic API の利用料金が発生します。
- 大規模な差分ファイルの場合、レビュー時間が長くなる可能性があります。
- センシティブな情報は Claude AI に送信しないようご注意ください。

## コントリビューション

1. このリポジトリをフォークします。
2. 新しいブランチを作成します。
3. 変更を加えてコミットします。
4. プルリクエストを作成します。