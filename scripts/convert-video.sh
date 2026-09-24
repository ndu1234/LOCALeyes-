#!/bin/bash
# Convert a video to MP4 and upload to Supabase via the admin panel.
# Usage: ./scripts/convert-video.sh path/to/video.mov "Caption text"
#
# This converts the video to MP4 locally, then you upload the resulting
# .mp4 file through the admin panel's Videos tab.

set -euo pipefail

INPUT="$1"
CAPTION="${2:-}"

if [ ! -f "$INPUT" ]; then
  echo "Usage: $0 <video-file> [caption]"
  echo "Error: file not found: $INPUT"
  exit 1
fi

BASENAME=$(basename "$INPUT")
NAME="${BASENAME%.*}"
DIR=$(dirname "$INPUT")
OUTPUT="$DIR/${NAME}.mp4"

echo "Converting $INPUT -> $OUTPUT ..."
ffmpeg -i "$INPUT" \
  -c:v libx264 -preset fast -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -y "$OUTPUT"

SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
SIZE_MB=$(echo "scale=1; $SIZE / 1048576" | bc)
echo "Done! Converted file: $OUTPUT (${SIZE_MB}MB)"
echo ""
echo "Now go to the admin panel → Videos tab → + Add Video"
echo "Upload the file: $OUTPUT"
echo "Caption: ${CAPTION:-$NAME}"
