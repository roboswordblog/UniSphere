import argparse
import json
from pathlib import Path
import sys

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from db import sync_all_event_sources


def main():
    parser = argparse.ArgumentParser(description="Sync UniSphere college events into SQLite.")
    parser.add_argument("--days", type=int, default=None, help="Number of future days to fetch.")
    parser.add_argument("--per-page", type=int, default=None, help="Events per provider API page.")
    args = parser.parse_args()

    summary = sync_all_event_sources(days=args.days, per_page=args.per_page)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
