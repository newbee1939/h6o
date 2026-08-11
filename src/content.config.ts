import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ファイル名は <slug>.<lang>.md。既定の id 生成はドットを落として "helloja" にしてしまうので、
// 拡張子だけ削って "<slug>.<lang>" を id に使う。
const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './posts',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    lang: z.enum(['ja', 'en']),
    description: z.string(),
  }),
});

export const collections = { posts };
