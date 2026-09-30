#!/usr/bin/env node
// scripts/sn_bounty_triage.mjs — CLI triage tool for Stacker News Radar bounty detections
import fs from 'node:fs';
import path from 'node:path';
import {
  parseRadarBountyLine,
  classifyBountyOpportunity,
  formatBountyReport,
  formatTriageSummary,
} from './sn_bounty_processor.mjs';

const KNOWN_ISSUES = {
  '743': '1556944\tStacker_Sports\t3\t1093\t2100\t17\t21.0\t232181\t3996\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekly Random Sports Pick &#39;em',
  '733': '1556944\tStacker_Sports\t3\t1093\t2100\t17\t21.0\t232181\t3996\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekly Random Sports Pick &#39;em',
  '721': '1553226\tStacker_Stocks\t2\t35\t10000\t23\t33.5\t9274\t26637\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,HOT\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!',
  '567': '1553226\tStacker_Stocks\t2\t20\t10000\t4\t6.3\t9274\t26607\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,LOW_COMP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    issue: null,
    input: null,
    file: null,
    json: false,
    outDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--issue' && i + 1 < args.length) {
      options.issue = args[++i];
    } else if (arg.startsWith('--issue=')) {
      options.issue = arg.slice(8);
    } else if (arg === '--input' && i + 1 < args.length) {
      options.input = args[++i];
    } else if (arg.startsWith('--input=')) {
      options.input = arg.slice(8);
    } else if (arg === '--file' && i + 1 < args.length) {
      options.file = args[++i];
    } else if (arg.startsWith('--file=')) {
      options.file = arg.slice(7);
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--out-dir' && i + 1 < args.length) {
      options.outDir = args[++i];
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = arg.slice(10);
    }
  }

  return options;
}

function main() {
  const options = parseArgs();
  const rawLines = [];

  if (options.issue) {
    const issuePayload = KNOWN_ISSUES[options.issue];
    if (!issuePayload) {
      console.error(`Error: Unknown issue #${options.issue}`);
      process.exit(1);
    }
    rawLines.push(issuePayload);
  } else if (options.input) {
    rawLines.push(options.input);
  } else if (options.file) {
    const fileContent = fs.readFileSync(path.resolve(options.file), 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    rawLines.push(...lines);
  } else {
    // Default to Issue 743 if no parameters passed
    rawLines.push(KNOWN_ISSUES['743']);
  }

  const results = [];
  for (const line of rawLines) {
    try {
      const record = parseRadarBountyLine(line);
      const classification = classifyBountyOpportunity(record);
      results.push(classification);
    } catch (err) {
      console.error(`Failed to process row: ${err.message}`);
    }
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 1) {
    console.log(formatBountyReport(results[0]));
  } else {
    console.log(formatTriageSummary(results));
  }

  if (options.outDir) {
    const targetDir = path.resolve(options.outDir);
    fs.mkdirSync(targetDir, { recursive: true });
    for (const item of results) {
      const jsonPath = path.join(targetDir, `bounty_${item.record.id}.json`);
      const mdPath = path.join(targetDir, `bounty_${item.record.id}.md`);
      fs.writeFileSync(jsonPath, JSON.stringify(item, null, 2));
      fs.writeFileSync(mdPath, formatBountyReport(item));
      console.log(`Saved artifacts to ${jsonPath} and ${mdPath}`);
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('sn_bounty_triage.mjs')) {
  main();
}
