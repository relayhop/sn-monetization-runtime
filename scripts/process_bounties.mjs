#!/usr/bin/env node
/**
 * SN Monetization Runtime - Bounty Ingestion & Lifecycle Processor CLI
 *
 * Reads radar TSV output, ingests into registry, and outputs actionable tasks.
 *
 * Usage:
 *   node scripts/process_bounties.mjs
 *   node scripts/process_bounties.mjs --file data/sn_opportunities/sn_latest.tsv
 *   node scripts/process_bounties.mjs --claim 1556944 --notes "Claimed for pick'em automation"
 *   node scripts/process_bounties.mjs --report
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  parseSNRadarBounties,
  processRadarOpportunities,
  SNBountyRegistry,
  formatBountyReport
} from '../src/radar/sn_bounty_handler.mjs';

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const BOUNTY_DIR = path.join(DATA_DIR, 'bounties');
const REGISTRY_FILE = path.join(BOUNTY_DIR, 'active_bounties.json');

const registry = new SNBountyRegistry(REGISTRY_FILE);

const args = process.argv.slice(2);

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=')[1];
  return null;
}

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
SN Bounty Ingestion & Lifecycle Processor
Options:
  --file <path>         Process a specific radar TSV file
  --claim <id>          Claim a bounty by ID
  --status <id>=<state> Update status of a bounty (DETECTED, CLAIMED, IN_PROGRESS, SUBMITTED, PAID, EXPIRED)
  --notes <text>        Notes for status updates
  --report              Print Markdown formatted opportunity report
  --json                Output result in JSON format
`);
    return;
  }

  // Handle claiming
  const claimId = getArgValue('--claim');
  if (claimId) {
    const notes = getArgValue('--notes') || 'Claimed via CLI';
    try {
      const updated = registry.claimBounty(claimId, notes);
      registry.save();
      console.log(`[bounty-engine] Bounty ${claimId} successfully claimed!`);
      console.log(JSON.stringify(updated, null, 2));
      return;
    } catch (err) {
      console.error(`[bounty-engine] Error claiming bounty ${claimId}: ${err.message}`);
      process.exit(1);
    }
  }

  // Handle status update
  const statusUpdate = getArgValue('--status');
  if (statusUpdate) {
    const [id, newStatus] = statusUpdate.split('=');
    const notes = getArgValue('--notes') || `Status updated to ${newStatus}`;
    try {
      const updated = registry.updateStatus(id, newStatus, notes);
      registry.save();
      console.log(`[bounty-engine] Bounty ${id} status updated to ${newStatus}`);
      console.log(JSON.stringify(updated, null, 2));
      return;
    } catch (err) {
      console.error(`[bounty-engine] Error updating status for bounty: ${err.message}`);
      process.exit(1);
    }
  }

  // Determine input source
  let filePath = getArgValue('--file');
  let tsvContent = '';

  if (filePath && fs.existsSync(filePath)) {
    tsvContent = fs.readFileSync(filePath, 'utf8');
    console.log(`[bounty-engine] Reading radar data from ${filePath}`);
  } else if (!process.stdin.isTTY) {
    try {
      tsvContent = fs.readFileSync(0, 'utf8');
      if (tsvContent.trim()) {
        console.log('[bounty-engine] Reading radar data from stdin');
      }
    } catch {}
  }

  if (!tsvContent.trim() && !filePath) {
    const oppsDir = path.join(DATA_DIR, 'sn_opportunities');
    if (fs.existsSync(oppsDir)) {
      const files = fs.readdirSync(oppsDir)
        .filter(f => f.startsWith('sn_') && f.endsWith('.tsv') && f !== 'sn_latest.tsv')
        .sort()
        .reverse();
      if (files.length > 0) {
        filePath = path.join(oppsDir, files[0]);
        tsvContent = fs.readFileSync(filePath, 'utf8');
        console.log(`[bounty-engine] Reading radar data from ${filePath}`);
      }
    }
  }

  if (!tsvContent.trim()) {
    console.log('[bounty-engine] No radar TSV input available. Displaying current registry stats:');
    console.log(JSON.stringify(registry.getSummaryStats(), null, 2));
    return;
  }

  const bounties = parseSNRadarBounties(tsvContent);
  const result = processRadarOpportunities(bounties);

  // Register in active registry
  for (const b of bounties) {
    if (b.metrics.isOpenBounty) {
      registry.registerBounty(b);
    }
  }
  registry.save();

  if (args.includes('--json')) {
    console.log(JSON.stringify({
      opportunities: result,
      registrySummary: registry.getSummaryStats()
    }, null, 2));
    return;
  }

  if (args.includes('--report')) {
    console.log('\n## 🎯 SN Bounty Radar Opportunities Report\n');
    console.log(formatBountyReport(result.claimBounties));
    console.log(`\n**Summary:** ${result.summary.openBountyCount} open bounties (${result.summary.totalBountySats.toLocaleString()} total sats)`);
    return;
  }

  console.log(`[bounty-engine] Processed ${bounties.length} items from radar.`);
  console.log(`  - Open Bounties: ${result.summary.openBountyCount} (${result.summary.totalBountySats.toLocaleString()} sats)`);
  console.log(`  - High Signals: ${result.summary.signalCount}`);
  console.log(`  - Self-Post Opportunities: ${result.summary.selfPostOppCount}`);
  console.log(`  - Hot Topics: ${result.summary.hotCount}`);
  
  if (result.claimBounties.length > 0) {
    console.log('\n[Top Actionable Open Bounties]');
    for (const b of result.claimBounties.slice(0, 5)) {
      console.log(`  #${b.id} ~${b.sub} [${b.bounty} sats, ${b.comments} com, EV: ${b.metrics.estimatedSatsEV} sats, Action: ${b.metrics.action}] - ${b.title}`);
    }
  }
}

main().catch(err => {
  console.error('[bounty-engine] Fatal error:', err);
  process.exit(1);
});
