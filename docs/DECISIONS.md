# DECISIONS.md

## 2026-09-06: 日本語記事の推敲と静的検査を分離する

- `humanizer-ja` を `natural-japanese` に置き換え、技術記事の設計と文脈を踏まえた推敲に使う。導入元は `coji/natural-japanese` のcommit `9a78a42964096da509b8f3e011f0085a5f080151`
- textlintと `textlint-rule-preset-ja-technical-writing` で、日本語技術文書の再現可能な検査を行う
- `textlint-rule-prh` と `prh.yml` で、blog-tech固有の製品名や技術用語の表記を統一する
- markdownlint-cli2でMarkdown構造を検査する
- `natural-japanese` のPython検査スクリプトはmiseで固定したuvから実行する
- CIでは正常fixtureと異常fixtureを使い、各検査が成功と違反を識別できることを確認する
- 記事はGit管理外の `tmp/<slug>/article.md` に置くため、公開前に対象ファイルを指定して検査する

理由:

- Agent Skillの文脈判断と静的解析の決定的な検査を分け、技術的な意味を保ちながら読みやすさを改善するため
- 既存文書の違反を今回の変更で一括修正せず、新しい記事の執筆フローから段階的に適用するため

影響:

- 記事作成時は `natural-japanese` と `writing-blog-tech-articles` の編集基準を使う
- Sanity Draftへの取り込み前にtextlint、markdownlint、natural-japaneseの検査を実行する
- textlint、技術文書プリセット、prh、markdownlint-cli2が開発依存に加わり、mise管理ツールにuvが加わる

## 2026-08-23: Sanity Studio v5 系で Content Agent 対応を行う

- `sanity` と `@sanity/vision` を `5.31.2` に揃える
- Content Agent の最低要件である Studio `5.1.0` 以上を満たしつつ、今回の更新では v6 への追加メジャーアップグレードを行わない
- Studio 更新を本番へ反映した後、認証済みブラウザでデプロイ済み Studio を一度開き、Sanity 側へスキーマを登録する
- Content Agent 自体を公開サイトへ組み込まず、Sanity Dashboard の編集支援機能として利用する

理由:

- v4 から v5 の主な互換要件は React 19.2 であり、このリポジトリの React 19.2.6、Node.js 24.13.1、styled-components 6.4.0 は要件を満たしている
- Content Agent 対応と無関係な v6 の変更を同時に取り込まず、障害時の切り分けとロールバックを単純に保つため

影響:

- Studio と Vision の依存ツリーおよび lockfile が更新される
- Astro の公開サイト、Sanity スキーマ、GROQ クエリ、データモデルには変更しない
- `main` マージ後の `Deploy Studio` 完了だけでは Content Agent 接続確認は完了せず、Studio を一度開く手順が必要になる

## 2026-08-09: ChatGPT共有会話の記事化はリポジトリローカルSkillで行う

- 当初は `gonta223/humanizer-ja` を生成記事の日本語推敲に採用した。2026-09-06の判断により `natural-japanese` へ置き換えた
- 共有リンクの記事化手順は `.agents/skills/chatgpt-share-to-sanity-draft` としてリポジトリ管理する
- ChatGPT共有リンクの取得にOpenAI APIキーやログインCookieを要求しない。取得できないリンクは本文またはエクスポートの提供を依頼する
- Sanity Draft作成は既存の `scripts/import-draft-post.ts` を再利用し、独自の投稿API実装を増やさない
- 推敲時も、元会話にない体験・数値・意見を追加しない
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
