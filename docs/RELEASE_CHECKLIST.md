# RELEASE_CHECKLIST.md

## リリース前チェック

- [ ] `pnpm install` が成功する
- [ ] ローカルビルドが成功する
- [ ] TypeScript エラーが残っていない
- [ ] lint が通る
- [ ] ローカルで主要ページ表示が正常
- [ ] 下書きが本番ビルドに含まれない
- [ ] canonical URL が正しい
- [ ] sitemap が生成される
- [ ] RSS が生成される
- [ ] robots.txt が正しい
- [ ] 404 ページが存在する
- [ ] 環境変数の説明がある
- [ ] deploy workflow が正しい AWS リソースを参照している
- [ ] `pnpm sanity:dev` で Studio が起動する

## CMS チェック

- [ ] 必要スキーマが存在する
- [ ] 動作確認用のサンプルコンテンツがある
- [ ] Site Settings が設定済み
- [ ] slug の一意性が担保されている
- [ ] 画像フィールドが問題なく使える

## AWS チェック

- [ ] S3 バケットが存在する
- [ ] CloudFront Distribution が存在する
- [ ] IAM 権限が最小権限になっている
- [ ] OIDC 用 IAM Role の trust policy が `main` ブランチに限定されている
- [ ] invalidation が機能する
- [ ] 独自ドメイン/TLS が必要なら動作する

## リリース後チェック

- [ ] CloudFront 経由でホーム画面が表示される
- [ ] 記事一覧が表示される
- [ ] 記事詳細が表示される
- [ ] 存在しない URL で 404 ステータスと 404 ページが返る
- [ ] メタデータがページソースに出ている
- [ ] RSS が参照できる
- [ ] sitemap が参照できる
- [ ] 目立つリンク切れがない
- [ ] デプロイ手順が文書に反映されている
