# Site Tagline Design

## Purpose

ホーム画面の大見出し「作って、確かめて、次に使える形で残す。」を、Sanity StudioのSite settingsから編集できるようにする。

サブタイトルはブログの執筆方針を表す表示用コンテンツとして扱い、SEO説明文やRSS説明文とは分離する。

## Content Model

Site settingsに次のフィールドを追加する。

- フィールド名: `siteTagline`
- Studio上のタイトル: `Site tagline`
- 型: `string`
- 必須: いいえ
- 最大文字数: 80文字
- 用途: ホーム画面の大見出し

Studioの説明文で、ホーム画面の大見出しに使用する項目であることと、未入力時は既定文言が表示されることを明示する。

手動改行や装飾用記法は保存しない。表示時の改行はCSSの幅と通常の折り返しに任せる。

## Data Flow

1. SanityのSite settings GROQクエリで`siteTagline`を取得する。
2. `SiteSettings`型に`siteTagline`を追加する。
3. コンテンツ取得層で、空白だけの値、空文字、未定義を既定文言へ正規化する。
4. ホーム画面は正規化済みの`siteSettings.siteTagline`を大見出しへ表示する。

既定文言は「作って、確かめて、次に使える形で残す。」とする。Sanity未接続時のフォールバック設定にも同じ値を持たせる。

フォールバック判断をホーム画面へ重複実装せず、コンテンツ取得層から常に表示可能な値を返す。

## Display Behavior

`siteTagline`はホーム画面のhero見出しだけに使用する。

次の用途には使用しない。

- HTMLのtitle
- meta description
- OGP titleまたはdescription
- RSSのtitleまたはdescription
- 共通ヘッダーのサイト名

既存のBuild Ledgerレイアウト、見出しサイズ、折り返し、モバイル表示は維持する。入力値をHTMLとして解釈しない。

## Compatibility and Failure Behavior

既存のSite settingsドキュメントに`siteTagline`がなくても、ビルドと公開表示は失敗しない。

次の場合は既定文言を表示する。

- Sanity未接続でフォールバックコンテンツを使用する場合
- `siteTagline`が未定義の場合
- `siteTagline`が空文字の場合
- `siteTagline`が空白文字だけの場合

Sanity Studioでは80文字を超える入力をvalidation errorにする。公開サイトではSanityが返した文字列をAstroの通常のテキスト出力としてエスケープする。

## Documentation

少なくとも次を更新する。

- `docs/CONTENT_MODEL.md`
- 作業完了時の最新steering進捗記録

新しいセットアップ手順やシークレットは増えないため、運用文書とデプロイ文書は変更しない。

## Validation

実装後に次を確認する。

1. `pnpm format:check`が成功する。
2. `pnpm lint`が成功する。
3. `pnpm build`が成功する。
4. Sanityスキーマのビルドが成功する。
5. 値が設定されている場合、ホームの大見出しへその値が表示される。
6. 未定義、空文字、空白だけの場合、既定文言が表示される。
7. サブタイトル変更がSEOメタデータとRSSへ影響しない。
8. HTMLとして解釈され得る文字列がテキストとして安全に出力される。

## Non-goals

- 複数行サブタイトル
- リッチテキストまたはPortable Text対応
- ページごとのサブタイトル
- サブタイトルの多言語化
- SEO title、description、RSSへの自動転用
- Site settings以外のコンテンツモデル変更
