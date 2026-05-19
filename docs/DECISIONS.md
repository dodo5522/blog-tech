# DECISIONS.md

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
