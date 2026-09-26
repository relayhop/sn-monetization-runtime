import argparse
import json
import sys

from .filtering import is_actionable
from .parser import parse_lines


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse SN bounty radar records")
    parser.add_argument("--minimum-sats", type=int, default=0)
    args = parser.parse_args()
    try:
        bounties = parse_lines(sys.stdin.read())
        output = [b.__dict__ | {"feeds": list(b.feeds), "flags": sorted(b.flags),
                                "actionable": is_actionable(b, minimum_sats=args.minimum_sats)}
                  for b in bounties]
    except (TypeError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(output, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
