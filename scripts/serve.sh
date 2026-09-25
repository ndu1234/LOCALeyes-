#!/bin/bash
# Start a local dev server and open the site in your browser.
# Usage: bash scripts/serve.sh
#
# Serves the project root so you can preview edits locally.
# Use Chrome DevTools (Cmd+Shift+M) to toggle the phone view.

set -euo pipefail

PORT="${1:-8080}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Starting local server at http://localhost:$PORT"
echo ""
echo "  ─ Open in browser → http://localhost:$PORT"
echo "  ─ Press Cmd+Shift+M (Mac) or Ctrl+Shift+M to toggle phone view"
echo "  ─ Press Ctrl+C to stop"
echo ""

# Open browser after a brief pause so the server is ready
(sleep 1 && open "http://localhost:$PORT") &

cd "$DIR"
python3 -m http.server "$PORT"
