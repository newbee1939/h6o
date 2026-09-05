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

### 6. Encode and Decode Strings

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
        //        添字 7 の : は 2周目の slice が丸ごと持っていくだけで、
        //        indexOf の探索範囲（i=4 から）には最初の : =添字5 しか引っかからない

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

### 8. Valid Sudoku

https://neetcode.io/problems/valid-sudoku/question?list=neetcode150

9×9 の盤面が、行・列・3×3 の箱それぞれで数字が重複していないかを判定する。空マス `.` は無視。埋まっている必要も、解ける必要もない。**今ある数字が矛盾していないか**だけを見る。

まず用語を分けておく。この問題は**数えるものが 2 種類あって、そこが混ざると読めなくなる**。

| | 何か | 個数 |
|---|---|---|
| **マス** | 数字が 1 つ入る最小の枠。座標は `(r, c)` | **81** |
| **箱** | 太線で区切られた 3×3 のかたまり | **9** |

81 マスが 9 個の箱に分かれている（**1 箱に 9 マス**入っていて 9 × 9 = 81）。以降、番号 0〜8 が出てきたら**マスではなく箱を数えている**。

やっていることは 1（Contains Duplicate）と同じ「重複判定」。違うのは**1 マスの数字が 3 つのグループに同時に属している**こと。`board[4][7]` の数字は「4 行目の仲間」であり「7 列目の仲間」であり「箱 5 の仲間」でもある。

```
1 の重複判定:  数字の行き先は1つ  ->  Set 1個
この問題:      数字の行き先は3つ  ->  Set を 行9個 + 列9個 + 箱9個 = 27個
```

だったら**袋を 27 個用意して、1 マスごとに 3 つとも確認する**だけでいい。袋は「グループの数」だけ要るのであって、マスの数（81）は要らない。

```ts
class Solution {
    isValidSudoku(board: string[][]): boolean {
        // 袋はマスの数（81）ではなく「グループの数」だけ用意する
        // 行 0〜8 それぞれに「その行で見た数字を入れる袋」を1つずつ。計9個
        // rows[3] は「3行目に出た数字の集合」という意味になる
        const rows = Array.from({ length: 9 }, () => new Set<string>());
        const cols = Array.from({ length: 9 }, () => new Set<string>()); // 列は9本なので9個
        const boxes = Array.from({ length: 9 }, () => new Set<string>()); // 箱も9個（81個ではない）

        // 上の行から順に、各行を左から右へ。81マスをちょうど1回ずつ見る
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = board[r][c];
                if (val === '.') continue; // 空マスは何も主張していないので飛ばす

                // 「今いるマスが、9個の箱のうちどれに入っているか」を求める。
                // 箱は9個しかないので b は 0〜8。同じ箱の中の9マスは全員おなじ b になる。
                // 座標 (r, c) は81通りあるが、b はそれを9通りに畳んだもの。
                // この1行だけが本問の考えどころ（詳しくは下で分解する）
                const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

                // 行・列・箱の3つの袋のどれか1つにでも同じ数字が既にあれば、そこが重複
                if (rows[r].has(val) || cols[c].has(val) || boxes[b].has(val)) return false;

                // なければ3つの袋すべてに登録して次のマスへ
                rows[r].add(val);
                cols[c].add(val);
                boxes[b].add(val);
            }
        }

        // 81マス見終わって一度もぶつからなかった = 有効な盤面
        return true;
    }
}
```

#### `rows[0]` の中身は「1 個の `Set`」

`rows` は **`Set` が 9 個入った配列**。`rows[0]` はその 1 個目の `Set` そのもの。配列のマス 1 つに、`Set` が丸ごと 1 個ずつ入っている（入れ子）。

```
rows = [ Set{} , Set{} , Set{} , Set{} , Set{} , Set{} , Set{} , Set{} , Set{} ]
          ↑0      ↑1      ↑2      ↑3      ↑4      ↑5      ↑6      ↑7      ↑8
       0行目用  1行目用                                                8行目用

盤面を進むと、それぞれの袋が独立に育っていく:
rows[0] = Set{ "5", "3", "7" }        0行目でここまでに見た数字
rows[1] = Set{ "6", "1", "9", "5" }   1行目でここまでに見た数字
```

だから `rows[r].has(val)` は「**r 行目の袋の中に val が入っているか**」を聞いていることになる。

### 9. Longest Consecutive Sequence

https://neetcode.io/problems/longest-consecutive-sequence/question?list=neetcode150

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

### 10. Valid Palindrome

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

### 11. Two Integer Sum II

https://neetcode.io/problems/two-integer-sum-ii/question?list=neetcode150

ソート済みの配列から、足して `target` になる2つの**添字**（1 始まり）を返す。

ソート済みなら、**和が目標より大きいか小さいか**が「どちらの端を動かすか」をそのまま教えてくれる。

```ts
class Solution {
    // 例: numbers = [1, 2, 3, 4], target = 3  ->  [1, 2]
    twoSum(numbers: number[], target: number): number[] {
        let l = 0;
        let r = numbers.length - 1;

        // すれ違ったら終わり。同じ要素は2回使えないので l < r（l <= r ではない）
        while (l < r) {
            const sum = numbers[l] + numbers[r];

            if (sum > target) r--;      // 大きすぎる -> 右端をひとつ小さい値へ
            else if (sum < target) l++; // 小さすぎる -> 左端をひとつ大きい値へ
            else return [l + 1, r + 1]; // 1 始まりなので +1
        }

        return [];
    }
}
```

#### よくある間違い: `r` を巻き戻す

`l` を `for` で回し、`l` が進むたびに `r` を右端へ戻す書き方は、動くが**すべてのペアを試す二重ループ**になっていて O(n²)。捨てた候補を拾い直している時点で、two pointers ではなく総当たり。**ポインタは戻さない**のが型。

### 12. 3Sum

```ts
//
```
