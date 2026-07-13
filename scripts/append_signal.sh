#!/bin/bash
# append_signal.sh – Append a single SN radar signal line to all_signals.tsv
# Usage: echo "<tab-separated-line>" | ./append_signal.sh
# Or: ./append_signal.sh "<tab-separated-line>"

DATA_FILE="data/sn_targets_accumulated/all_signals.tsv"
HEADER="# id\tsub\tcol3\tcol4\tcol5\tcol6\tcol7\tcol8\tcol9\tcol10\tcol11\tcol12"

mkdir -p "$(dirname "$DATA_FILE")"

if [ ! -f "$DATA_FILE" ]; then
    echo "$HEADER" > "$DATA_FILE"
    echo "Created $DATA_FILE with header."
fi

if [ $# -ge 1 ]; then
    LINE="$1"
else
    read -r LINE
fi

echo "$LINE" >> "$DATA_FILE"
echo "Appended signal to $DATA_FILE"
