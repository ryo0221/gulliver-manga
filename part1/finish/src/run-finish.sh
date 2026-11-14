#!/bin/bash
# Run gen-finish.sh for the given brief dirs (default: every panel without color-raw.png), PAR (default 4) at a time.
# usage: run-finish.sh BRIEFS_ROOT [panel ...]
R=$(realpath "$1"); shift
HERE=$(cd "$(dirname "$0")" && pwd)
if [ $# -gt 0 ]; then list=("$@"); else list=(); for d in "$R"/e01-*/; do p=$(basename "$d"); [ -s "$d/color-raw.png" ] || list+=("$p"); done; fi
fail=0; running=0
for p in "${list[@]}"; do
  ( bash "$HERE/gen-finish.sh" "$R/$p" > "$R/$p/color-run.out" 2>&1; rc=$?; echo "$p exit $rc"; exit $rc ) &
  running=$((running+1))
  if [ $running -eq ${PAR:-4} ]; then wait -n || fail=$((fail+1)); running=$((running-1)); fi
done
while [ $running -gt 0 ]; do wait -n || fail=$((fail+1)); running=$((running-1)); done
echo "failed: $fail"; [ $fail -eq 0 ]
