#!/bin/bash
S=${GEN_OUT:-${TMPDIR:-/tmp}/gulliver-manga-gen}; mkdir -p "$S"
export GEN_WORK=$S/gen
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
UL=$ROOT/part1/underlay/lilliputian-front.png
run() { item=$1; brief=$2; bash $ROOT/part1/codex/_tools/gen.sh "$item" "$UL" figure "$brief" > $S/$item.out 2>&1; echo "$item exit $?"; }
i=0
while IFS=$'\t' read -r item brief; do
  run "$item" "$brief" &
  i=$((i+1)); if [ $i -eq 4 ]; then wait -n; i=3; fi
done < "$ROOT/part1/codex/_tools/briefs-ch02-07.tsv"
wait
