#!/usr/bin/env node
// SN intelligence collector — anonymous GraphQL only (no auth needed)
// Outputs:
//   data/intel/super_zappers.tsv   (top earners site-wide, weekly refresh)
//   data/intel/sub_velocity.tsv    (per-sub stacking velocity, daily refresh)
//   data/intel/zapper_subs.tsv     (which subs each super-zapper posts in)
// Usage:
//   OUT_DIR=data/intel node scripts/sn_intel.mjs --topusers
//   OUT_DIR=data/intel node scripts/sn_intel.mjs --velocity
//   OUT_DIR=data/intel node scripts/sn_intel.mjs --all

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.env.OUT_DIR || 'data/intel');
fs.mkdirSync(OUT, { recursive: true });

async function gql(query, variables = {}) {
  const r = await fetch('https://stacker.news/api/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'apollographql-client-name': 'web', 'user-agent': 'Mozilla/5.0' },
    body: JSON.stringify({ query, variables }),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { raw: text.slice(0,150) }; }
}

async function topUsers() {
  const r = await gql('query g{ topUsers(when:"week",limit:50){ users{ name nitems optional{stacked spent streak} } } }');
  const users = (r.data?.topUsers?.users || []).filter(u => u && u.optional?.stacked > 0);
  return users.sort((a,b) => (b.optional?.stacked||0) - (a.optional?.stacked||0));
}

async function userSubs(name) {
  const r = await gql('query g($n:String!){ userSubs(name:$n,when:"week",limit:20){ subs{ name } } }', { n: name });
  return (r.data?.userSubs?.subs || []).map(s => s.name);
}

const TIER_1 = ['bitcoin','bitcoin_beginners','bitcoin_Mining','bitcoinplusplus','bitdevs','lightning','mempool','nostr','security','privacy','devs','tech','AI','openagents','meta'];
const TIER_2 = ['math','science','econ','Construction_and_Engineering','Education','Stacker_Stocks','charts_and_maps','AMA','AskSN','jobs','ideasfromtheedge','dotnet','Design','tutorials','mostly_harmless','news','history','BooksAndArticles','podcasts','lol','Memes'];
const ALL = [...TIER_1, ...TIER_2];

async function subVelocity(sub) {
  // stackingGrowth returns array of {time, data:[{name,value}]} per day
  // Aggregate week total
  try {
    const r = await gql('query g($s:String){ stackingGrowth(when:"week",sub:$s){ time data{name value} } }', { s: sub });
    const series = r.data?.stackingGrowth || [];
    let total = 0, days = series.length;
    for (const point of series) {
      for (const d of (point.data || [])) total += +d.value || 0;
    }
    return { sub, weekly_stacked: total, days, avg_daily: days ? Math.round(total/days) : 0 };
  } catch (e) { return { sub, error: e.message }; }
}

async function runTopUsers() {
  const ts = new Date().toISOString();
  const users = await topUsers();
  const lines = ['# refreshed_at\tname\tnitems\tstacked\tspent\tstreak'];
  for (const u of users) {
    lines.push([ts, u.name, u.nitems, u.optional?.stacked||0, u.optional?.spent||0, u.optional?.streak||0].join('\t'));
  }
  fs.writeFileSync(path.join(OUT, 'super_zappers.tsv'), lines.join('\n')+'\n');
  console.log(`[intel] super_zappers: ${users.length} users saved`);
}

async function runVelocity() {
  const ts = new Date().toISOString();
  const lines = ['# refreshed_at\tsub\tweekly_stacked\tdays\tavg_daily'];
  for (const sub of ALL) {
    const v = await subVelocity(sub);
    if (!v.error) {
      lines.push([ts, v.sub, v.weekly_stacked, v.days, v.avg_daily].join('\t'));
    }
  }
  fs.writeFileSync(path.join(OUT, 'sub_velocity.tsv'), lines.join('\n')+'\n');
  console.log(`[intel] sub_velocity: ${ALL.length} subs analyzed`);
}

async function runZapperSubs() {
  const users = await topUsers();
  const lines = ['# name\tsubs'];
  for (const u of users.slice(0, 20)) {
    const subs = await userSubs(u.name);
    lines.push([u.name, subs.join(',')].join('\t'));
  }
  fs.writeFileSync(path.join(OUT, 'zapper_subs.tsv'), lines.join('\n')+'\n');
  console.log(`[intel] zapper_subs saved`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--topusers') || args.includes('--all')) await runTopUsers();
  if (args.includes('--velocity') || args.includes('--all')) await runVelocity();
  if (args.includes('--zappersubs') || args.includes('--all')) await runZapperSubs();
  if (!args.length) {
    console.log('Usage: node scripts/sn_intel.mjs [--topusers|--velocity|--zappersubs|--all]');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});