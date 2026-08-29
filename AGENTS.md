# h6o

静的ブログ。**何を作るかは [CONCEPT.md](CONCEPT.md)、どう作るかは [ARCHITECTURE.md](ARCHITECTURE.md)、次に何をするかは [PLAN.md](PLAN.md)** が唯一の真実。方針を変えるときはコードより先にそちらを直す。

## コマンド

| 用途 | コマンド |
|---|---|
| ビルド | `npm run build`（出力は `dist/`） |
| ローカル確認 | `npm run dev` |
| 速度チェック | `npm run check:budget` / `npm run check:lh` |
| デプロイ | **main への push で GitHub Actions が自動実行**（GitHub Pages）。手動デプロイの手順は用意しない |

Node のバージョンは `.tool-versions`（mise が切り替える）。依存の追加は `npm i` の前に「原則 5: まず何を消せるか」を通すこと。

## 記事ファイル

- 置き場所は `posts/` だけ。ファイル名は **`<slug>.<lang>.md`**（`lang` は `ja` か `en`）
- **同じ slug の別 lang が存在するものだけが対訳**とみなされる。frontmatter に相互参照は書かない
- slug は英数字とハイフンのみ。**一度公開した slug は変えない**（URL が変わる）
- 日付はファイル名に入れず frontmatter へ。CI は UTC なので「今日」を自動補完せず手で書く

```markdown
---
title: SRE の仕事はつまらないほうがいい
date: 2026-08-09
lang: ja
description: 一覧と <meta> に使う 1 行
---
```

## 触るときの制約

- **JS を配信しない**（`<script type="speculationrules">` だけ例外）。CSS は `src/layouts/Base.astro` に直書きし、外部ファイルにしない
- `public/` は作らない。favicon・画像・フォントは配信しない
- コレクション定義は `src/content.config.ts`（`src/content/config.ts` **ではない**）
- 公開 URL は `https://newbee1939.github.io/h6o/`。`astro.config.mjs` の `base` を消すとリンクが全部壊れる
