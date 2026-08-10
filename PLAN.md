> **ステータス: 確定版。** 方針を変えるときは本ファイルを直し、PR で履歴を残す。

# 実装計画

1 タスク = 1 PR。上から順に実行する。完了は `- [x]`、やめたものは `- [~]` ＋理由。
想定と違ったら **`実績:`** を追記する。

**前提**: Cloudflare アカウントを持っていること（P1-3 で必要）。GitHub リポジトリは `newbee1939/h6o`。
**v1 の完成 = P2-3 まで**（CONCEPT.md の完成の定義が「速度目標を CI が通す」まで含むため）。P3 は v1 の後。

---

## P1 — 足場を入れて、記事 1 本を世界に出す
**Goal**: `*.workers.dev` で記事ページが読め、push すると自動で反映される

### P1-1. リポジトリの足場
- [x] **やること**: `.gitignore`（`.env`、`node_modules`、`dist`）、`.tool-versions`（`node 24.19.0`。ローカルの 25.6.0 は mise が切り替える。v24 は 2026-08-03 に Active LTS を終えて Maintenance に入ったが、v26 の LTS 化まではこれが最も無難）、`.npmrc`（`strict-allow-scripts=true` / `min-release-age=7`）、`.github/dependabot.yml`（npm + github-actions、weekly、グループ 1 本）、`AGENTS.md`（ビルド / デプロイのコマンドと記事ファイルの命名規約だけ）、`CLAUDE.md`（`@AGENTS.md` の 1 行）。あわせて `gh api -X PATCH repos/newbee1939/h6o` で secret scanning / push protection / dependabot / delete_branch_on_merge を有効化
- **成果物**: 上記ファイル一式
- **DoD**: `mise install && node -v` が `v24.19.0`。`gh api repos/newbee1939/h6o --jq '.delete_branch_on_merge, .security_and_analysis'` で有効を確認
- **実績:** secret scanning / push protection は public リポジトリでは最初から有効だった。**Dependabot だけ `PATCH repos/...` では変えられず**、`PUT repos/.../vulnerability-alerts` と `PUT repos/.../automated-security-fixes` の 2 本を叩く必要がある。npm 11.17.0 は `strict-allow-scripts` / `min-release-age` をどちらも認識した（`npm config get` で値が返る）

### P1-2. Astro を最小構成で入れ、記事 1 本を HTML にする
- [ ] **やること**: `npm create astro@latest` は使わず（テンプレートが余分なものを持ち込む）、`npm i astro` から手で組む。`src/content.config.ts` で `glob({ pattern: '**/*.md', base: './posts' })` のコレクションを定義。`src/layouts/Base.astro` に `<style>` 直書き（`lang` 属性、`<meta name="description">`、`prefers-color-scheme` のダークモードを必ず入れる。切替ボタンは作らない）。`src/pages/[lang]/[slug].astro` で `getStaticPaths()` を書く。`astro.config.mjs` に **`build: { inlineStylesheets: 'always' }`**。`posts/hello.ja.md` を 1 本置く
- **成果物**: `astro.config.mjs` / `src/content.config.ts` / `src/layouts/Base.astro` / `src/pages/[lang]/[slug].astro` / `posts/hello.ja.md`
- **DoD**: `npm run build` 後、`dist/ja/hello/index.html` が存在し、`find dist \( -name '*.js' -o -name '*.css' \) | wc -l` が **0**（括弧が無いと `-print` が最後の条件にしか掛からず .js を見落とす）。`grep -c '<style>' dist/ja/hello/index.html` が 1 以上

### P1-3. Cloudflare へ手動でデプロイして道を通す
- [ ] **やること**: `npm i -D wrangler`、`wrangler.jsonc` に `assets: { directory: "./dist" }` のみ（**Worker スクリプトは置かない** — `run_worker_first` は課金対象になる）。あわせて `public/_headers` を作り、既定の `must-revalidate` を上書きする（`/*` に `Cache-Control: public, max-age=300, stale-while-revalidate=86400`）。`npx wrangler login` の後 `npx wrangler deploy`
- **成果物**: `wrangler.jsonc`、`public/_headers`
- **DoD**: `curl -sI https://<name>.<subdomain>.workers.dev/ja/hello/` が `HTTP/2 200` かつ **`cache-control` が `stale-while-revalidate` を含む**（既定のままなら `_headers` が dist に届いていない）

### P1-4. GitHub Actions で自動デプロイにする
- [ ] **やること**: Cloudflare で Workers デプロイ権限だけの API トークンを作り `CLOUDFLARE_API_TOKEN` として登録。`.github/workflows/deploy.yml`（`on: push: branches: [main]`、`permissions: contents: read`、`timeout-minutes: 10`、concurrency、Action は**コミットハッシュ固定**、`node-version-file: .tool-versions`、`npm ci --ignore-scripts` → build → `wrangler deploy`）
- **成果物**: `.github/workflows/deploy.yml`
- **DoD**: 記事の文言を 1 文字変えて main にマージ → Actions が緑 → `curl -s <URL> | grep '<変更後の文字列>'` がヒット

### P1-5. 振り返り
- [ ] **やること**: 詰まった箇所と、想定と違った点を PLAN.md に `実績:` で追記。`/new-product` skill に足すべき知見があれば提案する

---

## P2 — 速度を CI の合否条件にする
**Goal**: 予算を超える変更は**マージできない**

### P2-1. 転送量バジェット（= [CONCEPT.md の速度目標](CONCEPT.md)）のチェックスクリプト
- [ ] **やること**: `scripts/check-budget.mjs` を書く（依存なし。Node 標準の `zlib.brotliCompressSync` で `dist/**/*.html` を圧縮しサイズを測る）。判定は 3 つ — JS/CSS ファイルが 0 件、各 HTML の brotli 後が 15KB 以下、**`type="speculationrules"` 以外の `<script>` タグが 0 件**（宣言的な先読みだけは許可する。[CONCEPT.md の速度目標](CONCEPT.md)を参照）。超えたら `process.exit(1)`
- **成果物**: `scripts/check-budget.mjs`、`package.json` に `"check:budget"`
- **DoD**: `npm run build && npm run check:budget` が exit 0。**わざと 20KB のダミー記事を置くと exit 1 になる**ことを確認してから消す

### P2-2. Lighthouse を CI で回す
- [ ] **やること**: `npm i -D @lhci/cli`。`lighthouserc.json` で `staticDistDir: ./dist`、**対象は記事ページのみ**（一覧とルートは P3 まで存在しないので URL に入れると 404 で落ちる）。4 カテゴリすべて `minScore: 1` の assertion を設定
- **成果物**: `lighthouserc.json`、`package.json` に `"check:lh"`
- **DoD**: `npm run check:lh` が 4 カテゴリ 100 点で exit 0。落ちた場合は**点数を下げずに原因を直す**（閾値を緩めない）

### P2-3. CI に組み込み、デプロイの前段にする
- [ ] **やること**: `.github/workflows/ci.yml`（PR と main への push で `build` → `check:budget` → `check:lh`）。`deploy.yml` はチェック通過後にのみ走るようにする
- **成果物**: `.github/workflows/ci.yml`、`deploy.yml` の更新
- **DoD**: `gh api -X PUT repos/newbee1939/h6o/branches/main/protection` で CI を必須チェックに指定したうえで、予算を超える PR を実際に立てて **CI が red になり、マージがブロックされる**ことを確認

### P2-4. 振り返り
- [ ] **やること**: 実測値（記事 1 枚の brotli 後サイズ / TTFB）を PLAN.md に記録。15KB という目標が緩すぎ / 厳しすぎなら CONCEPT.md を直す

---

## P3 — 日英が行き来でき、購読できる
**Goal**: 対訳のある記事を日英で置き、相互に行き来でき、RSS で購読できる

### P3-1. 言語ごとの記事一覧
- [ ] **やること**: `src/pages/[lang]/index.astro`。日付降順でタイトルと description を並べるだけ（ページネーション・タグは作らない）
- **成果物**: `src/pages/[lang]/index.astro`
- **DoD**: `dist/ja/index.html` と `dist/en/index.html` が生成され、`check:budget` が通る

### P3-2. 対訳リンクと hreflang
- [ ] **やること**: 同じ slug の別 lang が存在するときだけ切替リンクを出す（フロントマターに相互参照は書かない）。`<link rel="alternate" hreflang>` も同じ判定で出力
- **成果物**: `src/layouts/Base.astro` の更新
- **DoD**: `posts/hello.en.md` を追加すると両ページに相互リンクが出て、対訳の無い記事には出ないことを `grep` で確認

### P3-3. ルート `/` の扱いを実測して決める
- [ ] **やること**: 静的出力では Astro の `redirectToDefaultLocale` が効かない。**(a) 言語選択の実体 HTML を置く / (b) Cloudflare 側で `/ja/` へ 301** の 2 案を両方試し、`curl -w '%{time_starttransfer}'` で比較して決める。決定は ARCHITECTURE.md に追記
- **成果物**: `src/pages/index.astro` または redirect 設定、ARCHITECTURE.md の更新
- **DoD**: `curl -sI https://<URL>/` が 200 か 301 を返し、計測値を PLAN.md に `実績:` で記録

### P3-4. 遷移を先読みする（Speculation Rules）
- [ ] **やること**: `Base.astro` に `<script type="speculationrules">` を直書きし、同一オリジンのリンクを `prerender`（`eagerness` は `moderate` から試す）。一覧ページができた P3-1 の後でないと効果が測れない
- **成果物**: `src/layouts/Base.astro` の更新
- **DoD**: Chrome DevTools の Application → Speculative loads で一覧ページのリンクが `Ready` になる。`npm run check:budget` が引き続き exit 0

### P3-5. RSS/Atom フィード
- [ ] **やること**: `src/pages/[lang]/rss.xml.ts` を言語ごとに生成。`@astrojs/rss` を使うか自前で XML を組むかは、依存が増える価値があるか見て判断する
- **成果物**: `src/pages/[lang]/rss.xml.ts`
- **DoD**: `curl -s <URL>/ja/rss.xml | head -5` が妥当な XML。フィードリーダーに登録して記事が出ることを目視

### P3-6. 振り返りと公開
- [ ] **やること**: README に何のサイトかを 3 行で書く。**その日のうちに公開する**（完成度を上げてから出さない）。1 か月後に自分が使っているかを見る、と CONCEPT.md の成功条件に沿って確認日を決める
- **DoD**: 記事の URL を自分以外の場所（SNS など）に 1 回出す
