#!/usr/bin/env node
/** FACE64 practice runner. No wallet, no blockchain transactions, no paid mode. */
const BASE = process.env.FACE64_DEMO_API || 'https://api.onchainhoodies.xyz/v1/face64/demo';
const steps = [7,8,9,10,11,12,13];
export function landing(start, count) {
  const pos = (start + count) % 64;
  const y = Math.floor(pos / 8);
  return y * 8 + (y % 2 === 0 ? pos % 8 : 7 - pos % 8);
}
function on(rows, i) { return Boolean((rows[Math.floor(i / 8)] ?? 0) & (128 >> (i % 8))); }
export function bestMove(rows) {
  let best = {start:0, hits:-1};
  for (let start = 0; start < 64; start++) {
    const hits = steps.filter(n => on(rows, landing(start,n))).length;
    if (hits > best.hits) best = {start, hits};
  }
  return {...best, probability: best.hits/7};
}
async function json(fetchImpl, url, init) {
  const r = await fetchImpl(url, init);
  const body = await r.json();
  if (!r.ok) throw new Error(`FACE64 HTTP ${r.status}: ${body.error || 'unknown error'}`);
  return body;
}
export async function playFree({collection,tokenId,strategy='balanced',fetchImpl=fetch,base=BASE,onEvent=()=>{}}) {
  if (!['hoodie','face'].includes(collection)) throw new Error('collection must be hoodie or face');
  if (!Number.isSafeInteger(tokenId) || tokenId < (collection==='face'?1:0) || tokenId>(collection==='face'?512:5999)) throw new Error('Invalid token ID');
  if (!['safe','balanced','aggressive'].includes(strategy)) throw new Error('strategy must be safe, balanced or aggressive');
  const created = await json(fetchImpl, `${base}/sessions`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({collection,tokenId,runner:"bankr",strategy})});
  const credential = created.sessionToken;
  if (!credential) throw new Error('Practice API did not provide session token');
  let session = created;
  const history = [];
  const maxActions = 500;
  // Practical stop-loss strategies. Do not indefinitely chase high one-step EV: a MISS
  // wipes the entire round's unbanked score. These are heuristics, not optimal play.
  // safe: bank after every HIT; balanced: bank after three HITs (7 points),
  // aggressive: bank after five HITs (31 points).
  const targets = {safe:1, balanced:3, aggressive:5};
  for (let index=0;index<maxActions && session.status==='playing' && session.state.phase!=='finished';index++) {
    const s = session.state;
    const move = bestMove(s.rows);
    let verb = 'run';
    if (s.phase==='decision') {
      if (s.hits >= targets[strategy] || move.hits === 0) verb='bank';
    }
    const params = verb==='run'?{startPosition:move.start}:{};
    const result = await json(fetchImpl,`${base}/sessions/${session.sessionId}/${verb}`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${credential}`},body:JSON.stringify(params)});
    const event = {round:s.round+1,action:verb,start:verb==='run'?move.start:undefined,hitChance:verb==='run'?Number((move.probability*100).toFixed(1)):undefined,hit:result.hit,earned:result.earned,banked:result.banked,score:result.session.state.totalPoints};
    history.push(event);onEvent(event);
    session=result.session;
  }
  if(session.status==='playing' && session.state.phase!=='finished') throw new Error('Safety stop: too many actions');
  return {collection,tokenId,strategy,sessionId:session.sessionId,status:session.status,score:session.state.totalPoints,rounds:8,moves:history.length,history,mode:'free',paid:false,onchain:false,runner:'bankr',verification:'self_declared'};
}
function parseArgs(args) {
  if (args.includes('--help') || args.length===0) return null;
  const collection=args[0], tokenId=Number(args[1]);
  const i=args.indexOf('--strategy');
  return {collection,tokenId,strategy:i<0?'balanced':args[i+1]};
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args=parseArgs(process.argv.slice(2));
  if(!args){console.log('Usage: node scripts/face64-free.mjs hoodie 351 [--strategy safe|balanced|aggressive]\nFREE PRACTICE ONLY. No wallet authorization or OCH payment.');process.exit(0);}
  playFree({...args,onEvent:e=>console.log(JSON.stringify(e))})
    .then(result=>console.log('FINAL '+JSON.stringify(result)))
    .catch(err=>{console.error('FACE64 FREE ERROR:',err.message);process.exitCode=1;});
}
