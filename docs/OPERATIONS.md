# OPERATIONS.md

## 日常運用

### 新しい記事を追加する

1. Sanity Studio を開く
2. Post を作成または編集する
3. Publish する
4. CI/CD が実行されたことを確認する
5. 公開サイトでページを確認する

### Markdown パッケージから Draft を作成する

`article.md` と `images/` を含む記事パッケージは、import スクリプトで Sanity Draft として取り込める。

```bash
pnpm sanity:import-draft -- --source tmp/<package-dir> --dry-run
pnpm sanity:import-draft -- --source tmp/<package-dir> --slug pve-gpu-passthrough-linux-desktop
```

- `--dry-run` は Sanity に書き込まず、変換結果の概要だけを表示する
- 実行には `SANITY_PROJECT_ID` / `SANITY_DATASET` / `SANITY_API_VERSION` / `SANITY_WRITE_TOKEN` が必要
- 生成される Post は `_id` が `drafts.*` の Draft document になる
- `publishedAt` は validation を通しやすくするため import 時刻で仮設定される。公開前に Studio で確認する
- Markdown の表は、専用テーブルスキーマを増やさず `markdown` の `codeBlock` として保持する
- `tmp/` の Markdown は Astro 側から直接読まない。公開サイトで表示確認するには、Sanity Studio で対象 Draft を publish する

### ChatGPT共有リンクからDraftを作る

リポジトリローカルの `.agents/skills/chatgpt-share-to-sanity-draft` を使う。公開共有リンクを取得し、会話の内容を技術記事へ再構成した後、`humanizer-ja` で推敲して既存の `sanity:import-draft` へ渡す。

- 通常の `https://chatgpt.com/share/...` 公開リンクの閲覧にOpenAI APIキーは使わない
- アクセス制限付きリンクを認証回避して取得しない。取得できない場合は会話本文またはエクスポートを入力にする
- Sanityへの書き込みには `SANITY_WRITE_TOKEN` と対象project/datasetへのdocument・asset作成更新権限が必要
- トークンはプロセス環境、またはGit管理外の `.env` / `.env.local` にだけ置く
- 共有会話と生成途中の記事はGit管理外の `tmp/` に置く
- importはDraft作成まで。publishはSanity Studioで内容を確認した後に別途行う

### サイト設定を更新する

1. Site Settings ドキュメントを開く
2. メタデータ等を更新する
3. Publish する
4. デプロイ結果を確認する

### タグを追加する

1. Tag を作成する
2. Publish する
3. 記事に紐付ける
4. タグページを確認する

### コンテンツ publish 後の確認

1. Sanity webhook が成功していることを確認する
2. GitHub Actions の `Deploy Site` が成功していることを確認する
3. 公開サイトで対象ページが更新されていることを確認する
4. 必要に応じて RSS、sitemap、OGP の反映を確認する

### Studio コード変更後の確認

1. `main` へマージ後、GitHub Actions の `Deploy Studio` が起動していることを確認する
2. `Load Studio deploy targets from Terraform outputs` が成功していることを確認する
3. `Build` / `s3 sync dist-studio/` / CloudFront invalidation が成功していることを確認する
4. Studio の CloudFront URL で更新が反映されていることを確認する

### Studio インフラ変更時の運用

`deploy-studio.yml` は `terraform apply` を実行しないため、`infra/` を変更した場合は先にインフラを反映する。

1. インフラ管理者が `terraform -chdir=infra init/plan/apply` を実行する
2. `terraform -chdir=infra output -raw studio_bucket_name` と `studio_cloudfront_distribution_id` が取得できることを確認する
3. `Deploy Studio` を `workflow_dispatch` で実行する（または `main` push の自動起動を待つ）
4. `Load Studio deploy targets from Terraform outputs` の成功を確認する

### 実記事の表示確認

1. 記事詳細で見出し、本文余白、リスト、コードブロック、画像キャプションが崩れていないことを確認する
2. 記事ページの HTML で `og:type=article`、`og:image`、`twitter:card`、canonical URL が意図通りであることを確認する
3. OGP 画像は記事の `ogImage` を優先し、未設定なら `coverImage`、それも未設定なら Site Settings の `defaultOgImage` を使う
4. Sanity 接続済みの状態で固定 fallback 記事の表示確認をする場合だけ、ローカルで `SANITY_FALLBACK_MODE=always` を使う

### Sanity webhook 設定確認

1. Sanity webhook の送信先が `https://api.github.com/repos/<owner>/<repo>/dispatches` になっていることを確認する
2. `Projection` が `{ "event_type": "sanity-content-changed" }` で、送信 body に `event_type` が含まれることを確認する
3. webhook 用トークンが HTTP Header の `Authorization: Bearer <token>` に設定され、失効期限やローテーション方針があることを確認する
4. webhook 用トークンに repository dispatch 実行権限（Fine-grained PAT なら `Contents: Read and write`）があることを確認する
5. GitHub Actions 側で `Deploy Site` workflow が `repository_dispatch` を受けることを確認する
6. `Deploy Studio` workflow は webhook では起動しない（`main` push または手動実行）

### コード変更を含む release 後の確認

1. CloudFront 経由でホームと主要ページが表示されることを確認する
2. 新規または更新したルートで 404 やリンク切れがないことを確認する
3. canonical URL と meta 情報が意図通りであることを確認する
4. draft が公開ページに含まれていないことを確認する

---

## 障害対応

### 記事を公開したのにサイトへ反映されない

確認すること:

- Sanity webhook の配送状況
- CI ワークフローの実行結果
- build ログ
- S3 sync の結果
- CloudFront invalidation の結果

### コンテンツ更新後に build 失敗

確認すること:

- 必須項目の欠落
- 不正な slug
- リッチテキストの想定外データ
- スキーマと実データの不整合

### AWS デプロイ失敗

確認すること:

- IAM 権限
- バケット名
- Distribution ID
- リージョン不整合
- 認証方式（OIDC / アクセスキー）

### 404 ページの返却が期待と違う

確認すること:

- CloudFront の Custom Error Response で `404 -> /404.html` が設定されているか
- オリジン（S3）側の `404.html` が配信されているか
- 無効化対象に `/*` を含めた invalidation が実行されたか
- テストURLで HTTP ステータスが 404 になっているか

### 一次切り分けの順序

1. Sanity 側で publish 済みか確認する
2. webhook が配信されたか確認する
3. GitHub Actions の build / deploy ログを確認する
4. S3 sync と CloudFront invalidation の成否を確認する
5. 公開サイトの HTML とキャッシュ反映を確認する

### webhook 失敗時の再送手順

1. Sanity 側 webhook ログで失敗イベントを特定する
2. 失敗原因（401/403/404/422/5xx）を確認する
3. 403 の場合は GitHub トークン権限（Fine-grained PAT なら `Contents: Read and write`）と対象 repository へのアクセスを見直す
4. 422 の場合は Sanity webhook の `Projection` が `{ "event_type": "sanity-content-changed" }` になっていることを確認する
5. Secret や endpoint を修正する
6. Sanity 管理画面から対象 webhook を再送する
7. GitHub Actions の `Deploy Site` 実行を確認する

---

## 保守方針

- 依存関係は定期的に更新する
- スキーマの肥大化を避ける
- 新機能追加時はドキュメントも更新する
- ルート構成変更時は CDN キャッシュ方針も見直す
- Sanity スキーマ変更時は、公開サイト側の GROQ クエリと型定義も同時に見直す
