import argparse
import json

from .sdk import Client


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="zynth",
        description="Red-team AI agents and APIs with Zynth.",
    )
    subparsers = parser.add_subparsers(dest="command")

    scan_parser = subparsers.add_parser("scan", help="Run a Zynth scan")
    scan_parser.add_argument(
        "--target",
        default="mock",
        choices=["mock", "local", "gandalf", "live", "custom"],
        help="Target type to scan.",
    )
    scan_parser.add_argument("--api-key", help="Anthropic API key for live scans.")
    scan_parser.add_argument(
        "--endpoint",
        help="Custom API endpoint for custom scans.",
    )
    scan_parser.add_argument(
        "--suite",
        default="quick",
        choices=["quick", "full"],
        help="Run the quick scan or the full suite.",
    )
    scan_parser.add_argument(
        "--mutate",
        action="store_true",
        help="Enable adaptive payload mutation.",
    )
    scan_parser.add_argument(
        "--no-llm-judge",
        action="store_true",
        help="Disable the LLM-as-judge fallback for ambiguous cases.",
    )
    scan_parser.add_argument(
        "--json",
        action="store_true",
        help="Print the full report as JSON.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command != "scan":
        parser.print_help()
        return 0

    client = Client(
        api_key=args.api_key,
        target=args.target,
        target_endpoint=args.endpoint,
    )
    report = client.scan(
        full_scan=args.suite == "full",
        mutate=args.mutate,
        use_llm_judge=not args.no_llm_judge,
    )

    if args.json:
        print(json.dumps(report.to_dict(), indent=2))
        return 0

    total_tests = report.summary.get("total_tests", 0)
    print(f"Target: {args.target}")
    print(f"Risk score: {report.risk_score}")
    print(f"Vulnerabilities: {len(report.vulnerabilities)} / {total_tests}")
    for finding in report.vulnerabilities[:10]:
        print(f"- {finding['test_name']} [{finding['category']}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
