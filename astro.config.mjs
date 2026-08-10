// @ts-check
import { defineConfig } from 'astro/config';

// inlineStylesheets の既定は 'auto'（4KB 未満だけインライン）。
// 'always' にしないと CSS が外部ファイルになり、リクエストが 2 本になる。
export default defineConfig({
  build: {
    inlineStylesheets: 'always',
  },
});
