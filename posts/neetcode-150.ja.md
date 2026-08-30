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

https://neetcode.io/problems/two-integer-sum/question?list=neetcode150

足して `target` になる2つの要素の**添字**を返す。

素直に書くと「すべてのペアを試す」二重ループで O(n²) になってしまう。ここを崩す鍵は**式の変形**にある。

```
nums[i] + nums[j] === target     未知のものが2つ -> 総当たりになる
nums[j] === target - nums[i]     i を固定すれば、右辺は確定した1つの値になる
```

`i` を決めた瞬間、相方の値は計算で求まる。つまり**「2つを探す問題」が「1つの値を知っているか問い合わせる問題」に変化する**。あとは見てきたものをハッシュに記録しておけばいい。

```ts
class Solution {
    twoSum(nums: number[], target: number): number[] {
        // 値 -> その値があった添字（index）
        const seen = new Map<number, number>();

        for (let i = 0; i < nums.length; i++) {
            const diff = target - nums[i];

            if (seen.has(diff)) return [seen.get(diff)!, i];

            seen.set(nums[i], i);
        }

        return [];
    }
}
```

ポイント:

- 返すのは値ではなく添字なので、入れ物は `Set` ではなく `Map<値, 添字>`
- `seen.get(diff)!` の `!` は「`has` で確認済みなので `undefined` ではない」と TypeScript に伝える印

**応用**: 「条件を満たす2つの組を探す」と来たら、まず**式を変形して片方を固定できないか**を考える。相方が計算で出せるなら、探索はハッシュへの問い合わせ1回に潰せる。

### 4. Group Anagrams

https://neetcode.io/problems/anagram-groups/question?list=neetcode150

アナグラム同士をグループにまとめる。

2 と同じで、**並び順を捨てて正規化する**。ソートすれば `"act"` も `"cat"` も `"act"` になるので、これをキーにすれば同じ場所に勝手に集まる。

```ts
class Solution {
    groupAnagrams(strs: string[]): string[][] {
        // ソート済みの文字列 -> そこに属する元の文字列たち
        const groups = new Map<string, string[]>();

        for (const str of strs) {
            const key = str.split('').sort().join('');
            const group = groups.get(key) ?? [];

            group.push(str);
            groups.set(key, group);
        }

        return [...groups.values()];
    }
}
```

**応用**: 「同じ仲間をまとめる」は、**何を揃えれば同じとみなせるか（＝キー）を決める**だけの問題になる。キーが決まれば `Map<キー, 配列>` に放り込んで終わり。

### 5. Top K Frequent Elements

https://neetcode.io/problems/top-k-elements-in-list/question?list=neetcode150

出現回数の多い順に上位 `k` 個の値を返す。

やることは 2 段階。**① 各値が何回出たか数える → ② 回数の多い順に k 個取り出す**。①は 3・4 と同じハッシュで確定なので、考えどころは②だけになる。

#### 素直な解: ソートする

「多い順に取り出す」を、そのまま「多い順に並べ替えてから頭を取る」に翻訳した形。

```ts
class Solution {
    // 例: nums = [1, 1, 1, 2, 2, 3], k = 2  ->  答えは [1, 2]
    topKFrequent(nums: number[], k: number): number[] {
        // ① 数える。Map は「キー -> 値」の対応表
        const count = new Map<number, number>();
        for (const num of nums) {
            // まだ一度も出ていなければ get は undefined を返すので、?? 0 で 0 とみなす
            count.set(num, (count.get(num) ?? 0) + 1);
        }
        // count = { 1 => 3, 2 => 2, 3 => 1 }  （1 が3回、2 が2回、3 が1回）

        // ② 並べ替えて頭から k 個
        return [...count] // Map を配列に開く -> [[1, 3], [2, 2], [3, 1]]
            .sort((a, b) => b[1] - a[1]) // [1] は「回数」。b - a なので降順（多い順）
            //                              ここだけ O(n log n)。1行に見えるが
            //                              中で「2つを比べる」を n log n 回まわしている
            .slice(0, k) // 先頭 k 組だけ -> [[1, 3], [2, 2]]
            .map(([num]) => num); // 各組から値だけ取り出す -> [1, 2]
    }
}
```

- `[...count]` の `...`（スプレッド構文）で、`Map` は `[キー, 値]` のペアの配列になる
- `.sort((a, b) => ...)` の比較関数は「負なら a が前、正なら b が前」。`b[1] - a[1]` は回数が大きいほうを前に出すので降順
- `([num]) => num` は分割代入。`pair => pair[0]` と同じだが、**添字ではなく名前で読める**ぶん間違えにくい

#### もう一段速い解: バケットソート（できれば）

ここで効くのは、**出現回数は必ず 1〜n の整数**という点（n は `nums` の長さ）。小さい整数なら**そのまま配列の添字として使える**。

回数ごとに置き場所（バケット＝バケツ）を用意して放り込めば、**入れ終わった時点でもう回数順に並んでいる**。比較もソートも要らない。

```ts
class Solution {
    // 例: nums = [1, 1, 1, 2, 2, 3], k = 2  ->  答えは [1, 2]
    topKFrequent(nums: number[], k: number): number[] {
        // ① 数える（ここはソート版と同じ）… n 回
        const count = new Map<number, number>();
        for (const num of nums) {
            count.set(num, (count.get(num) ?? 0) + 1);
        }
        // count = { 1 => 3, 2 => 2, 3 => 1 }

        // ②-a 「回数 f の値を入れるバケツ」を byFreq[f] として用意する … n 回
        //      回数は最大でも n（全部同じ値のとき）なので、添字 n が使えるよう n+1 本作る
        const byFreq: number[][] = Array.from({ length: nums.length + 1 }, () => []);
        for (const [num, freq] of count) {
            byFreq[freq].push(num); // 「3回出た値は 1」なら byFreq[3] に 1 を入れる
        }
        // count のキーと値が入れ替わった形になる:
        // byFreq = [ [], [3], [2], [1], [], [], [] ]
        //    添字     0    1    2    3   4   5   6
        //                  ↑    ↑    ↑
        //             1回出た 2回出た 3回出た値

        // ②-b 添字の大きい側（＝回数が多い側）から、k 個そろうまで拾う … 多くても n 回
        //      「比べる」作業がどこにもないのがポイント。置いた場所がそのまま順位になっている
        const top: number[] = [];
        for (let freq = nums.length; freq > 0 && top.length < k; freq--) {
            top.push(...byFreq[freq]); // バケツの中身をまとめて足す（空なら何も起きない）
        }
        // freq = 6,5,4 は空 -> freq = 3 で 1 を追加 -> freq = 2 で 2 を追加 -> 2個そろって終了

        // 同じ回数の値が複数あると k を超えて入ることがあるので、最後に切りそろえる
        return top.slice(0, k); // [1, 2]
    }
}
```

### 6. Top K Frequent Elements
