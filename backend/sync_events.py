import argparse
import json

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
