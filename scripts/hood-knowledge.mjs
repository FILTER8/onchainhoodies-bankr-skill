#!/usr/bin/env node
// Read-only public API viewer. No wallet signing and no write endpoints.
const BASE = 'https://api.onchainhoodies.xyz';
const tokenId = process.argv[3];
const mode = process.argv[2];
const help = () => {
  console.log('Usage: node scripts/hood-knowledge.mjs <collection|milestones|hoodie|journey> [tokenId]');
};
if (mode === '--help' || !mode) { help(); process.exit(mode ? 0 : 1); }
const routes = { collection: '/v1/collection', milestones: '/v1/journey/milestones' };
if (mode === 'hoodie' || mode === 'journey') {
  if (!/^\d+$/.test(tokenId ?? '') || Number(tokenId) >= 6000) {
    console.error('tokenId must be an integer from 0 to 5999'); process.exit(1);
  }
  routes[mode] = `/v1/token/${tokenId}${mode === 'journey' ? '/journey' : ''}`;
}
const route = routes[mode];
if (!route) { help(); process.exit(1); }
try {
  const response = await fetch(BASE + route, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`API HTTP ${response.status}`);
  const json = await response.json();
  console.log(JSON.stringify({ source: BASE + route, readOnly: true, data: json }, null, 2));
} catch (error) {
  console.error(`API read failed: ${error.message}`);
  process.exitCode = 1;
}
