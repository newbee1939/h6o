import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

// 図のソースから SVG のファイル名を決める。ソースを直せば別名になり、描き直し漏れがビルドで見つかる。
export const mermaidHash = (code) => 'm' + createHash('sha256').update(code).digest('hex').slice(0, 12);

// Sätteri の mdast プラグイン。```mermaid を diagrams/<hash>.svg（npm run diagrams で生成済み）のインライン SVG に差し替える。
// SVG が無ければビルドを落とす。コードブロックのまま公開されるのを防ぐため。
export const mermaidPlugin = {
  name: 'mermaid-svg',
  code(node) {
    if (node.lang !== 'mermaid') return;
    const path = `diagrams/${mermaidHash(node.value)}.svg`;
    if (!existsSync(path)) throw new Error(`${path} がありません。npm run diagrams を実行してください`);
    return { rawHtml: `<figure class="diagram">${readFileSync(path, 'utf8')}</figure>` };
  },
};
