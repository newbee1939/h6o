# h6o

静的ブログ。何を作るかは [CONCEPT.md](CONCEPT.md)、どう作るかは [ARCHITECTURE.md](ARCHITECTURE.md)、次に何をするかは [PLAN.md](PLAN.md)。

## 記事を書く

```sh
./scripts/new-post.sh <slug> [ja|en]   # lang の既定は ja
npm run dev                            # 出力された URL を開く
```

`posts/<slug>.<lang>.md` が作られ、frontmatter の `date` は実行日で埋まる。`title` と `description` は空なので手で書く（`description` は一覧と `<meta>` に使う 1 行）。

- slug は英小文字・数字・ハイフンのみ。**一度公開した slug は変えない**（URL が変わる）
- 本文の見出しは `##` から。`#` はページの `<h1>`（記事タイトル）が使う
- 対訳は同じ slug で lang 違いを置くだけ（`./scripts/new-post.sh <slug> en`）
