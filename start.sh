#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "======================================"
echo "  Hello IoT — Drag & Wire, No Coding"

echo "Starting Hello IoT..."
echo "Open http://localhost:5173 in your browser"
echo ""
echo "Press Ctrl+C to stop"
echo "======================================"
echo ""

npx vite --host
