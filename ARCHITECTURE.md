> **ステータス: 確定版。** 方針を変えるときは本ファイルを直し、PR で履歴を残す。

# アーキテクチャ

作るもの・速度目標は [CONCEPT.md](CONCEPT.md) を唯一の真実とする。ここには**どう作るか**だけを書く。

## 設計原則
1. **配信するのは HTML 1 本だけ。** CSS はインライン、JS・フォント・画像は配信しない。リクエストが増える変更は原則却下する。禁じるのは**実行されるコード**であり、ブラウザに読ませるだけの宣言（speculation rules）は対象外。
2. **速度は CI が守る。** 人間の注意力を当てにしない。[CONCEPT.md の速度目標](CONCEPT.md)（転送量 15KB / JS 0 バイト / Lighthouse 100）を**予算**とみなし、超えたらビルドを失敗させる。
3. **ビルド時にできることを実行時にやらない。** 言語切替も対訳判定も生成時に確定させる。
4. **不可逆なのは URL と記事ファイルの形だけ。** それ以外（SSG・ホスティング・CSS）は迷ったら即決して先に進む。
5. **機能を足すときは、まず何を消せるか考える。** 追加は既定で却下、残すには理由が要る。

## 全体の流れ
```
posts/*.md を書く
  → git push (main)
  → GitHub Actions: astro build
  → 速度チェック（転送量 / JS バイト数 / Lighthouse）  ← ここで落ちたらデプロイしない
  → wrangler deploy → Cloudflare のエッジへ
```

## ファイル構成
```
posts/                    記事の原本。ここだけが人間の書く場所
  why-sre-is-boring.ja.md
  why-sre-is-boring.en.md
src/
  content.config.ts       コレクション定義（★ src/content/config.ts ではない）
  pages/
    index.astro           / → /ja/ の扱い（落とし穴を参照）
    [lang]/index.astro    言語ごとの記事一覧
    [lang]/[slug].astro   記事ページ
    [lang]/rss.xml.ts     フィード
  layouts/Base.astro      唯一のレイアウト。<style> と speculation rules はここに直書き
public/
  _headers                キャッシュ制御。dist/ にそのままコピーされる
astro.config.mjs
wrangler.jsonc            assets.directory = ./dist
.github/workflows/deploy.yml
```
**作らないもの**: コンポーネントディレクトリ（Base.astro と記事テンプレだけで足りる）、CSS ファイル（レイアウトに直書き）、favicon・画像（配信しない）、テーマ設定・サイト設定 JSON（定数はレイアウトに直書き）。`public/` に置くのは `_headers` だけ。

## 技術選定
すべて 2026-08-09 決定。

| 項目 | 採用 | 捨てた案 | 理由 | 可逆性 |
|---|---|---|---|---|
| SSG | **Astro** | 自作ビルドスクリプト / Hugo | 既定で JS 0 バイト出力。`build.inlineStylesheets` と i18n ルーティングが公式機能で、自作すると一番面倒な一覧・RSS・対訳リンクが標準で付く | 可逆。出力が静的 HTML なので乗り換え可能 |
| ホスティング | **Cloudflare Workers（static assets）** | Cloudflare Pages / GitHub Pages | 公式が新規プロジェクトに推奨するのは Pages ではなく Workers。静的アセットへのリクエストは**無料・無制限**、Worker スクリプト無しで配信できる | 可逆。dist/ を別の場所に置くだけ |
| CSS | **レイアウトに直書き + `inlineStylesheets: 'always'`** | 外部 CSS / Tailwind | 外部 CSS は 1 リクエスト増える。この規模でクラス設計は要らない | 可逆 |
| ダークモード | **`prefers-color-scheme` のみ** | 切替ボタン | 切替の保存には JS と localStorage が要る。原則 1 に反する | 可逆 |
| CI | **GitHub Actions** | Cloudflare の Git 連携ビルド | デプロイ前に速度チェックを挟みたい。Cloudflare 側ビルドだと合否判定を差し込めない | 可逆 |
| キャッシュ | **`_headers` で `max-age=300, stale-while-revalidate=86400`** | 既定の `must-revalidate` / 長い `max-age` | 既定のままだと再訪のたびに往復が発生する。一方 HTML はファイル名にハッシュを付けられないので長い `max-age` は記事の更新が届かなくなる。**古いものを即返し、裏で更新**が唯一の妥協点 | 可逆 |
| 遷移の先読み | **Speculation Rules（prerender）** | 何もしない / JS のルーター | 宣言的な JSON で、実行されるコードは無い。一覧 → 記事の遷移が体感 0ms になる。Firefox は非対応だが、未対応ブラウザは単に無視するだけで害が無い | 可逆 |

## データ
DB は持たない。**扱うデータは記事ファイルだけで、個人情報は一切持たない**（フォームもログインも解析も無い）。

```markdown
---
title: SRE の仕事はつまらないほうがいい
date: 2026-08-09
lang: ja          # ja | en
description: 一覧と <meta> に使う 1 行
---
```
- **ファイル名 = `<slug>.<lang>.md`**。slug が URL になり、**両言語で同じ slug を使ったものだけが対訳**とみなされる。対訳リンクは「同じ slug の別 lang が存在するか」だけで判定し、フロントマターに相互参照を書かない（二重管理になるため）。
- slug は英数字とハイフンのみ。**一度公開した slug は変えない**（URL が変わると外部リンクが切れる）。
- 日付はファイル名に入れず frontmatter に置く。日付を打ち間違えても URL が変わらないようにするため。

## 運用
- **デプロイ**: main への push で全自動。手動デプロイの手順は用意しない。
- **壊れたと気づく手段**: デプロイは速度チェックを通らないと実行されないので、「気づかないうちに遅くなる」経路が無い。サイトが落ちたことは自分が読めなくなるので気づく（無料の外形監視は v1 では入れない）。
- **秘密情報**: `CLOUDFLARE_API_TOKEN` を GitHub Actions の secrets に置く。リポジトリには入れない。トークンの権限は Workers のデプロイのみに絞る。
- **ドメイン**: v1 は `*.workers.dev` のサブドメイン。独自ドメインは後から追加する（可逆）。

## 落とし穴
着手前に確認済み。すべて公式ドキュメントで裏を取ったもの。

- **`build.inlineStylesheets` の既定は `'auto'`**（4KB 未満だけインライン）。**`'always'` を明示しないと CSS が外部ファイルになり、リクエストが 2 本になる**。［[Astro 設定リファレンス](https://docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets)］
- **コンテンツ設定は `src/content.config.ts`。** 旧来の `src/content/config.ts` は現行バージョンでは無効。AI に書かせると古い場所に書きがち。［[Content Collections](https://docs.astro.build/en/guides/content-collections/)］
- **静的出力では i18n のリダイレクトがミドルウェア頼みで効かない。** `/` → `/ja/` は Astro に任せず、**ルートに実体（言語選択の HTML）を置くか、Cloudflare 側の設定でリダイレクトする**。なお 301 は往復が 1 回増えるので、ルートの TTFB を測って判断する。［[Internationalization](https://docs.astro.build/en/guides/internationalization/)］
- **`run_worker_first` を使うと静的アセットへのリクエストまで課金対象になり、無料枠を超えると 429 が返る**（静的配信へのフォールバックが起きない）。Worker スクリプトは置かない。［[Billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)］
- **Workers static assets の既定は `Cache-Control: public, max-age=0, must-revalidate`。** キャッシュはされるが**使う前に必ず問い合わせる**ので、再訪でも往復が消えない。`_headers` で明示的に上書きする。［[Headers](https://developers.cloudflare.com/workers/static-assets/headers/)］
- **Speculation Rules は Baseline ではない。** Chrome は対応、Safari は限定的、**Firefox は非対応**。未対応ブラウザでは単に無視されるので入れて損はないが、「全ブラウザで速い」とは言えない。［[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)］
- **GitHub Actions の実行環境は UTC。** 記事の日付を「今日」で自動補完しない（JST とズレる）。frontmatter に手で書く。
- **Lighthouse の SEO 100 には `<meta name="description">` と `lang` 属性が要る。** テンプレートに最初から入れておかないと、記事を書くたびに減点される。

## ロードマップ
| Phase | 内容 | DoD |
|---|---|---|
| P1 | 足場 + 記事 1 本が公開される | `*.workers.dev` で記事ページが読める |
| P2 | 速度を CI の合否条件にする | 予算超過の PR で CI が fail することを実際に確認 |
| P3 | 一覧・対訳リンク・RSS | 日英の記事を 1 組置いて相互に行き来できる |
