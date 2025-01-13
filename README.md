# Claude PR Review Action

Claude PR Review は、Anthropic の Claude AI を使用して Pull Request のレビューを自動化する GitHub Action です。

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
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: reusable-claude-review@main
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          target-path: 'client/ force-app/main/classes'  # オプション：レビュー対象のパスを指定
```

## 入力パラメータ

| パラメータ | 必須 | デフォルト値 | 説明 |
|------------|------|--------------|------|
| `anthropic-api-key` | はい | - | Anthropic API キー |
| `node-version` | いいえ | '20' | 使用する Node.js のバージョン |
| `pnpm-version` | いいえ | '9' | 使用する pnpm のバージョン |
| `target-path` | いいえ | - | レビュー対象のファイルパス（スペース区切りで複数指定可能） |
| `system-prompt` | いいえ | デフォルトプロンプト | カスタムシステムプロンプト |
| `message-template` | いいえ | デフォルトテンプレート | カスタムメッセージテンプレート |

## 使用しているライブラリ

- @anthropic-ai/sdk: ^0.33.1
- @octokit/rest: ^21.0.2
- zod: ^3.24.1
- TypeScript: ^5.7.2

## ディレクトリ構造

```
src/
  schemas/          # 入出力スキーマの定義
    request.ts      # レビューリクエストのスキーマ
  prompt.ts         # プロンプトテンプレート
  review.ts         # メインのレビューロジック
```

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
```

## カスタマイズ

プロンプトとメッセージテンプレートをカスタマイズできます：

```yaml
- uses: fb-inc/action-code-review@main
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    system-prompt: |
      あなたはシニアソフトウェアエンジニアとして、以下の観点でレビューを行います：
      - アーキテクチャの一貫性
      - エラーハンドリング
      - ドキュメンテーション
    message-template: |
      以下のコード差分について、重要度の高い問題を優先的に指摘してください。
```

## 注意事項

- Anthropic API の利用料金が発生します。
- 大規模な差分ファイルの場合、レビュー時間が長くなる可能性があります。
- センシティブな情報は Claude AI に送信しないようご注意ください。
- コメントはファイル単位、単一行、複数行の範囲に対して行うことができます。

## ライセンス

MIT License