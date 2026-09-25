#!/bin/bash
# Convert all non-MP4 video files in the videos/ folder to MP4.
# Usage: bash scripts/convert-all.sh
#
# Scans videos/ for .mov, .avi, .mkv, .webm, .flv, .wmv, .m4v files,
# converts each to MP4 (skipping if the MP4 already exists).

set -euo pipefail

VIDEO_DIR="$(cd "$(dirname "$0")/../videos" && pwd)"
TMPDIR="${TMPDIR:-/tmp}"

if [ ! -d "$VIDEO_DIR" ]; then
  echo "Error: videos/ directory not found at $VIDEO_DIR"
  exit 1
fi

shopt -s nullglob
FILES=("$VIDEO_DIR"/*.mov "$VIDEO_DIR"/*.MOV "$VIDEO_DIR"/*.avi "$VIDEO_DIR"/*.AVI \
       "$VIDEO_DIR"/*.mkv "$VIDEO_DIR"/*.MKV "$VIDEO_DIR"/*.webm "$VIDEO_DIR"/*.WEBM \
       "$VIDEO_DIR"/*.flv "$VIDEO_DIR"/*.FLV "$VIDEO_DIR"/*.wmv "$VIDEO_DIR"/*.WMV \
       "$VIDEO_DIR"/*.m4v "$VIDEO_DIR"/*.M4V)

if [ ${#FILES[@]} -eq 0 ]; then
  echo "No non-MP4 video files found in videos/."
  exit 0
fi

echo "Found ${#FILES[@]} file(s) to convert:"
printf '  %s\n' "${FILES[@]##*/}"
echo ""

CONVERTED=0
SKIPPED=0
FAILED=0

for INPUT in "${FILES[@]}"; do
  BASENAME=$(basename "$INPUT")
  NAME="${BASENAME%.*}"
  OUTPUT="$VIDEO_DIR/${NAME}.mp4"

  if [ -f "$OUTPUT" ]; then
    echo "  SKIP  $BASENAME → ${NAME}.mp4 already exists"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "  CONV  $BASENAME → ${NAME}.mp4"
  if ffmpeg -i "$INPUT" \
    -c:v libx264 -preset fast -crf 22 \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -y "$OUTPUT" 2>/dev/null; then
    SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
    SIZE_MB=$(echo "scale=1; $SIZE / 1048576" | bc)
    echo "         Done — ${SIZE_MB}MB"
    CONVERTED=$((CONVERTED + 1))
  else
    echo "         FAILED"
    rm -f "$OUTPUT"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "── Summary ──"
echo "  Converted: $CONVERTED"
echo "  Skipped:   $SKIPPED"
echo "  Failed:    $FAILED"
