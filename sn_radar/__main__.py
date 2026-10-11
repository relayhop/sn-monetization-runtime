import sys

from .bounty import parse_event, to_json


def main() -> int:
    for line in sys.stdin:
        if line.strip():
            print(to_json(parse_event(line)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

