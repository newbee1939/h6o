---
title: NeetCode150問をTypeScriptで解いてみた
date: 2026-08-25
lang: ja
description:
---

「データ構造」と「アルゴリズム」の学習のため、NeetCode150をTypeScriptで解いてみた。

それぞれの回答と、回答のポイントを自分なりにまとめる。

## 1 Contains Duplicate

https://neetcode.io/problems/duplicate-integer/question?list=neetcode150

```ts
class Solution {
    /**
     * @param {number[]} nums
     * @return {boolean}
     */
    hasDuplicate(nums: number[]): boolean {
        const numMap = new Map();
        for (const num of nums) {
            if (numMap.has(num)) {
                return true;
            }

            numMap.set(num, 1);
        }

        return false;
    }
}
```
