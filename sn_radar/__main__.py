"""CLI: python -m sn_radar [--minimum-sats N] [file]."""

import argparse
import sys

from .bounty import records_as_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse SN open bounty radar rows")
    parser.add_argument("file", nargs="?", help="input file; stdin when omitted")
    parser.add_argument("--minimum-sats", type=int, default=1)
    args = parser.parse_args()
    if args.minimum_sats < 0:
        parser.error("--minimum-sats must not be negative")
    source = open(args.file, encoding="utf-8") if args.file else sys.stdin
    try:
        print(records_as_json(source, minimum_sats=args.minimum_sats))
    finally:
        if args.file:
            source.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
