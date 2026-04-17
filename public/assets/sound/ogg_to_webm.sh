#!/bin/bash

INPUT_DIR="${1:-.}"

find "$INPUT_DIR" -maxdepth 1 -iname "*.ogg" | while read -r file; do
  out="${file%.*}.webm"
  echo "Converting: $file → $out"
  ffmpeg -i "$file" -c:a libopus -b:a 96k "$out" && echo "✓ Done" || echo "✗ Failed: $file"
done

echo "All done."
