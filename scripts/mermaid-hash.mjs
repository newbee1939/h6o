import { createHash } from 'node:crypto';

// 図のソースから SVG のファイル名を決める。ソースを直せば別名になり、描き直し漏れがビルドで見つかる。
export const mermaidHash = (code) => 'm' + createHash('sha256').update(code).digest('hex').slice(0, 12);
