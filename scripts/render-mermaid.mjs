// posts/*.md の ```mermaid ブロックを diagrams/<hash>.svg に描き出す（手元で実行し、SVG はコミットする）。
// ビルドは CI で Chromium を動かさず、この SVG を記事に埋め込むだけ（astro.config.mjs の remarkMermaid）。
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mermaidHash } from './mermaid-hash.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'mermaid-'));
for (const file of readdirSync('posts').filter((f) => f.endsWith('.md'))) {
  const md = readFileSync(join('posts', file), 'utf8');
  for (const [, code] of md.matchAll(/^```mermaid\n([\s\S]*?)\n```$/gm)) {
    const id = mermaidHash(code);
    const out = `diagrams/${id}.svg`;
    if (existsSync(out)) continue;
    const src = join(tmp, `${id}.mmd`);
    writeFileSync(src, code);
    // -I: 1 ページに複数の図を置いても <style> や id が衝突しないよう図ごとに変える
    // -b white: ダークモードでも黒文字が読めるよう背景を塗る
    // --no-font-embed: 既定だとフォントを base64 で埋め込み 1 枚 200KB になる
    // puppeteer の postinstall（Chrome のダウンロード）は走らせず、手元の Chrome を使う
    execFileSync('npx', ['--ignore-scripts', '-y', '@mermaid-js/mermaid-cli@12.0.0', '-i', src, '-o', out, '-I', id, '-b', 'white', '-t', 'default', '--no-font-embed'], {
      stdio: 'inherit',
      env: { PUPPETEER_EXECUTABLE_PATH: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ...process.env },
    });
    console.log(`${file}: ${out}`);
  }
}
