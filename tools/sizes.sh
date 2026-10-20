#!/bin/bash
# Where an Alloy app's compiled code goes, after `pebble build`: each module's
# bytecode, largest first, and the archive against the emulator's ceiling.
#
#   bash tools/sizes.sh <project-dir> [emery|gabbro]
#
# The emulator copies build/mods/<platform>/mc.xsa into the app heap, and with
# the machine sizes from the skill (stack 5120, slot 45056, chunk 21504) an
# archive above about 43000 B fails with `fxMapArchive failed`. The watch maps
# the archive from flash and has about 40 kB more room. Run `pebble clean` first
# if modules were deleted: their stale .xsb files would still be counted.
set -eu
dir=${1:?usage: sizes.sh <project-dir> [emery|gabbro]}
platform=${2:-emery}
CEILING=43000
mods="$dir/build/mods/$platform"
xsa="$mods/mc.xsa"
[ -f "$xsa" ] || { echo "no $xsa: run pebble build first" >&2; exit 1; }

find "$mods/mcrun" -name '*.xsb' -printf '%s %p\n' | sort -rn |
	sed 's#[^ ]*/embeddedjs/files/##; s#\.xsb$##' |
	awk '{ printf "%6d  %s\n", $1, $2; sum += $1 } END { printf "%6d  modules total\n", sum }'

size=$(stat -c %s "$xsa")
echo "$size  mc.xsa ($platform); emulator ceiling about $CEILING: $((CEILING - size)) B to spare"
