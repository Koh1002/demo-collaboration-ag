# Secure Multi-Agent Orchestration Demo

セキュアなマルチエージェント連携の概念実証デモWebアプリケーションです。

## このデモで表現している概念

1. **中央オーケストレーター** がユーザーの依頼を受け付け、各環境の代表エージェントに問い合わせる
2. 問い合わせ前に **認証認可チェック**（mTLS、エージェント認証、ポリシー評価）が行われる
3. 各環境は **生データ（raw data）を外部に出さない** — ローカル計算のみ実行
4. オーケストレーターが受け取るのは **統計情報（集計結果）のみ**
5. **個票・生データ要求は Policy で DENY** される
6. オーケストレーターは途中経過を評価しながら逐次問い合わせを行い、完了後にユーザーへ報告する

> 将来的な企業間マルチエージェント連携基盤の縮図として設計されています。

## セットアップ

```bash
npm install
```

## 起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 対応シナリオ一覧

| # | シナリオ | ユーザー入力例 | 動作 |
|---|---------|--------------|------|
| 1 | 偶数球の合計を比較 | 「AとBの偶数球の合計を比較して」 | A/Bに sum_even_numbers を問い合わせ、比較結果を報告 |
| 2 | 奇数球の総数を算出 | 「奇数球の件数をA/Bそれぞれ数えて、総数を教えて」 | A/Bに count_odd_numbers を問い合わせ、合算して報告 |
| 3 | 平均値で比較（集計のみ） | 「平均値が高い環境を教えて。ただし個別データは取得しないで」 | A/Bに average_all_numbers を問い合わせ、比較結果を報告 |
| 4 | 生データ要求（拒否） | 「Aの球を全部見せて」 | Policy DENY — 拒否理由を表示 |

## 技術スタック

- **Next.js** (App Router, Static Export)
- **React** 19
- **TypeScript**
- **Tailwind CSS** 4
- **Framer Motion**

## プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # メインページ（オーケストレーション制御）
│   └── globals.css         # グローバルスタイル
├── components/
│   ├── ChatPanel.tsx       # 左カラム: チャットUI
│   ├── FieldView.tsx       # 右カラム: アーキテクチャ可視化
│   ├── OrchestratorNode.tsx # オーケストレーターノード
│   ├── AgentNode.tsx       # 代表エージェントノード
│   ├── EnvironmentZone.tsx # 環境ゾーン（保護領域）
│   ├── SecureRequestCard.tsx # 認証認可カード
│   ├── PolicyStatusBadge.tsx # ALLOW/DENY バッジ
│   ├── EventTimeline.tsx   # イベントログタイムライン
│   ├── ResultCard.tsx      # 統計結果カード
│   ├── ScenarioButtons.tsx # サンプルシナリオボタン
│   └── StatusHeader.tsx    # フェーズ状態表示
├── lib/
│   ├── types.ts            # 型定義
│   ├── constants.ts        # 定数・カラーパレット
│   ├── data.ts             # 環境データ・シナリオ定義
│   ├── parser.ts           # ユーザー入力意図解析
│   ├── policy.ts           # ポリシーエンジン（模擬）
│   ├── orchestrator.ts     # オーケストレーションロジック
│   └── formatters.ts       # 結果フォーマッタ
```

## このデモでは簡易化している点

- **認証基盤**: mTLS、Agent Identity は UI 演出のみ。実際の認証処理は行っていません
- **Policy Engine**: ルールベースの簡易判定。OPA 等の本格的なエンジンは未接続
- **A2A 通信**: Agent 間通信は JavaScript の関数呼び出しで模擬。実際のプロトコルは未実装
- **MCP 接続**: Model Context Protocol は未接続。ローカル関数で代替
- **LLM API**: 自然言語処理は正規表現ベースのルールマッチング
- **データ永続化**: すべてメモリ上。リロードでリセットされます
- **監査ログ**: UI 表示のみ。永続化やエクスポートは未実装

## GitHub Actions

### CI ワークフロー (`.github/workflows/ci.yml`)

すべてのブランチで lint / typecheck / build を実行します。

- **トリガー**: `main` への push、`claude/**` への push、`main` への PR

### GitHub Pages デプロイ (`.github/workflows/deploy.yml`)

`main` ブランチへの push 時に自動で GitHub Pages へデプロイします。

1. **Lint** → **Type check** → **Build** (静的エクスポート)
2. `out/` を GitHub Pages artifact としてアップロード
3. GitHub Pages へデプロイ

#### GitHub Pages の有効化手順

1. リポジトリの **Settings → Pages** を開く
2. **Source** で **GitHub Actions** を選択
3. `main` ブランチに push すると自動デプロイされる
4. デプロイ後 `https://<owner>.github.io/demo-collaboration-ag/` でアクセス可能

手動デプロイは **Actions** タブから `Deploy to GitHub Pages` → **Run workflow** でも実行できます。

### ローカルでの確認方法

```bash
# Lint
npm run lint

# 型チェック
npm run typecheck

# ビルド
npm run build
```

### CI 失敗時の確認箇所

- **Lint 失敗**: `npm run lint` をローカルで実行し、エラーを修正
- **Type check 失敗**: `npm run typecheck` でエラー箇所を確認
- **Build 失敗**: `npm run build` でビルドエラーを確認

## 本番実装で差し替える想定箇所

| 箇所 | 現在の実装 | 本番での差し替え先 |
|------|-----------|------------------|
| 認証基盤 | UI演出のみ | OAuth 2.0 / mTLS / SPIFFE |
| Policy Engine | `lib/policy.ts` ルールベース | OPA / Cedar / カスタムエンジン |
| Agent Registry | ハードコード | 動的 Agent Discovery サービス |
| A2A 通信 | 関数呼び出し | gRPC / HTTP / A2A Protocol |
| MCP 接続 | 未実装 | Model Context Protocol SDK |
| 監査ログ | UI表示のみ | 永続化 DB + エクスポート機能 |
| 意図解析 | 正規表現 | LLM API (Claude, etc.) |
| データストア | メモリ上の配列 | 各環境の DB / Data Lake |

## Codex に委譲しやすい追加開発候補

以下のタスクは独立性が高く、Codex への委譲に適しています:

### UI 拡張
- [ ] Agent Registry 風の管理 UI 追加（`components/AgentRegistry.tsx`）
- [ ] 認証認可演出の詳細化（段階的なプログレスバー追加）
- [ ] モバイルレスポンシブ対応
- [ ] ダークモード対応（オプション）
- [ ] アニメーション速度の設定 UI

### ロジック拡張
- [ ] シナリオ追加（max/min 比較、条件付き集計など）
- [ ] `lib/parser.ts` の意図解析パターン拡充
- [ ] `lib/formatters.ts` の結果説明文の高度化
- [ ] 複数ステップの逐次評価シナリオ（A の結果を見て B への問い合わせ内容を変える）

### インフラ・バックエンド
- [ ] バックエンド API 接続（`lib/orchestrator.ts` を API クライアントに差し替え）
- [ ] A2A 風メッセージモデル導入（`lib/types.ts` に A2A スキーマ追加）
- [ ] 監査ログ永続化（ローカル DB or API エンドポイント）
- [ ] GitHub Pages デプロイワークフロー追加
- [ ] Vercel デプロイ設定

### テスト
- [ ] `lib/parser.ts` のユニットテスト
- [ ] `lib/policy.ts` のユニットテスト
- [ ] `lib/orchestrator.ts` のユニットテスト
- [ ] E2E テスト（Playwright）

## ライセンス

Private — 社内デモ用
