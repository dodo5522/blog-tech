# OPERATIONS.md

## 日常運用

### 新しい記事を追加する

1. Sanity Studio を開く
2. Post を作成または編集する
3. Publish する
4. CI/CD が実行されたことを確認する
5. 公開サイトでページを確認する

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
2. GitHub Actions の build / deploy が成功していることを確認する
3. 公開サイトで対象ページが更新されていることを確認する
4. 必要に応じて RSS、sitemap、OGP の反映を確認する

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

### 一次切り分けの順序

1. Sanity 側で publish 済みか確認する
2. webhook が配信されたか確認する
3. GitHub Actions の build / deploy ログを確認する
4. S3 sync と CloudFront invalidation の成否を確認する
5. 公開サイトの HTML とキャッシュ反映を確認する

---

## 保守方針

- 依存関係は定期的に更新する
- スキーマの肥大化を避ける
- 新機能追加時はドキュメントも更新する
- ルート構成変更時は CDN キャッシュ方針も見直す
- Sanity スキーマ変更時は、公開サイト側の GROQ クエリと型定義も同時に見直す
