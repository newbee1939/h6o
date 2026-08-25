---
title: NeetCode150問をTypeScriptで解いてみた
date: 2026-08-25
lang: ja
description: ""
---

「データ構造」と「アルゴリズム」の学習のため、NeetCode150をTypeScriptで解いてみた。

それぞれの回答と、回答のポイントを自分なりにまとめる。

## Arrays & Hashing

配列を1回なめながら、見たものをハッシュ（キーを渡すと数値を返す関数）に記録していく——このグループはほぼこれに尽きる。

素直にやると二重ループで O(n²) になる問題を、「探す」という操作をハッシュに肩代わりさせて O(n) に落とす。ハッシュテーブルは値からその置き場所を計算で求めるので、中に何個入っていても1回の探索で済む（平均 O(1)）。その代わり、記録する分のメモリ O(n) を払う。**時間をメモリで買う**のがこのグループの型。

### 1. Contains Duplicate

https://neetcode.io/problems/duplicate-integer/question?list=neetcode150

配列の中に同じ値が2回以上出てくるか判定する。

```ts
class Solution {
    hasDuplicate(nums: number[]): boolean {
        const seen = new Set<number>();
        // ループを1度回すだけ
        for (const num of nums) {
            if (seen.has(num)) return true;
            seen.add(num);
        }
        return false;
    }
}
```

### 2. Valid Anagram

アナグラム = 言葉の文字を並び替えて、まったく別の意味の言葉や文章を作る言葉遊び

https://neetcode.io/problems/is-anagram/question?list=neetcode150


```ts
//
```
