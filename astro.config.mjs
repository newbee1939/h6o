// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { existsSync, readFileSync } from 'node:fs';
import { mermaidHash } from './scripts/mermaid-hash.mjs';

// ```mermaid を diagrams/<hash>.svg（npm run diagrams で生成済み）のインライン SVG に差し替える。
// SVG が無ければビルドを落とす。コードブロックのまま公開されるのを防ぐため。
const mermaid = {
  name: 'mermaid-svg',
  code(node) {
    if (node.lang !== 'mermaid') return;
    const path = `diagrams/${mermaidHash(node.value)}.svg`;
    if (!existsSync(path)) throw new Error(`${path} がありません。npm run diagrams を実行してください`);
    return { rawHtml: `<figure class="diagram">${readFileSync(path, 'utf8')}</figure>` };
  },
};

export default defineConfig({
  // GitHub Pages のプロジェクトサイトは https://<user>.github.io/<repo>/ で配信される。
  // 独自ドメインに移すときはこの 2 行だけ直す。
  site: 'https://newbee1939.github.io',
  base: '/h6o',

  markdown: { processor: satteri({ mdastPlugins: [mermaid] }) },

  build: {
    // inlineStylesheets の既定は 'auto'（4KB 未満だけインライン）。
    // 'auto' の閾値は「CSS が大きいならページ跨ぎのキャッシュを効かせたほうが得」という
    // 一般的なサイト向けの線引きで、このサイトには当てはまらない。CSS は 1KB 弱しかなく、
    // 外部化して浮くぶんより、取りに行く往復（レンダリングブロック）のほうが高くつく。
    // 4KB を超えてもインラインが速いままなので、サイズで挙動が切り替わるのを止める。
    inlineStylesheets: 'always',
  },
});
