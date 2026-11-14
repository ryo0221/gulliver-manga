#!/bin/bash
# Generate CH-02..CH-07 setting art, four Codex runs at a time.
# Exits nonzero if any generation failed.
S=${GEN_OUT:-${TMPDIR:-/tmp}/gulliver-manga-gen}; mkdir -p "$S"
export GEN_WORK=$S/gen
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
UL=$ROOT/part1/underlay/lilliputian-front.png
run() {
  local item=$1 brief=$2 rc=0
  bash "$ROOT/part1/codex/_tools/gen.sh" "$item" "$UL" figure "$brief" > "$S/$item.out" 2>&1 || rc=$?
  echo "$item exit $rc"; return $rc
}
fail=0; running=0
while IFS=$'\t' read -r item brief; do
  run "$item" "$brief" &
  running=$((running+1))
  if [ $running -eq 4 ]; then wait -n || fail=$((fail+1)); running=$((running-1)); fi
done < "$ROOT/part1/codex/_tools/briefs-ch02-07.tsv"
while [ $running -gt 0 ]; do wait -n || fail=$((fail+1)); running=$((running-1)); done
[ $fail -eq 0 ] || { echo "$fail generation(s) failed" >&2; exit 1; }
