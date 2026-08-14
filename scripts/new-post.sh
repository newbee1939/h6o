#!/usr/bin/env bash
# posts/<slug>.<lang>.md の雛形を作る。使い方は README.md を見ること。
set -euo pipefail

slug=${1:-}
lang=${2:-ja}

if [ -z "$slug" ]; then
  echo "usage: $0 <slug> [ja|en]" >&2
  exit 1
fi

case "$slug" in
  *[!a-z0-9-]* | -* | *-) echo "slug は英小文字・数字・ハイフンのみ（前後のハイフン不可）: $slug" >&2; exit 1 ;;
esac

case "$lang" in
  ja | en) ;;
  *) echo "lang は ja か en: $lang" >&2; exit 1 ;;
esac

root=$(cd "$(dirname "$0")/.." && pwd)
file="$root/posts/$slug.$lang.md"

if [ -e "$file" ]; then
  echo "すでにある: $file" >&2
  exit 1
fi

cat > "$file" <<EOF
---
title:
date: $(date +%F)
lang: $lang
description:
---

EOF

echo "$file"
echo "http://localhost:4321/$lang/$slug/"
