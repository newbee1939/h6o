---
title: NeetCode75問をTypeScriptで解いてみた
date: 2026-08-25
lang: ja
description: ""
---

<!-- TODO: 最後に全部再度見返してレビューしてから投稿（英語版も） -->
<!-- できればHardも解きたい -->
<!-- それぞれのタイトルの下に、それぞれのアルゴリズムについて簡潔にまとめる -->
<!-- ## Arrays & Hashingとかの下 -->

「データ構造」と「アルゴリズム」の学習のため、NeetCodeのBlind 75をTypeScriptで解いてみた。（Hard以外）

それぞれの解答と、そのポイントを自分なりにまとめる。

## Arrays & Hashing

配列を1回なめながら、見たものをハッシュ（`Map` や `Set` のように、値から置き場所を計算して一発で出し入れできる表）に記録していく——このグループはほぼこれに尽きる。

素直にやると二重ループで O(n²) になる問題を、「探す」という操作をハッシュに肩代わりさせて O(n) に落とす。ハッシュテーブルは値からその置き場所を計算で求めるので、中に何個入っていても1回の探索で済む（平均 O(1)）。その代わり、記録する分のメモリ O(n) を払う。**時間をメモリで買う**のがこのグループの型。

### 1. Contains Duplicate

https://neetcode.io/problems/duplicate-integer/question?list=blind75

配列の中に同じ値が2回以上出てくるか判定する。

```ts
class Solution {
    // 例: nums = [1, 2, 3, 3]  ->  true
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

https://neetcode.io/problems/is-anagram/question?list=blind75

2つの文字列が、同じ文字を同じ個数ずつ持っているかを判定する。並び順は問わない（アナグラム = 言葉の文字を並び替えて、まったく別の意味の言葉や文章を作る言葉遊び）。

**ここで効くのは「有無」ではなく「個数」**。`Set` で「その文字があるか」を見る解き方は通らない。`s = "aab"` と `t = "abb"` はどちらも使っている文字が `{a, b}` で同じなので、有無だけ見ると一致してしまう。

制約が「小文字の英字のみ」なので、26個ぶんの数え上げ配列1本で足りる。

```ts
class Solution {
    // 例: s = "racecar", t = "carrace"  ->  true
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

https://neetcode.io/problems/two-integer-sum/question?list=blind75

足して `target` になる2つの要素の**添字**を返す。

素直に書くと「すべてのペアを試す」二重ループで O(n²) になってしまう。ここを崩す鍵は**式の変形**にある。

```
nums[i] + nums[j] === target     未知のものが2つ -> 総当たりになる
nums[j] === target - nums[i]     i を固定すれば、右辺は確定した1つの値になる
```

`i` を決めた瞬間、相方の値は計算で求まる。つまり**「2つを探す問題」が「1つの値を知っているか問い合わせる問題」に変化する**。あとは見てきたものをハッシュに記録しておけばいい。

```ts
class Solution {
    // 例: nums = [3, 4, 5, 6], target = 7  ->  [0, 1]
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

https://neetcode.io/problems/anagram-groups/question?list=blind75

アナグラム同士をグループにまとめる。

2 と同じで、**並び順を捨てて正規化する**。ソートすれば `"act"` も `"cat"` も `"act"` になるので、これをキーにすれば同じ場所に勝手に集まる。

```ts
class Solution {
    // 例: strs = ["act", "pots", "cat", "stop"]  ->  [["act", "cat"], ["pots", "stop"]]
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

https://neetcode.io/problems/top-k-elements-in-list/question?list=blind75

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

#### もう一段速い解: バケットソート

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

### 6. Encode and Decode Strings

https://neetcode.io/problems/string-encode-and-decode/question?list=blind75

文字列の配列を1本の文字列に符号化し、そこから元の配列を復元する。中身にどんな文字が入っていてもよい。

```ts
class Solution {
    // 例: strs = ["ab", "c:d"]  ->  "2:ab3:c:d"
    encode(strs: string[]): string {
        // 「長さ:本体」を並べる。長さがあるので、本体に : が入っていても壊れない
        return strs.map((s) => `${s.length}:${s}`).join('');
        //   "2:ab"        +      "3:c:d"
    }

    // 例: "2:ab3:c:d"  ->  ["ab", "c:d"]
    decode(str: string): string[] {
        //  "2:ab3:c:d"
        //   012345678   <- 添字。本体の : は添字 7 にいる
        const res: string[] = [];
        let i = 0;

        // i は文字列の長さぶん飛ばしていくので for にはしない
        while (i < str.length) {
            const colon = str.indexOf(':', i); // i 以降で最初の : の位置
            const length = Number(str.slice(i, colon));
            const start = colon + 1; // : の次が本体の先頭

            res.push(str.slice(start, start + length));
            i = start + length; // 次の「長さ」の先頭へ
        }
        // 1周目: i=0  colon=1  length=2  start=2  ->  slice(2, 4) = "ab"   ->  i=4
        // 2周目: i=4  colon=5  length=3  start=6  ->  slice(6, 9) = "c:d"  ->  i=9 で終了
        //        添字 7 の : は 2周目の slice が丸ごと持っていくだけ。
        //        indexOf が i=4 から探すと、先に見つかるのは添字 5 の : のほう

        return res;
    }
}
```

区切り文字だけで分けようとすると、本体に `:` が出た瞬間に壊れる。**長さを先に書けば「ここから何文字読むか」が確定する**ので、中身が何であっても関係なくなる。

鍵は `i` が常に**長さの数字の先頭**しか指さないこと。ループの最後で `i = start + length` と本体を丸ごと飛び越すので、本体は1文字もパーサの目に入らない。だから `:` を含んでいても、数字でも、符号化フォーマットそっくりでも壊れない。

```
["ab", "c:d"]  ->  "2:ab3:c:d"  ->  ["ab", "c:d"]
["12", "34"]   ->  "2:122:34"   ->  ["12", "34"]
["3:abc"]      ->  "5:3:abc"    ->  ["3:abc"]  // 「ここから5文字」と言い切っているので中身を解釈しない
```

#### この問題は何を訊いているのか

ここだけハッシュを使わない。実体は**シリアライズ**（複数のデータを1本の文字列に平たく潰し、あとで元に戻せるようにすること）で、使っている形式は**長さ前置フレーミング**（length-prefixed framing）と呼ばれる。

「どこまでが1件か」を受け手に伝える方法は、突き詰めると2つしかない。

| 方式 | 例 | 弱点 |
|---|---|---|
| 区切り文字を置く | CSV、改行区切り | 中身に区切り文字が出たらエスケープが必要 |
| 長さを先に書く | `3:Hog` | なし |

長さ前置は HTTP の `Content-Length`、Protocol Buffers などが採用している。TCP は「バイトの流れ」しか運ばず、送信側が区切った単位は途中で消えてしまう。だから受け手が1件の切れ目を自力で復元する手段がどうしても要る——この問題はその縮小版。

### 7. Products of Array Except Self

https://neetcode.io/problems/products-of-array-discluding-self/question?list=blind75

自分以外のすべての要素を掛けた値を、各位置について返す。割り算は使わない。

**自分以外 = 左側全部 × 右側全部**。左からの累積積と右からの累積積を掛ければ、自分だけが抜ける。割り算がないので 0 の特別扱いも要らない。

```
nums = [1, 2, 3, 4]
            ↑ res[1] = (左: 1) × (右: 3×4) = 12
```

出力配列 1 本を、左から 1 周・右から 1 周で埋める。

```ts
class Solution {
    // 例: nums = [1, 2, 3, 4]  ->  [24, 12, 8, 6]
    productExceptSelf(nums: number[]): number[] {
        const n = nums.length;
        // 長さ n だけ確保した空の箱。中身は ① で全部埋めるので fill は要らない
        const res = new Array<number>(n);

        // ① 左から: res[i] に「自分より左の積」を置く
        let prefix = 1;
        for (let i = 0; i < n; i++) {
            res[i] = prefix; // 置く時点の prefix に自分はまだ入っていない
            prefix *= nums[i]; // 置いたあとで自分を混ぜる
        }
        // res = [1, 1, 2, 6]  （1, 1, 1×2, 1×2×3）

        // ② 右から: そこに「自分より右の積」を掛ける。①の鏡写し
        let suffix = 1;
        for (let i = n - 1; i >= 0; i--) {
            res[i] *= suffix;
            suffix *= nums[i];
        }
        // res = [1×24, 1×12, 2×4, 6×1] = [24, 12, 8, 6]

        return res;
    }
}
```

`res[i] = prefix` を**自分を掛ける前**に書くのが肝。逆にすると自分が積に混ざる。時間 O(n)。

#### `Map` / `Set` を使ってはいけない理由

このグループの型に引きずられて「全部 `Map` に入れて自分だけ消し、残りを掛ける」と書くと壊れる。**`Set` が値の重複を潰すのと同じで、`Map` もキーの重複を潰す**（同じキーに `set` すると行が増えず、値が上書きされるだけ）。

```
[0, 0]     -> Map 上では {0} の 1 件。自分を消すと空になり、積が計算できない
[2, 2, 3]  -> Map 上では {2, 3} の 2 件。もう 1 つの 2 が積から消えて答えが狂う
```

積は**同じ値が何個あるか**で変わる。**キーが潰れたときに答えが変わるなら、それをキーにしてはいけない**。3・4 で `Map` が効いたのは、潰れて困る情報が値側（添字・グループの配列）にあったから。

**応用**: 「自分以外の集計」は、**左からの累積と右からの累積に分けて掛け合わせる**。累積和・累積 max でも同じ形が使える。

### 8. Longest Consecutive Sequence

https://neetcode.io/problems/longest-consecutive-sequence/question?list=blind75

1 ずつ増える並びのうち、いちばん長いものの長さを返す。**元の配列で隣り合っている必要はない**ので、`[2, 20, 4, 10, 3, 4, 5]` の答えは 4（`2, 3, 4, 5`）。

ポイントは「**起点だけ数える**」。`num - 1` が無ければ `num` は列の先頭。先頭からしか数えなければ、各値はちょうど1回しか触られない。

```ts
class Solution {
    // 例: nums = [2, 20, 4, 10, 3, 4, 5]  ->  4
    longestConsecutive(nums: number[]): number {
        // 重複が消え、「この値はあるか」が O(1) で聞けるようになる
        const numSet = new Set(nums);
        // 空配列ならこのまま 0 が返る。特別扱いが要らない
        let longest = 0;

        for (const num of numSet) {
            // 1つ前があるなら自分は列の途中。数えるのは先頭の担当なので飛ばす
            if (numSet.has(num - 1)) continue;

            let length = 1;
            while (numSet.has(num + length)) length++;

            longest = Math.max(longest, length);
        }

        return longest;
    }
}
```

#### `nums = [2, 20, 4, 10, 3, 4, 5]` を追ってみる

まず `new Set(nums)` で重複した `4` が1つに潰れる。`Set` は**入れた順を覚えている**ので、`for...of` はこの順に回る。

```
numSet = { 2, 20, 4, 10, 3, 5 }
```

この中に隠れている列は `2,3,4,5`（長さ4）と `10`、`20`（それぞれ長さ1）。答えは 4。

```
num=2   has(1)?  無い -> 先頭なので数える
          has(3) 有る -> length=2
          has(4) 有る -> length=3
          has(5) 有る -> length=4
          has(6) 無い -> ここで止まる。longest = 4

num=20  has(19)? 無い -> 先頭
          has(21) 無い -> length=1。longest は 4 のまま

num=4   has(3)?  有る -> 列の途中。何もせず次へ
num=10  has(9)?  無い -> 先頭。has(11) 無い -> length=1
num=3   has(2)?  有る -> 途中。スキップ
num=5   has(4)?  有る -> 途中。スキップ

-> 4
```

#### 二重ループに見えるが O(n)

`while` が回るのは先頭（上の例では `2`, `20`, `10` の3回）だけ。しかも1つの列を1回なめるだけなので、`while` の総回数は「各列の長さの合計」= 要素数 n を超えない。`for` の n 回と足しても O(n) に収まる。

**応用**: 「同じものを何度も数え直している」と気づいたら、**数え始めてよい場所を1種類に絞れないか**を考える。ここでは「`num - 1` が無い」がその条件だった。

## Two Pointers

両端に置いた2つの添字を、中央へ寄せていく。**1周なので O(n)、しかも追加のメモリを持たない O(1)**。

Arrays & Hashing が**時間をメモリで買う**型だったのに対して、こちらは**メモリを払わずに済ませる**型。

### 9. Valid Palindrome

https://neetcode.io/problems/is-palindrome/question?list=blind75

英数字だけを見て、大文字小文字を無視したとき回文（前から読んでも後ろから読んでも同じ）かを判定する。

素直に書くと、英数字だけを小文字で抜き出した文字列を作り、反転したものと比べる形になる。

```ts
const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
return cleaned === [...cleaned].reverse().join('');
```

読みやすいが、**同じ長さの文字列を2本作る**ので O(n) のメモリを使う。回文は「先頭と末尾が同じ」の繰り返しなので、作らずに両端から突き合わせれば済む。

```ts
// 英数字1文字か判定する。
// 末尾の i（ignore case）が大文字小文字の差を無視させる。/[a-zA-Z0-9]/ と同じ
const ALPHA_NUM = /[a-z0-9]/i;

class Solution {
    // 例: s = "Was it a car or a cat I saw?"  ->  true
    isPalindrome(s: string): boolean {
        let l = 0;
        let r = s.length - 1; // 添字は 0 始まりなので -1

        while (l < r) {
            // 英数字でなければ、その側だけ1つ内側へ寄せてやり直す
            if (!ALPHA_NUM.test(s[l])) { l++; continue; }
            if (!ALPHA_NUM.test(s[r])) { r--; continue; }

            // ここに来た時点で両端とも英数字。比べられる
            if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;

            l++;
            r--;
        }

        // すれ違うまで一度もぶつからなかった = 回文
        return true;
    }
}
```

**応用**: 「作り直してから比べる」と書きたくなったら、**両端から寄せながらその場で比べられないか**を疑う。回文・2数の和（ソート済み）・容器の水量など、対称性か順序がある並びはたいていこの形に落ちる。

### 10. 3Sum

https://neetcode.io/problems/three-integer-sum/question?list=blind75

配列から、足して 0 になる3数の組をすべて返す（同じ組は1回だけ）。

3数を同時に考えると詰む。**1つを `for` で固定すれば、残りは「ソート済みの並びから和が `-nums[i]` になる2数」**、つまりソート済み版の 2Sum に落ちる。添字は3本あるが、**`i` は two pointers の片割れではない**。動くのは `l` と `r` だけで、`i` は1つずつ右へずれる柱。

```
sort 済み:  [ -4,  -1,  -1,   0,   1,   2 ]
               ↑    └────────────────┘
               i         l →     ← r
             固定     この区間だけが two pointers
```

```ts
class Solution {
    // 例: nums = [-1,0,1,2,-1,-4]  ->  [[-1,-1,2],[-1,0,1]]
    threeSum(nums: number[]): number[][] {
        nums.sort((a, b) => a - b);
        const res: number[][] = [];

        // i の後ろに l と r の2席が要るので、i は「後ろから3番目」まで。
        // -2 が無くても答えは同じ。l と r が重なって空回りする回を作らないだけ
        for (let i = 0; i < nums.length - 2; i++) {
            // 1番目が正なら残りも全部正。以降ずっとダメなので break
            if (nums[i] > 0) break;

            // 同じ値を1番目に使う回は「先頭の1回」でいい。2回目以降は
            // 「同じ的 -nums[i] を、前回の一部でしかない範囲で」探し直すだけ（後述）。
            // i > 0 は nums[-1]（undefined）と比べないため。continue なのは次の値は試すから
            if (i > 0 && nums[i] === nums[i - 1]) continue;

            // ここから先は「和が -nums[i] になる2数を探す」= ソート済み版の 2Sum
            let l = i + 1;
            let r = nums.length - 1;

            while (l < r) {
                const sum = nums[i] + nums[l] + nums[r];

                if (sum > 0) r--;      // 大きすぎる -> 右端をひとつ小さい値へ
                else if (sum < 0) l++; // 小さすぎる -> 左端をひとつ大きい値へ
                else {
                    res.push([nums[i], nums[l], nums[r]]);
                    l++;
                    // 2番目が同じ値なら三つ組も同じになるので飛ばす
                    while (l < r && nums[l] === nums[l - 1]) l++;
                }
            }
        }

        return res;
    }
}
```

計算量は O(n²)。ソートの O(n log n) は飲み込まれる。

`[-1,0,1,2,-1,-4]` を sort した `[-4, -1, -1, 0, 1, 2]` を追うと、2つの `if` の役目が見える。

| i | nums[i] | 的 `-nums[i]` | 探す範囲 | 出る組 |
|---|---|---|---|---|
| 0 | -4 | 4 | `[-1, -1, 0, 1, 2]` | なし |
| 1 | -1 | 1 | `[-1, 0, 1, 2]` | `[-1,-1,2]`、`[-1,0,1]` |
| 2 | -1 | 1 | `[0, 1, 2]` | **skip** |
| 3 | 0 | 0 | `[1, 2]` | なし |

- **`- 2`**: `i` は 3 で打ち止め。`i = 4` だと `l = r = 5` で `while` が1回も回らない。空回りする回を作らないだけで、答えは変わらない
- **skip**: `i = 2` は `i = 1` と**的が同じで、範囲はその一部**。同じ的を狭い場所で探し直すだけなので新しい組は出ない（消すと `[-1,0,1]` が2回出る）。ただし**「範囲が狭いから」ではない**。値が変われば的も変わるので、狭い範囲からでも新しい組は出る。潰しているのは「同じ的を2回狙う回」だけ

#### よくある間違い: 両端を外側に置いて真ん中を探す

`l` と `r` を最初から両端に置き、`-(nums[l] + nums[r])` が間にあるかを探す形は動かない。two pointers が成立する条件は**動かす向きが一意に決まる**ことで、この形は見つからなかったときに `l` を進めるか `r` を戻すかの根拠がない。しかも両端が寄るだけでは n 通りのペアしか訪れず、全ペアを見られない。**外側は総当たり、内側だけが two pointers。**

**応用**: N 個の和を問われたら、**1つ固定して N-1 に落とす**。3Sum は 2Sum に、4Sum は 3Sum に帰着する。重複除去は毎回「ソートして、隣と同じ値なら飛ばす」で済む。

### 11. Container With Most Water

https://neetcode.io/problems/max-water-container/question?list=blind75

棒の高さの配列から2本選び、その間に溜められる水の量 `min(2本の高さ) × 幅` の最大値を返す。

9 と同じ形。**両端から始めて、低いほうの棒を内側へ動かす**。

```ts
class Solution {
    // 例: heights = [1, 7, 2, 5, 4, 7, 3, 6]  ->  36
    maxArea(heights: number[]): number {
        let l = 0;
        let r = heights.length - 1;
        let max = 0;

        while (l < r) {
            const height = Math.min(heights[l], heights[r]); // 低いほうから水が溢れる
            max = Math.max(max, height * (r - l));

            // 低いほうを捨てる。同じ高さならどちらでもいい
            if (heights[l] <= heights[r]) l++;
            else r--;
        }

        return max;
    }
}
```

1周で終わるので時間 O(n)、追加のメモリを持たないので空間 O(1)。

#### なぜ「低いほう」を動かすのか

水量の上限を決めているのは低いほうの棒。そして `l` と `r` は寄る一方なので、**幅はこの先ずっと縮む**。

つまり低い側の棒を残したままでは、高さは今より上がらず（上限は据え置き）、幅は必ず減る。**その棒を含む組み合わせは、もう今の値を超えられない**。だから捨ててよい。

逆に高いほうを動かすと、上限を決めている低い側が残ったまま幅だけ減るので、必ず損をする。

```
heights = [1, 7, 2, 5, 4, 7, 3, 6]
           l                    r     min(1, 6) × 7 = 7   -> 低いのは左。l++
              l                 r     min(7, 6) × 6 = 36  -> 低いのは右。r--
              l              r        min(7, 3) × 5 = 15  -> r--
              l           r           min(7, 7) × 4 = 28  -> 同値。l++
                 l        r           min(2, 7) × 3 = 6   -> l++
                    l     r           min(5, 7) × 2 = 10  -> l++
                       l  r           min(4, 7) × 1 = 4   -> l++ ですれ違い終了

-> 36
```

**捨てる根拠が一意に決まる**（低いほうは常に捨てられる）から two pointers が成立する。

#### よくある間違い: `r` を巻き戻す

`l` を `for` で回し、内側の `while` で `r` を右端まで戻す書き方は、10 で挙げたのと同じ罠。

```ts
for (let l = 0; l < r; l++) {
    while (l < r) { /* ... */ r--; }
    r = heights.length - 1; // ここで巻き戻している = 全ペアを試している
}
```

答えは合うが、これは**すべてのペアを試す二重ループ**そのもので O(n²)。制約は `n <= 100,000` なので、最悪 `100,000² / 2 = 50 億回`。ジャッジの制限時間内に終わらず **Time Limit Exceeded**（実行時間の上限を超えたので、ジャッジ側がプロセスを強制終了した合図）になる。

**ポインタは戻さない**。戻した時点で、それは two pointers ではなく総当たり。

**応用**: two pointers が使えるかは「**片方を捨てる根拠が毎回一意に決まるか**」で判断する。10 は和の大小、11 は高さの低さがその根拠だった。根拠が作れなければ two pointers ではない。

## Sliding Window

連続した区間（＝窓）を右へずらしながら、その区間についての答えを更新していく。

Two Pointers との違いは**動く向き**。two pointers は両端から中央へ寄るので区間は縮む一方だが、sliding window は**左端も右端も右へ進む**。右端を伸ばして窓を広げ、条件を外れたら左端を詰めて窓を縮める。どちらのポインタも戻らないので**各要素は多くても2回しか触られない**——だから O(n)。

窓幅が決まっている**固定長**（例: 連続 k 個の最大和）と、条件しだいで伸び縮みする**可変長**（例: 重複のない最長部分文字列）の2種類がある。

### 12. Best Time to Buy and Sell Stock

https://neetcode.io/problems/buy-and-sell-crypto/question?list=blind75

株価の配列から、1回だけ買って**そのあとの日に**売るときの最大利益を返す。損しかしないなら取引しない（＝0）。

素直に書くと「買う日 × 売る日」の全ペアを試す二重ループで O(n²)。崩し方は 3（Two Sum）と同じで、**片方を決めてしまう**。

今日を**売る日**だと決めた瞬間、買値は考えるまでもなく**今日より前でいちばん安かった値**に決まる。他の日に買う理由がどこにもないから。つまり、覚えておくものは**最安値ひとつだけ**でいい。

```ts
class Solution {
    // 例: prices = [10, 1, 5, 6, 7, 1]  ->  6
    maxProfit(prices: number[]): number {
        let minBuy = prices[0]; // ここまでで見た最安値 = 買う日
        let maxProfit = 0; // 取引しない選択があるので初期値は 0

        for (const sell of prices) {
            // 今日を売る日とみなす。買値はもう決まっている
            maxProfit = Math.max(maxProfit, sell - minBuy);
            minBuy = Math.min(minBuy, sell);
        }

        return maxProfit;
    }
}
```

時間 O(n)、空間 O(1)。**添字 `i` を一度も使わないなら、ループは `for...of` に畳める**。

#### どこが Sliding Window なのか

窓は `[買った日 l, 今日 r]` の区間。「**この区間ぶん株を持ち続けている**」という意味になる。

```
prices =  10    1    5    6    7    1

          [--]                            r=0  窓は 10 だけ。利益 0
                [--]                      r=1  1 < 10 -> 窓を捨てて 1 から作り直す（l が飛ぶ）
                [-------]                 r=2  5 - 1 = 4
                [------------]            r=3  6 - 1 = 5
                [-----------------]       r=4  7 - 1 = 6  <- 最大
                [----------------------]  r=5  1 - 1 = 0（買値と同じなので l は動かない）
```

- **`r` は必ず1日ずつ右へ進む**。ループそのものが `r`
- **`l` は1つずつ動かない**。より安い日が来たときだけ**そこへ飛ぶ**

どちらも右へしか動かず戻らないので、配列を1周した時点で終わる。これが O(n) の中身。

コードの `minBuy` が、この `l` の位置の価格そのもの。**答えに添字は要らない**ので、ポインタが変数1本に潰れている——`l`, `r` が見えないだけで、やっていることは窓の移動。

### 13. Longest Substring Without Repeating Characters

https://neetcode.io/problems/longest-substring-without-duplicates/question?list=blind75

同じ文字を含まない**連続した**部分文字列のうち、いちばん長いものの長さを返す。

12 は窓の「左端の価格」だけ覚えれば足りたが、今回は**窓の中身そのもの**を覚える必要がある。「この文字はもう窓に入っているか」を O(1) で聞きたいので、入れ物は `Set`。

型は毎回これ。**右端を1つ伸ばす → 条件を満たさなくなったら、満たすまで左端を詰める → 今の窓幅で答えを更新する**。

```ts
class Solution {
    // 例: s = "zxyzxyz"  ->  3
    //         0123456
    lengthOfLongestSubstring(s: string): number {
        // 窓 [l, r] の中にいる文字。窓の中身と常に一致させる
        const window = new Set<string>();
        let l = 0;
        let longest = 0;

        for (let r = 0; r < s.length; r++) {
            // 右端の文字が窓の中にあるなら、その文字が窓から出るまで左端を詰める。
            // 例: 窓が "zxy"（l=0, r=2）のとき、r=3 に 'z' が来る
            //     -> 窓に 'z' がいるので、左端の s[0]='z' を捨てて l=1
            //     -> 窓は "xy"。'z' がいなくなったので停止
            while (window.has(s[r])) {
                window.delete(s[l]);
                l++;
            }

            window.add(s[r]); // 窓は "xyz"（l=1, r=3）になった
            // 添字は両端とも含むので +1（幅ではなく個数を数えている）。3 - 1 + 1 = 3
            longest = Math.max(longest, r - l + 1);
        }

        return longest;
    }
}
```

`l` も `r` も右に進むだけなので、各文字は `add` で1回・`delete` で高々1回しか触られない。時間 O(n)、空間 O(m)（m は使われている文字の種類数）。

#### `if` ではなく `while` である理由

重複が見つかったとき、左端を**1つ**動かせば済むとは限らない。捨てるべきなのは「ぶつかった文字が窓から出るまで」なので、そこまで詰め続ける。

```
s = "abcbd"
     01234

r=3 の 'b' が窓 [0,2]="abc" とぶつかる
  l=0: 'a' を捨てる -> 窓は "bc"。まだ 'b' がいる
  l=1: 'b' を捨てる -> 窓は "c"。ぶつからなくなったので停止
  'b' を入れて 窓 [2,3]="cb"

r=4 の 'd' はぶつからない -> 窓 [2,4]="cbd"  ->  3
```

`l++` を1回で済ませると、`l` が 1 のまま `'b'` を入れることになり、窓が `"bcb"` という**重複を含んだ状態**になる。そのまま `'d'` まで伸びて 4 を返してしまう（正解は 3）。**窓の中身と `Set` の中身がズレた時点で、以降の判定は全部信用できない。**

#### 長さを変数で持たない

`length` のようなカウンタを別に持って `l++` のたびに調整する書き方もできるが、**幅は `r - l + 1` でいつでも計算できる**ので持たないほうがいい。同じ事実を2箇所で管理すると、片方の更新漏れがそのままバグになる。**状態は `l` と `Set` の2つだけ**に絞れば、壊れる余地がなくなる。

**応用**: 「連続した区間で、条件を満たす最長」と来たら sliding window の可変長。書くことは3つだけ——**右端を伸ばす / 条件を壊したら左端を詰める / 窓幅で答えを更新する**。変わるのは「条件」と「窓の状態をどう持つか（`Set` か `Map` か カウンタか）」だけ。

### 14. Longest Repeating Character Replacement

https://neetcode.io/problems/longest-repeating-substring-with-replacement/question?list=blind75

大文字だけの文字列 `s` について、**好きな文字を k 個まで別の文字に置き換えてよい**。そのうえで「全部同じ文字」にできる連続部分文字列の、最長の長さを返す。

#### 詰まるのは「どう置き換えるか」を考えるから

`"AAABABB"`, `k = 1` を前にして「どの文字を何に替えるか」を考え始めると、選択肢が爆発して手が止まる。**この問題は文字列を1文字も書き換えない**。置換は最後まで想像の中だけで、コードに出てくるのは数え上げだけ。

考える順番はこう。

**① まず窓を1つ固定して、「この窓は作れるか？」だけを考える。**

窓 `"AAAB"` を全部同じ文字にしたい。残す文字は何にすべきか——**その窓でいちばん多い文字**一択。`A` を残せば置換は `B` の1個で済むが、`B` を残すと `A` 3個ぶんかかる。多いほうを残すのが常に得。

**② すると、必要な置換数が引き算1回で出る。**

```
必要な置換数 = 窓の長さ − 窓の中でいちばん多い文字の個数
"AAAB" なら  4 − 3（A が3個）= 1

この窓が作れる  ⟺  必要な置換数 <= k
```

**「置き換える」という操作が、「窓の中の文字を数える」に化けた。** ここが本問の全部。

**③ 判定式ができれば、あとは 13 と同じ型に乗るだけ。**

「連続した区間で、条件を満たす最長」なので sliding window の可変長。右端を伸ばし、置換数が `k` を超えたら左端を詰め、窓幅で答えを更新する。

```ts
const A = 'A'.charCodeAt(0);

class Solution {
    // 例: s = "AAABABB", k = 1  ->  5（"AAABA" の B を A に替える）
    characterReplacement(s: string, k: number): number {
        // 「窓の中に」各文字が何個あるか。大文字のみなので26個の配列で足りる（2 と同じ手）
        // count[0] が 'A' の個数、count[1] が 'B' の個数……
        const count = new Array(26).fill(0);
        let l = 0;
        let longest = 0;

        for (let r = 0; r < s.length; r++) {
            count[s.charCodeAt(r) - A]++; // 右端の文字を窓に入れる

            // 必要な置換数が k を超えているあいだ、左端を詰める。
            // 例: 窓 "AAABAB"（A が4個）は 6 - 4 = 2 個の置換が要る。k = 1 なら大きすぎるので縮める
            while (r - l + 1 - Math.max(...count) > k) {
                count[s.charCodeAt(l) - A]--; // 左端の文字を窓から出す
                l++;
            }

            // ここに来た時点で、窓は必ず「k 回以内で全部同じにできる」状態
            longest = Math.max(longest, r - l + 1);
        }

        return longest;
    }
}
```

`Math.max(...count)` が「いちばん多い文字の個数」。中は常に26要素なので、この1行は定数時間とみなせる。全体で時間 O(26n) = O(n)、空間 O(26) = O(1)。

#### `s = "AAABABB"`, `k = 1` を追ってみる

```
s =  A  A  A  B  A  B  B
     0  1  2  3  4  5  6

r=0  [A]                窓長1  最多A=1  置換 0  -> longest 1
r=1  [AA]               窓長2  最多A=2  置換 0  -> longest 2
r=2  [AAA]              窓長3  最多A=3  置換 0  -> longest 3
r=3  [AAAB]             窓長4  最多A=3  置換 1  <= k  -> longest 4
r=4  [AAABA]            窓長5  最多A=4  置換 1  <= k  -> longest 5  <- 最大
r=5  [AAABAB]           窓長6  最多A=4  置換 2  > k   -> 縮める
       [AABAB]          窓長5  最多A=3  置換 2  > k   -> まだ縮める
         [ABAB]         窓長4  最多A=2  置換 2  > k   -> まだ縮める
           [BAB]        窓長3  最多B=2  置換 1  <= k  -> 停止。longest は 5 のまま
r=6  [BABB]             窓長4  最多B=3  置換 1  <= k  -> longest は 5 のまま

-> 5
```

`r=4` の窓 `"AAABA"` は「`B` を1個 `A` に替えれば `AAAAA`」なので条件を満たす。**実際に替えてはいない**。「4 個の `A` と、それ以外1個」という数え上げだけで判断している。

**応用**: 「〜を k 個まで変更してよい。条件を満たす最長は？」は sliding window の定番の形。やることは**「今の窓を条件に合わせるコストを、数え上げで表す」**の1点だけ。コストが k 以下なら伸ばし、超えたら縮める。この問題ではそれが `窓の長さ − 最頻文字の個数` だった。

## Stack

最後に入れたものから先に取り出す入れ物（**LIFO**）。配列の `push` / `pop` がそのままスタックになる。

効くのは**入れ子**を扱うとき。「いちばん内側から片付く」は「最後に積んだものから降ろす」と同じ形。括弧の対応、HTML タグの開閉、関数呼び出し（**コールスタック**）——全部これ。

### 15. Valid Parentheses

https://neetcode.io/problems/validate-parentheses/question?list=blind75

`(){}[]` だけからなる文字列が、**正しく対応して閉じているか**を判定する。`"([{}])"` は true、`"[(])"` は false。

`"([{"` まで読んだ時点で、次に来てよい閉じ括弧は `}` だけ。その次は `]`、その次が `)`。つまり**開いた順の逆から閉じる**。覚えておくべきは「まだ閉じていない開き括弧の列」で、これは入力しだいでいくらでも伸びる。変数では持てないのでスタックが要る。

```ts
// 閉じ括弧 -> 対応する開き括弧
const CLOSE_TO_OPEN: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
};

class Solution {
    // 例: s = "([{}])"  ->  true
    isValid(s: string): boolean {
        // まだ閉じられていない開き括弧を、出てきた順に積む
        const stack: string[] = [];

        for (const c of s) {
            const open = CLOSE_TO_OPEN[c];

            // 対応表に無い = 開き括弧。まだ相方が来ていないので積んでおく
            if (!open) {
                stack.push(c);
                continue;
            }

            // 閉じ括弧。相方はいちばん最後に積んだもの以外にありえない
            if (stack.pop() !== open) return false;
        }

        // 積んだものが全部払い出されていれば正しい（"(((" は残るので false）
        return stack.length === 0;
    }
}
```

時間 O(n)、空間 O(n)。

```
"[(])"
c='['  積む                      stack = ['[']
c='('  積む                      stack = ['[', '(']
c=']'  期待は '['、pop() は '('  -> 不一致で false
```

**応用**: 覚えておくものが**1個で足りるなら変数、何個になるか分からないならスタック**。12（Best Time to Buy and Sell Stock）で覚えたのは「これまでの最安値」1個だけだったので `minBuy` という変数で済んだ。今回は「まだ閉じていない開き括弧」が入力しだいで何個にでもなるので、積める入れ物が要る。

## Binary Search

範囲を半分に割り、**答えが入っていないほうを捨てる**。1回で候補が半分になるので O(log n)（100万要素でも20回）。

「ソート済みの配列から値を探す手法」と覚えていると使いどころを見落とす。要るのは**どちらの半分を捨ててよいか言えること**だけで、探す対象が値である必要はない。

### 16. Find Minimum in Rotated Sorted Array

https://neetcode.io/problems/find-minimum-in-rotated-sorted-array/question?list=blind75

昇順の配列を何回か回転させた（末尾の何個かが先頭に移った）ものから、最小値を O(log n) で返す。

```
[4, 5, 6, 7, 0, 1, 2]
          ↓ ここだけ下がる（段差）
 ---昇順---  --昇順--
             ↑ 最小値は段差の直後
```

何回転させても**下がる箇所は1つだけ**。つまり探すのは値ではなく**段差の直後の位置**になる。

捨てる根拠は**真ん中 `m` と右端 `r` の比較**で作れる。

- `nums[m] < nums[r]` → `m`〜`r` は下がっていない = 段差は左。最小は `m` か、その左
- `nums[m] > nums[r]` → あいだで下がっている = 段差は右。最小は `m` より右

```ts
class Solution {
    // 例: nums = [4, 5, 6, 7, 0, 1, 2]  ->  0
    findMin(nums: number[]): number {
        let l = 0;
        let r = nums.length - 1;

        // 「答えは必ず [l, r] の中にいる」を保ったまま、範囲を半分にしていく
        while (l < r) {
            const m = Math.floor((l + r) / 2);

            // 最小は m か、その左。m はまだ候補なので捨てない
            if (nums[m] < nums[r]) r = m;
            // 最小は m より右。m が最小でないことは確定しているので飛ばせる
            else l = m + 1;
        }

        // l と r が同じ位置まで詰まった = そこが段差の直後
        return nums[l];
    }
}
```

時間 O(log n)、空間 O(1)。左右の更新が `m + 1` と `m` で非対称なのは、**`m` 自身を捨ててよいかが違う**から。

- `nums[m] > nums[r]` = `m` は**段差の手前（大きいほうの並び）**にいる。最小は段差の直後なので必ず `m` より右 → `m` を捨てて `l = m + 1`
- `nums[m] < nums[r]` = `m` は**段差の向こう（小さいほうの並び）**にいる。`m` 自身が段差の直後（＝最小）かもしれない → 捨てられないので `r = m - 1` ではなく `r = m`

```
[4, 5, 6, 7, 0, 1, 2]
          m        r     7 > 2  ->  m は左の並び。最小は m より右
[4, 5, 6, 7, 0, 1, 2]
             m     r     0 < 2  ->  m は右の並び。m 自身が最小かもしれない
```

ループ条件が `l <= r` でなく `l < r` なのは、`[l, r]` に必ず答えが残っているから。幅が1に潰れた時点でそれが答えなので、「見つけたら返す」判定が要らない。

```
l=0 r=6  m=3  nums[3]=7 > nums[6]=2  -> 段差は右。l=4
l=4 r=6  m=5  nums[5]=1 < nums[6]=2  -> 段差は左。r=5
l=4 r=5  m=4  nums[4]=0 < nums[5]=1  -> 段差は左。r=4
l===r=4  ->  nums[4] = 0
```

**応用**: 二分探索が使えるかは「**`m` を見て片側を捨てる根拠が言えるか**」で決まる。ここではそれが「右端との大小」だった。

### 17. Search in Rotated Sorted Array

https://neetcode.io/problems/find-target-in-rotated-sorted-array/question?list=blind75

回転済みの配列から `target` の添字を返す。無ければ -1。

回転済みの配列は**昇順の並びが2本つながったもの**。段差の位置は 16（Find Minimum in Rotated Sorted Array）で求めたので、**そこで割ってしまえば、ただのソート済み配列が2本**になる。あとは両方に教科書どおりの二分探索をかけるだけ。

```ts
class Solution {
    // 例: nums = [4, 5, 6, 7, 0, 1, 2], target = 0  ->  4
    search(nums: number[], target: number): number {
        // 段差の直後 = 小さいほうの並びの先頭
        const pivot = this.findMinIndex(nums);

        const left = this.binarySearch(nums, target, 0, pivot - 1);
        return left !== -1 ? left : this.binarySearch(nums, target, pivot, nums.length - 1);
    }

    // 16 と同じ
    private findMinIndex(nums: number[]): number {
        let l = 0;
        let r = nums.length - 1;

        while (l < r) {
            const m = Math.floor((l + r) / 2);

            if (nums[m] < nums[r]) r = m;
            else l = m + 1;
        }

        return l;
    }

    // 範囲 [l, r] だけを見る、ふつうの二分探索
    private binarySearch(nums: number[], target: number, l: number, r: number): number {
        while (l <= r) {
            const m = Math.floor((l + r) / 2);

            if (nums[m] === target) return m;
            if (nums[m] < target) l = m + 1;
            else r = m - 1;
        }

        return -1;
    }
}
```

二分探索が最大2回なので O(log n)、空間 O(1)。

- **「target がどちらの並びにいるか」を判定しない**。判定すれば探索は1回で済むが、境界の不等号を間違える余地が生まれる。**2回まわして定数を払うほうが壊れない**
- 回転していない配列も特別扱い不要。`pivot = 0` になり、左の範囲が空 `[0, -1]` になるだけ（`l <= r` が最初から偽で即 -1）
- ループ条件が `l < r` と `l <= r` で違うのは、**答えが必ずあるか**の差。最小値は必ずいるので幅1に潰れた時点で確定、`target` は無いかもしれないので範囲が空になるまで回す

**応用**: 新しく見える問題でも、**すでに解いた問題に帰着できないか**をまず考える。ここでは 16（段差探し）が済んでいたので、残りは教科書どおりの二分探索だった。

## Linked List

### 18. Reverse Linked List

```ts
//
```
