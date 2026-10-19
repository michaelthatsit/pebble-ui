#!/bin/bash
# Drive an app through its screens in an emulator and screenshot them.
#
#   bash tools/tour.sh <project-dir> <emery|gabbro> <out-dir> <steps-file>
#
# The steps file has one step per line:
#   shot <name>              screenshot to <out-dir>/<name>.png
#   click <button> [wait]    back, up, select or down, then wait (default 0.5 s)
#   wait <seconds>
# The emulator's log goes to <out-dir>/log.txt (console.log lines show as
# xsHost.c). The app is installed fresh, so the tour starts on its home window.
set -u
DIR=$1; PLAT=$2; OUT=$3; STEPS=$4
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
cd "$DIR" || exit 1
pebble kill >/dev/null 2>&1; sleep 1
(PYTHONUNBUFFERED=1 timeout -s INT 600 pebble install --emulator "$PLAT" --logs > "$OUT/log.txt" 2>&1 &)
sleep 9
while read -r cmd arg rest; do
  case "$cmd" in
    shot) pebble screenshot --no-open --emulator "$PLAT" "$OUT/$arg.png" >/dev/null 2>&1; echo "shot $arg";;
    click) pebble emu-button --emulator "$PLAT" click "$arg" >/dev/null 2>&1; sleep "${rest:-0.5}";;
    wait) sleep "$arg";;
    ""|\#*) ;;
    *) echo "unknown step: $cmd" >&2;;
  esac
done < "$STEPS"
pebble kill >/dev/null 2>&1
