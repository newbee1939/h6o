// @ts-check
import { defineConfig } from 'astro/config';

// inlineStylesheets の既定は 'auto'（4KB 未満だけインライン）。
// 'auto' の閾値は「CSS が大きいならページ跨ぎのキャッシュを効かせたほうが得」という
// 一般的なサイト向けの線引きで、このサイトには当てはまらない。CSS は 1KB 弱しかなく、
// 外部化して浮くぶんより、取りに行く往復（レンダリングブロック）のほうが高くつく。
// 4KB を超えてもインラインが速いままなので、サイズで挙動が切り替わるのを止める。
export default defineConfig({
  build: {
    inlineStylesheets: 'always',
  },
});
