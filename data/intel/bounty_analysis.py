#!/usr/bin/env python3
"""
Bounty Analysis Script

Processes bounty data from the radar system to provide insights:
- Identifies high-value bounties (sats > threshold)
- Tracks bounty patterns over time
- Generates summary reports
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict
import csv
import argparse

def analyze_bounties(bounty_file, min_sats=1000):
    """Analyze bounty data and return insights"""
    
    if not os.path.exists(bounty_file):
        return {"error": f"Bounty file not found: {bounty_file}"}
    
    bounties = []
    high_value_bounties = []
    
    try:
        with open(bounty_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            for row in reader:
                if len(row) >= 11 and 'OPEN_BOUNTY' in row[10]:
                    bounty = {
                        'id': row[0],
                        'user': row[1],
                        'tier': row[2],
                        'sats': int(row[3]),
                        'comp': float(row[4]) if row[4] else 0,
                        'title': row[9],
                        'tags': row[10]
                    }
                    bounties.append(bounty)
                    
                    if bounty['sats'] >= min_sats:
                        high_value_bounties.append(bounty)
    except Exception as e:
        return {"error": f"Error reading bounty file: {str(e)}"}
    
    # Analyze patterns
    by_user = defaultdict(list)
    by_tier = defaultdict(list)
    
    for bounty in bounties:
        by_user[bounty['user']].append(bounty)
        by_tier[bounty['tier']].append(bounty)
    
    # Generate insights
    insights = {
        'timestamp': datetime.now().isoformat(),
        'total_bounties': len(bounties),
        'high_value_bounties': len(high_value_bounties),
        'min_sats_threshold': min_sats,
        'top_users': sorted(
            [(user, len(user_bounties)) for user, user_bounties in by_user.items()],
            key=lambda x: x[1],
            reverse=True
        )[:5],
        'by_tier': dict(by_tier),
        'avg_sats_per_bounty': sum(b['sats'] for b in bounties) / len(bounties) if bounties else 0,
        'high_value_examples': sorted(high_value_bounties, key=lambda x: x['sats'], reverse=True)[:3]
    }
    
    return insights

def generate_report(insights, output_file):
    """Generate a human-readable report"""
    
    report = []
    report.append("# Bounty Analysis Report\n")
    report.append(f"Generated: {insights['timestamp']}\n")")
    report.append(f"Total Bounties Found: {insights['total_bounties']}\n")")
    report.append(f"High-Value Bounties (≥{insights['min_sats_threshold']} sats): {insights['high_value_bounties']}\n")")
    report.append(f"Average Sats per Bounty: {insights['avg_sats_per_bounty']:.1f}\n")")
    
    report.append("## Top Bounty Posters\n")")
    for user, count in insights['top_users']:
        report.append(f"- {user}: {count} bounties\n")")
    
    report.append("\n## Bounty Distribution by Tier\n")")
    for tier, bounties in insights['by_tier'].items():
        report.append(f"- Tier {tier}: {len(bounties)} bounties\n")")
    
    report.append("\n## High-Value Bounty Examples\n")")
    for bounty in insights['high_value_examples']:
        report.append(f"- {bounty['sats']} sats - {bounty['title']} (by {bounty['user']})\n")")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(report)
    
    return output_file

def main():
    parser = argparse.ArgumentParser(description='Analyze bounty data')
    parser.add_argument('bounty_file', help='Path to bounty TSV file')
    parser.add_argument('--min-sats', type=int, default=1000, help='Minimum sats for high-value threshold')
    parser.add_argument('--output', help='Output file for report (optional)')
    
    args = parser.parse_args()
    
    # Analyze bounties
    insights = analyze_bounties(args.bounty_file, args.min_sats)
    
    if 'error' in insights:
        print(f"Error: {insights['error']}", file=sys.stderr)
        sys.exit(1)
    
    # Print summary
    print(f"Found {insights['total_bounties']} total bounties")
    print(f"Found {insights['high_value_bounties']} high-value bounties (≥{args.min_sats} sats)")
    
    # Generate report if requested
    if args.output:
        report_file = generate_report(insights, args.output)
        print(f"Report generated: {report_file}")
    
    # Save insights as JSON
    insights_file = args.bounty_file.replace('.tsv', '_insights.json')
    with open(insights_file, 'w', encoding='utf-8') as f:
        json.dump(insights, f, indent=2)
    print(f"Insights saved: {insights_file}")

if __name__ == '__main__':
    main()