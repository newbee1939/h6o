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

2つの文字列が、同じ文字を同じ個数ずつ持っているかを判定する。並び順は問わない。

**ここで効くのは「有無」ではなく「個数」**。`Set` で「その文字があるか」を見る解き方は通らない。`s = "aab"` と `t = "abb"` はどちらも使っている文字が `{a, b}` で同じなので、有無だけ見ると一致してしまう。

制約が「小文字の英字のみ」なので、26個ぶんの数え上げ配列1本で足りる。

```ts
class Solution {
    isAnagram(s: string, t: string): boolean {
        // 長さが違えば個数が一致しようがない
        if (s.length !== t.length) return false;

        const A = 'a'.charCodeAt(0);
        // アルファベットの文字数
        const freq = new Array(26).fill(0);

        for (let i = 0; i < s.length; i++) {
            freq[s.charCodeAt(i) - A]++; // s に出た分を足す
            freq[t.charCodeAt(i) - A]--; // t に出た分を引く
        }

        // 打ち消し合って全部 0 なら、内訳が完全に一致している
        return freq.every((n) => n === 0);
    }
}
```

- `charCodeAt(i) - A` は「`a` を 0 番とする通し番号」を作っている。文字はコンピュータの中では数値（`a` は 97、`b` は 98...）なので、97 を引けば 0〜25 の添字になる。**これは自作のハッシュ関数**で、衝突が起きず計算も引き算1回なので `Map` より速い

### 3. Two Sum

```ts
class Solution {
    /**
     * @param {number[]} nums
     * @param {number} target
     * @return {number[]}
     */
    twoSum(nums: number[], target: number): number[] {
        const numsMap = new Map();

        for (let i = 0; i < nums.length; i++) {
            const currentNum = nums[i];
            const diff = target - currentNum;

            if (numsMap.has(diff)) {
                return [numsMap.get(diff), i];
            }

            numsMap.set(currentNum, i);
        }

        return [];
    }
}
```
