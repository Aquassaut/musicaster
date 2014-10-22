#!/bin/bash

usage() {
    echo "usage: $0 [DIR]"
}

list_escaped_files() {
    for f in *.mp3; do
        printf "file "; ls --quoting-style=shell-always $(readlink -f "$f")
    done
}

case $# in
    0) DIR="./" ;;
    1) if [ "$1" = "-h" -o "$1" = "--help" ]; then usage ; else DIR="$1"; fi ;;
    *) usage ;;
esac

cd "$DIR"

ffmpeg -v fatal -f concat -i <(list_escaped_files) -f mp3 -c copy -
