
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const OUT_DIR = path.resolve(process.env.OUT_DIR || 'data/polar_opportunities');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Trusted organizations/repos from smart_hunter.py
const TRUSTED_ORGS = [
  'vercel', 'supabase', 'stripe', 'github', 'microsoft', 'uniswap', 'metamask', 
  'openzepeplin', 'expensify', 'browserstack', 'algora', 'polar-sh', 'near'
];

function searchGitHub(args) {
  try {
    const finalArgs = ['search', 'issues', ...args, '--limit', '50', '--json', 'title,url,repository,labels,body,createdAt,commentsCount'];
    const result = spawnSync('gh', finalArgs, { encoding: 'utf-8' });
    if (result.status !== 0) {
      console.error(`[polar-radar] gh search failed: ${result.stderr}`);
      return [];
    }
    return JSON.parse(result.stdout);
  } catch (e) {
    console.error(`[polar-radar] Error searching GitHub: ${e.message}`);
    return [];
  }
}

function classify(item) {
  const tags = ['POLAR'];
  const text = (item.title + ' ' + (item.body || '')).toLowerCase();
  
  if (text.includes('polar.sh')) tags.push('FUNDED_POLAR');
  if (text.includes('algora.io')) tags.push('FUNDED_ALGORA');
  
  const codingKeywords = ['code', 'github', 'pr', 'fix', 'feature', 'issue', 'javascript', 'python', 'typescript', 'rust', 'golang', 'node', 'react', 'api', 'bug', 'refactor', 'integration'];
  const isCoding = codingKeywords.some(k => text.includes(k));
  if (isCoding) tags.push('CODING');

  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
  if (ageHours <= 24) tags.push('FRESH');

  return { tags, ageHours };
}

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`[polar-radar] Starting scan at ${ts}`);

  const allItems = [];
  
  // 1. Search for polar.sh site-wide
  allItems.push(...searchGitHub(['polar.sh', '--state', 'open']));

  // 2. Search for algora.io site-wide
  allItems.push(...searchGitHub(['algora.io', '--state', 'open']));

  // 3. Search for label:bounty in trusted orgs
  allItems.push(...searchGitHub(['--owner', TRUSTED_ORGS.join(','), '--label', 'bounty', '--state', 'open']));

  // Dedup by URL
  const uniqueItems = Array.from(new Map(allItems.map(it => [it.url, it])).values());
  
  const processed = uniqueItems.map(it => {
    const c = classify(it);
    return { ...it, _tags: c.tags, _ageH: c.ageHours.toFixed(1) };
  });

  // Sort by funded status and freshness
  processed.sort((a, b) => {
    const fA = (a._tags.includes('FUNDED_POLAR') || a._tags.includes('FUNDED_ALGORA')) ? 1 : 0;
    const fB = (b._tags.includes('FUNDED_POLAR') || b._tags.includes('FUNDED_ALGORA')) ? 1 : 0;
    if (fA !== fB) return fB - fA;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Save to TSV
  const headers = '# id\trepo\ttags\tageH\tcomments\ttitle\turl';
  const row = it => [
    it.url.split('/').pop(),
    it.repository.nameWithOwner,
    it._tags.join(','),
    it._ageH,
    it.commentsCount,
    (it.title || '').replace(/[\t\n]/g, ' ').slice(0, 100),
    it.url
  ].join('\t');

  const tsvPath = path.join(OUT_DIR, `polar_${ts}.tsv`);
  fs.writeFileSync(tsvPath, [headers, ...processed.map(row)].join('\n') + '\n');
  
  const latest = path.join(OUT_DIR, 'polar_latest.tsv');
  try { fs.unlinkSync(latest); } catch {}
  try { fs.writeFileSync(latest, [headers, ...processed.map(row)].join('\n') + '\n'); } catch {}

  console.log(`[polar-radar] Found ${processed.length} unique opportunities. Saved to ${tsvPath}`);
})();
