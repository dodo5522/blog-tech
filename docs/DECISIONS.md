# DECISIONS.md

## 2026-08-09: ChatGPT共有会話の記事化はリポジトリローカルSkillで行う

- `gonta223/humanizer-ja` はリポジトリ内の `.agents/skills/humanizer-ja` へ導入し、生成記事の日本語推敲に使う
- 共有リンクの記事化手順は `.agents/skills/chatgpt-share-to-sanity-draft` としてリポジトリ管理する
- ChatGPT共有リンクの取得にOpenAI APIキーやログインCookieを要求しない。取得できないリンクは本文またはエクスポートの提供を依頼する
- Sanity Draft作成は既存の `scripts/import-draft-post.ts` を再利用し、独自の投稿API実装を増やさない
- humanizer-ja適用時も、元会話にない体験・数値・意見を追加しない
- 入力会話と一時記事は `tmp/` に置き、Gitへコミットしない

理由: 認証情報と会話データの露出を避けつつ、既存のDraft import経路を再利用して保守箇所を増やさないため。

補足:

- 共有ページの埋め込み会話データ抽出はSkill同梱のNode.jsスクリプトへ分離する
- 記事化ではユーザーの実測、ChatGPTの回答、外部一次資料を区別する
- 同一slugのimportはDraftを `createOrReplace` するため、投稿前にDraftと公開済み文書を問い合わせて人の編集を保護する

## ADR-001: フロントエンドに Astro を採用
コンテンツ中心で静的配信するサイトに向いているため採用。

## ADR-002: CMS に Sanity を採用
編集体験と将来的な拡張余地、課金移行の現実性を考慮して採用。

## ADR-003: ホスティングに S3 + CloudFront を採用
低コスト・低運用負荷で静的サイトを配信できるため採用。

## ADR-004: コンテンツ取得はビルド時に行う
公開サイトを静的に保ち、実行時依存を減らすため採用。

## ADR-005: 独自バックエンド DB は持たない
費用と運用負荷を下げるため採用。

## ADR-006: CI/CD 主導で公開する
手動アップロード運用を避け、再現性を持たせるため採用。

## ADR-007: 開発フローに GitHub Flow を採用
小規模な MVP 開発と `main` への継続デプロイ前提に最も適しているため採用。

影響:
- 作業は短命ブランチで行う
- 変更は Pull Request 経由で `main` に統合する
- `main` は常にデプロイ可能な状態を保つ
- 標準のマージ方式は merge commit とする

今後の設計判断は、日付・理由・影響範囲を添えて追記すること。

## ADR-008: 本番 deploy では Sanity fallback を無効化する

日付: 2026-05-19

理由:
- Sanity の fetch 失敗や設定ミスのまま fallback 記事を公開すると、実コンテンツの欠落に気づきにくい
- fallback content はローカルの UI 確認用であり、本番の代替データではない

影響:
- `SANITY_FALLBACK_MODE=auto|always|never` を追加する
- 本番 deploy workflow は `SANITY_FALLBACK_MODE=never` を使う
- Sanity 未設定のローカル確認は `auto` で継続できる
- Sanity 接続済み環境でオフライン表示確認をする場合だけ、明示的に `always` を使う
