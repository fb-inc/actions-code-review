# Claude PR Review Action

Claude AIを活用したGitHubプルリクエストの自動レビューアクションです。コードの品質向上とレビュープロセスの効率化を支援します。

## 主な機能

このアクションは、プルリクエストに対して以下の2段階のレビューを実行します：

1. システムレビュー：プルリクエスト全体を対象とした総合的な評価を行います。アーキテクチャの一貫性やシステム全体への影響を分析します。

2. 個別ファイルレビュー：各変更ファイルに対して詳細なレビューを実行します。コーディング規約、潜在的な問題、改善提案などを指摘します。

## 使い方

### 1. ワークフローの設定

`.github/workflows/pr-review.yml`に以下の設定を追加します：

```yaml
name: PR Review

on:
  pull_request:
    types: [opened, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: fb-inc/actions-code-review@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 2. パラメータの説明

| パラメータ           | 必須 | デフォルト値                                       | 説明                                                                                                           |
| -------------------- | ---- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| anthropic-api-key    | ○    | -                                                  | ClaudeによるコードレビューのためのAPIキー。GitHub Secretsでの管理を推奨。                                      |
| node-version         | ×    | 22                                                 | 実行環境のNode.jsバージョン                                                                                    |
| pnpm-version         | ×    | 9                                                  | パッケージマネージャのpnpmバージョン                                                                           |
| target-path          | ×    | "force-app/main/default/classes client ':!\*.xml'" | レビュー対象のファイルやディレクトリをスペース区切りで指定。glob形式のパターンマッチングに対応。               |
| unit-review-prompt   | ×    | 内蔵プロンプト                                     | 個別のファイルレビュー時の評価基準。コーディング規約、アーキテクチャ制約、パフォーマンス要件などを含める。     |
| system-review-prompt | ×    | 内蔵プロンプト                                     | プルリクエスト全体のレビュー時の評価基準。システムアーキテクチャ、サービス間の依存関係、非機能要件などを評価。 |
| pr-number            | ×    | ${{ github.event.pull_request.number }}            | プルリクエスト番号。手動実行時は明示的に指定可能。                                                             |
| pr-body              | ×    | ${{ github.event.pull_request.body }}              | プルリクエストの説明文。レビュー時の文脈理解に使用。                                                           |
| base-sha             | ×    | ${{ github.event.pull_request.base.sha }}          | 比較元のコミットハッシュ。差分の取得に使用。                                                                   |
| head-sha             | ×    | ${{ github.event.pull_request.head.sha }}          | 比較先のコミットハッシュ。base-shaとの差分を取得。                                                             |

### 3. カスタマイズ

レビュー基準は`unit-review-prompt`と`system-review-prompt`で調整可能です。以下は設定例です：

```yaml
with:
  unit-review-prompt: |
    以下の観点でレビューを行ってください：
    - 命名規則の遵守
    - テストの充実度
    - エラーハンドリング
  system-review-prompt: |
    以下の点に注目してレビューを行ってください：
    - マイクロサービス間の整合性
    - セキュリティリスク
    - パフォーマンスへの影響
```

## 開発者向け情報

- Node.js v22以降
- pnpm v9以降
- Claude 3.5 Sonnet（2024年10月22日版）使用

## ライセンス

MIT License
