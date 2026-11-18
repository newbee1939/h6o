---
title: AI ペンテスター Shannon を GCE VM × GitHub Actions で定期実行する基盤を構築した話
date: 2026-11-18
lang: ja
description: OSS の AI ペンテスター Shannon を、GCE VM 1 台と GitHub Actions の self-hosted runner で定期実行する基盤を作った構成と、ぶつかった壁をまとめました
---

## 概要

OSS の AI ペンテスター [Shannon](https://github.com/KeygraphHQ/shannon) を、検証環境に対して定期実行する基盤を Google Cloud 上に作りました。設計から実装まで一人で担当し、Go・Terraform・GitHub Actions で構築しています。

当初は Cloud Run Jobs で作るつもりでした。ただ、Shannon は実行中に自分でコンテナを立てるため、特権コンテナが必要です。Cloud Run はこれに対応していません。

最終的に、GCE VM 1 台を起動・停止するだけの構成にし、その VM を GitHub Actions の self-hosted runner として使っています。ジョブのキュー管理は GitHub に任せているので、キューの仕組みを自作せずに済みました。

## 背景

ペネトレーションテスト（実際に攻撃して穴を探す診断）は、「年 1 回、外部に依頼する」のが一般的です。その間にも、コードは何百回も変わります。

AI によって攻撃する側が速く・安くなっているなら、守る側も継続的に確かめる必要があると考えました。

そこで、CTEM（Continuous Threat Exposure Management）の考え方を取り入れることにしました。CTEM は、脅威にさらされている状態を継続的に管理するためのプログラムで、5 つのフェーズからなります。全部を一度に整備するのは重いので、まずは「攻撃が本当に通るかを確かめる」Validation フェーズだけに絞りました。

ツールには Shannon を選びました。ソースコードを読んで攻撃経路を探し、実際に攻撃してみて、成功したものだけを報告してくれます。OSS なので費用は LLM の利用料だけです。商用の AI ペンテストは 1 回数千ドル規模のものが多く、桁が違いました。

## 技術選定

### Cloud Run 案が崩れた

「起動して、実行して、終わる」という処理なので、当初は Cloud Run Jobs がぴったりだと考えていました。

ところが、Terraform を書き始める前に Shannon のソースを読んでみると、実行中に自分で `docker run` を呼んでコンテナを立てる作りになっていました。つまり、実行環境の中で Docker を動かすための特権コンテナ（ホストに近い強い権限を持つコンテナ）が必要です。

一方、Cloud Run は公式に [privileged containers に対応していません](https://cloud.google.com/run/docs/container-contract)。この時点で Cloud Run 案は使えないことがわかりました。

### 消去法で VM に

ほかの候補も 1 つずつ外していきました。

| 候補 | 外した理由 |
| -- | -- |
| Cloud Run | 特権コンテナに非対応 |
| GKE Autopilot | 特権 Pod を使うには組織ポリシーの変更が必要 + 会社としてGKEの運用をCloud Runに載せ替えた背景 |
| GKE Standard | ノードは結局 VM なので、運用の手間が減らない + 会社としてGKEの運用をCloud Runに載せ替えた背景 |
| GitHub-hosted runner | 送信元 IP を固定できない（対象の WAF は IP の許可リスト方式） |
| ベンダーの SaaS 版 | ソースコードと攻撃結果が社外を通る |

残ったのは GCE VM でした。

### GitHub Actions で動かす

GitHub Actions を選んだ理由は 2 つです。

- 公式の Action がある：Shannon には公式の GitHub Action（[shannon-action](https://github.com/KeygraphHQ/shannon-action)）がある
- キューを GitHub に任せられる：GitHub は、空いている runner にジョブを 1 件ずつ割り当て、runner が見つからないジョブも[最大 24 時間待ってくれる](https://docs.github.com/en/actions/reference/limits)。Pub/Sub を使っても、メッセージを受け取ってスキャンを走らせるワーカーは自分で書くことになるが、その役を runner が担ってくれる

「GitHub Actions を使う」というと、GitHub のマシンで動くイメージがあるかもしれません。ですが、`runs-on` で自前の VM（self-hosted runner）を指定すれば、実行場所は自分で選べます。

今回は、GitHub のマシン（GitHub-hosted runner）ではなく self-hosted runner を選びました。理由は次の 2 つです。

- 送信元 IP を固定できる：GitHub のマシンは IP が毎回変わるので、対象の前段にある WAF の許可リストに登録できない。自前の VM なら、Cloud NAT の固定 IP から攻撃できる
- 長時間のスキャンに耐えられる：GitHub のマシンでは、1 ジョブは[最大 6 時間](https://docs.github.com/en/actions/reference/limits)まで。スキャンは数時間かかるので余裕がない

### JIT runner で 1 ジョブずつ使い捨てる

self-hosted runner を GitHub に登録する方法は 2 つあり、違いは「誰が登録するか」だけです。

```
registration token 方式: 管理役が registration token（登録専用のトークン）を取る → runner がそれで自分を登録する
JIT config 方式        : 管理役が登録まで済ませる                             → runner は起動するだけ
```

今回は dispatcher が管理役です。GitHub App の秘密鍵で JWT を作り、installation access token に交換し、それで `generate-jitconfig` を叩くと、その時点で登録が済んだ認証情報が返ります。この runner は 1 ジョブだけ受け取れる使い捨ての runner として登録されていて、VM はそれを `run.sh --jitconfig` に渡すだけです。ジョブが終わると登録は消えます。

JIT config を選んだのは、VM に「runner を登録できる鍵」を渡さずに済み、前のジョブの状態も残らないからです。

### ARC の考え方を小さく借りる

この「ジョブが来たら runner を用意し、1 ジョブ終わったら消す」という形は、GitHub 公式の [ARC（Actions Runner Controller）](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller)と同じ考え方です。ARC は Kubernetes 上で、ジョブ数に応じて使い捨ての runner Pod を増減させる仕組みです。

| ARC | 今回 |
| -- | -- |
| listener がジョブを待ち受け、runner の数を決める | dispatcher が VM を起動し、毎時の見回りで止める |
| controller が JIT 設定を取得して runner Pod を作る | dispatcher が JIT 設定を発行し、VM がそれで runner を立てる |
| ジョブが終わると runner Pod を消す | ジョブが終わると runner の登録が消え、作り直す |

ARC そのものを使わなかったのは、Kubernetes が前提だからです。GKE は前述の理由で外していますし、ARC の listener は常時起動しておく必要があります。月 3 回しか動かないので、「0 台か 1 台か」を切り替えるだけで十分でした。複数の対象を並行して回したくなったら、ARC に寄せるのが次の選択肢になります。

## アーキテクチャ

Cloud Run 上に Go で書いた司令塔（dispatcher）を置き、VM の起動・停止、ワークフローの起動、トークンの発行を受け持たせています。VM は外部 IP を持たず、Cloud NAT の固定 IP から攻撃します。

### 1 回のスキャンの流れ

```mermaid
sequenceDiagram
  autonumber
  participant S as Scheduler
  participant D as dispatcher
  participant V as VM
  participant G as GitHub
  participant T as 対象アプリ
  participant SL as Slack

  rect rgba(128, 128, 128, 0.08)
    Note over S,G: A. 起動の依頼
    S->>D: POST /dispatch（Scheduler の ID トークン）
    Note over S,D: ID トークン = Google が署名した身分証。<br>dispatcher は「誰か」をこれで知り、許可した相手だけ通す
    D->>V: VM を起動（instances.start）
    activate V
    D->>D: App の秘密鍵で JWT を作る
    D->>G: JWT を installation access token に交換
    D->>G: ワークフローを起動（workflow_dispatch）
    Note over D,G: VM の起動完了は待たない。<br>ジョブは runner が来るまで GitHub 側で待つ
  end

  rect rgba(128, 128, 128, 0.15)
    Note over D,V: B. VM の準備（起動のたびに startup-script が走る）
    V->>V: メタデータサーバーから VM の ID トークンを取得
    V->>D: GET /setup（VM の ID トークン）
    D-->>V: setup.sh（パッチ適用、Docker・runner の導入）
  end

  loop VM が止まるまで（systemd が C → D を繰り返す）
    rect rgba(128, 128, 128, 0.08)
      Note over D,G: C. runner の登録
      V->>D: POST /runner-token（VM の ID トークン）
      D->>G: JIT config を発行
      D-->>V: JIT config（1 ジョブ限り）
      V->>G: run.sh --jitconfig で起動し、ジョブを 1 件受け取る
    end

    rect rgba(128, 128, 128, 0.15)
      Note over D,T: D. スキャン
      V->>D: GET /target-token?repo=...（VM の ID トークン）
      D->>G: 別の App で対象 1 件に絞ったトークンを発行
      D-->>V: 対象用トークン ＋ 攻撃先の URL
      V->>G: 対象用トークンで対象リポジトリを clone
      V->>T: Shannon で攻撃（数時間）
      V->>G: レポートを run の成果物として保存
      V->>SL: 結果を通知
      Note over V,G: ジョブが終わると runner の登録は消える
    end
  end

  rect rgba(128, 128, 128, 0.08)
    Note over S,G: E. 停止
    S->>D: POST /reap（Scheduler の ID トークン、毎時）
    Note over S,D: ingress は「どこから」、ID トークンは「誰が」を確かめる
    D->>G: runner の状態と待ちのジョブを確認
    D->>V: どちらもなく、起動から 30 分以上なら停止（instances.stop）
    deactivate V
  end
```

**A. 起動の依頼（1〜5）**：dispatcher は VM を起動したら、起動の完了は待たずにすぐワークフローを起動します。ジョブは GitHub 側で runner が来るまで待ってくれるからです。トリガーを dispatcher の 1 か所に集めたので、「VM の起動」と「ワークフローの起動」の時刻がずれる事故は起きません。

**B. VM の準備（6〜8）**：VM はサービスアカウントキー（秘密鍵の入った JSON ファイル）を持たなくても、メタデータサーバー（`metadata.google.internal`）に HTTP で頼むだけで、Google が署名した ID トークンを受け取れます。メタデータサーバーへのリクエストは [VM が載っている物理ホストの外に出ない](https://cloud.google.com/compute/docs/metadata/overview)ので、身元は鍵ではなく基盤が保証してくれます。startup-script はそれを付けて dispatcher から setup.sh を受け取り、実行するだけです。setup.sh は dispatcher のイメージに埋め込んであるので、main にマージすれば次の起動から反映されます。

**C. runner の登録（9〜12）**：systemd のサービスが dispatcher に JIT config を頼み、runner を起動します。

**D. スキャン（13〜19）**：dispatcher は、リポジトリ名がレビュー済みの対象一覧（`targets.yaml`）にあるときだけ対象用トークンを発行し、攻撃先の URL も一緒に返します。ジョブが終わると runner の登録は消え、systemd が C からやり直すので、待っているジョブはまっさらな runner で順番に処理されます。

**E. 停止（20〜22）**：dispatcher が毎時、runner と待ちのジョブを確認し、仕事がなければ VM を止めます。

## 設計で考えたこと

### 攻撃する VM に秘密を置かない

VM は攻撃対象と直接やり取りするので、システムの中でいちばん乗っ取られやすい場所です。

そこで、VM のサービスアカウントには、GitHub App の秘密鍵を読む権限をあえて与えていません。仮に VM が乗っ取られても、Google Cloud の IAM がサーバー側で読み取りを拒否します。

VM と dispatcher の間でやり取りするトークンを並べると、次のようになります。

```mermaid
sequenceDiagram
  autonumber
  participant M as メタデータサーバー
  participant V as VM
  participant D as dispatcher
  participant SM as Secret Manager
  participant G as GitHub

  rect rgba(128, 128, 128, 0.08)
    Note over M,D: VM の身分証明
    V->>M: ID トークンを要求
    M-->>V: ID トークン（Google が署名、有効 1 時間）
  end

  rect rgba(128, 128, 128, 0.15)
    Note over V,G: runner 用（runner 用 App）
    V->>D: POST /runner-token（ID トークン）
    D->>SM: runner 用 App の秘密鍵を読む
    D->>D: JWT を作る（有効 10 分、App であることの証明だけ）
    D->>G: JWT を提示
    G-->>D: installation access token（有効 1 時間、API を呼べる）
    D->>G: installation access token で JIT config を要求
    G-->>D: JIT config（1 回限り）
    D-->>V: JIT config
    V->>G: run.sh --jitconfig で runner を起動（1 ジョブだけ受け取れる）
  end

  rect rgba(128, 128, 128, 0.08)
    Note over V,G: 対象リポジトリ用（対象用 App）
    V->>D: GET /target-token?repo=...（ID トークン）
    D->>D: repo が targets.yaml にあるか確認
    D->>SM: 対象用 App の秘密鍵を読む
    D->>G: JWT を提示し、repositories と permissions を絞って要求
    G-->>D: 対象用トークン（対象 1 件だけ、有効 1 時間）
    D-->>V: 対象用トークン ＋ 攻撃先の URL
  end

  Note over V,SM: 秘密鍵・JWT・runner 用の installation access token は VM に渡らない
```

VM が手にできる GitHub の鍵は、JIT config と対象用トークンだけです。対象用トークンは[発行時に `repositories` と `permissions` を指定](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app)して「このリポジトリだけ、読み取りと結果の送信だけ」に絞っています。JIT config は 1 ジョブ、対象用トークンは 1 時間で使えなくなります。VM の中に、長く使える GitHub の鍵は残りません。

GitHub App も、用途ごとに 2 つに分けました。App の権限はインストール先すべてにかかるので、runner を登録できる App を対象側の Org に入れると、その Org 全体の runner を操作できてしまいます。悪用されれば、偽の runner で他のリポジトリのジョブを横取りされかねません。

また、攻撃先の URL はワークフローの入力では受け取らず、レビュー済みの設定ファイルの値を dispatcher が返すようにしています。ワークフローを起動できる人でも、好きな URL を攻撃することはできません。

dispatcher 側の権限も最小限にしています。

- VM を操作できるのは、この VM 1 台だけ
- Secret Manager は、プロジェクト全体ではなく GitHub App の秘密鍵 2 つだけを読める
- VM には専用のサービスアカウントを付け、権限の広いデフォルトのサービスアカウントは使わせない

### dispatcher を呼べる相手を ID トークンで絞る

dispatcher は JIT config や対象用トークンを出す鍵の発行所なので、Scheduler と VM 以外には呼ばせたくありません。

そこで、呼び出しの権限（`roles/run.invoker`）は `allUsers` ではなく、特定のサービスアカウントにだけ与えます。この場合、呼ぶ側は [ID トークンを付けて自分が誰かを示す必要があります](https://cloud.google.com/run/docs/authenticating/service-to-service)。権限は「通してよい相手のリスト」、ID トークンは「社員証」で、片方だけでは通りません。

ID トークンは、メタデータサーバーに頼むだけで受け取れます。API キーのような共有の秘密を VM に置かずに済み、有効期限も約 1 時間です。

ingress: internal とは確かめるものが違います。ingress は「どこから来たか」、ID トークンは「誰が呼んだか」を見るので、両方を重ねています。

### VM は「時刻」ではなく「見回り」で止める

VM の止め方は、2 つの失敗のコストを比べて決めました。

| 失敗 | 損失 |
| -- | -- |
| 止め忘れ | 1 日数ドル |
| スキャンの途中で停止 | 数十ドルの LLM 代と数時間 |

時刻で止める方式だと、実行中のスキャンも止めてしまいます。そこで、毎時 dispatcher が見回り、「動いているジョブも待っているジョブもない」ときだけ止めるようにしました。

1 つハマったのは、JIT の runner がジョブとジョブの間で一瞬いなくなることです。「runner が仕事中か」だけを見ていると、この隙間に止めてしまいます。待っているジョブも仕事として数えることで解決しました。

### 半年ぶりに起動しても動くようにする

VM はたまにしか起動しないので、久しぶりに起動してもそのまま動く必要があります。

そこで、起動のたびに OS のパッチを当て、runner も最新版を入れ直しています。GitHub は古い runner には[ジョブを渡さなくなる](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/autoscaling-with-self-hosted-runners#controlling-runner-software-updates-on-self-hosted-runners)ので、バージョンを固定すると半年後には動きません。

逆に、攻撃ツールである `shannon-action` はコミット SHA で固定しています。攻撃の中身が知らないうちに変わるのは避けたいからです。

### 自動で再試行しない

Cloud Scheduler には、あえて再試行を付けていません。途中まで成功した状態で再試行すると、同じ対象を二重にスキャンしてしまい、数十ドルが無駄になるからです。

たまにしか動かない仕組みなので、失敗したらアラートで気づき、人がやり直すほうが安く済みます。そのため、dispatcher のログは Cloud Logging が読める JSON 形式で出力し、エラーが出たら Slack に通知されるアラートを設定しています。

### 状態を持たないローテーション

LLM の費用を抑えるため、対象のサービスを順番に並べ、月 3 回・1 件ずつスキャンしています。

```
対象 = targets[(経過月数 × 3 + slot) % 件数]   ※ slot は 0, 1, 2（Scheduler 3 本に固定）
```

「前回どこまで進んだか」は保存していません。日付だけで対象が決まるので、データベースが要らず、「来月はこのサービス」と前もって告知することもできます。

## ぶつかった壁

### VM から dispatcher を呼ぶと 404 になった

dispatcher は、VPC の内側からしか呼べない設定（ingress: internal）にしていました。ところが、Shared VPC 上の VM から呼ぶと 404 が返ってきて、アプリにはログすら残りませんでした。

原因は公式ドキュメントに書かれていました。Shared VPC からのリクエストが「内側」と見なされるのは、[Cloud Run 側が Direct VPC egress でその VPC につながっているときだけ](https://cloud.google.com/run/docs/securing/private-networking#shared-vpc)です。

つまり、受信できるかどうかが、送信側の設定で決まるということです。直感に反する仕様でした。dispatcher に Direct VPC egress 用のサブネットを割り当てて解決しました。

### 404 が直ったら、次は 403

拒否した理由をログに出してみると、VM が発行する ID トークンに `email` が入っていませんでした。dispatcher は呼び出し元をメールアドレスで確認していたので、すべて弾いていたのです。

[公式ドキュメント](https://cloud.google.com/compute/docs/instances/verifying-instance-identity)によると、既定の形式（`format=standard`）のトークンには `email` が含まれません。サービスアカウントの一意な ID である `sub` で確認するように変えて解決しました。

### Shannon 自体が失敗した

インフラが通ると、今度は Shannon が途中で失敗しました。

費用を抑えるために最小構成のテストモードで確認していたのですが、ソースを読むと、テストモードにはレポートを完成させる指示が入っていませんでした。仕様どおりの失敗だったということです。

本番と同じ形で実行すると、最後まで完走しました。所要時間は約 2.6 時間、LLM の費用は約 $30 でした。

### 攻撃先に届かなかった

スキャン対象を増やす段階で、攻撃先に届かない問題が 2 つ出ました。

1 つ目は許可リストの上限です。対象のサービスは、共通の Cloud Armor ポリシーを使っています。そのため、許可リストに 1 行足すだけで全サービスに届く予定でした。ところが、Cloud Armor の 1 ルールに書ける IP 範囲は [10 件まで](https://cloud.google.com/armor/quotas)で、plan が失敗しました。STG 用のルールを分けて解決しました。

2 つ目は STG の起動待ちです。STG の Cloud Run は最小インスタンス数が 0 なので、最初のアクセスは起動を待つぶん遅くなります。スキャンの前に攻撃先へ 1 回アクセスして、起こしておくステップを足しました。

### 結果をリポジトリに送れなかった

スキャン結果（SARIF）を対象リポジトリの Security タブに出す予定でしたが、private リポジトリでは有償の Code Security が必要でした。

いまはレポートと Slack 通知だけにしています。送信に失敗してもスキャン全体は失敗扱いにしない作りにしておいたので、レポート自体は無事でした。

## まとめ

- Shannon が特権コンテナを必要とするため、Cloud Run ではなく GCE VM 1 台を起動・停止する構成にした。どこで動かすかを決める前に、ツールが何を必要とするかをソースで確かめるのが大事だった
- GitHub Actions を「キュー付きのジョブ実行基盤」として使い、キューの仕組みを自作せずに済ませた
- いちばん危ない VM には、使い捨ての弱いトークンだけを渡す。強い権限は dispatcher に閉じ込めた
- VM の止め方や再試行の有無は、失敗したときのコストを比べて決めた
- インフラはすべて Terraform で管理し、PR は「起動 → 準備 → 登録 → スキャン → 停止」の段階ごとに分けてレビューしやすくした

## 参考

- Shannon: https://github.com/KeygraphHQ/shannon
- Cloud Run のコンテナランタイム契約: https://cloud.google.com/run/docs/container-contract
- Cloud Run と Shared VPC: https://cloud.google.com/run/docs/securing/private-networking#shared-vpc
- GCE の ID トークン: https://cloud.google.com/compute/docs/instances/verifying-instance-identity
- Cloud Run のサービス間認証: https://cloud.google.com/run/docs/authenticating/service-to-service
- GitHub Actions の JIT runner: https://docs.github.com/en/rest/actions/self-hosted-runners#create-configuration-for-a-just-in-time-runner-for-an-organization
- GitHub Actions の制限: https://docs.github.com/en/actions/reference/limits
- Actions Runner Controller: https://docs.github.com/en/actions/concepts/runners/actions-runner-controller
