#!/usr/bin/env node
/** FACE64 ranked move runner. Wallet approvals, entry, and message signing MUST be done by Bankr host. */
import { bestMove } from './face64-free.mjs';

const DEFAULT_BASE = 'https://api.onchainhoodies.xyz/v1/face64/ranked';
const STRATEGIES = { safe: 1, balanced: 3, aggressive: 5 };

async function api(fetchImpl, url, init = {}) {
  const response = await fetchImpl(url, init);
  let data;
  try { data = await response.json(); } catch { throw new Error(`FACE64 HTTP ${response.status}: invalid JSON response`); }
  if (!response.ok) throw new Error(`FACE64 HTTP ${response.status}: ${data.error || 'unknown error'}`);
  return data;
}

export async function playRanked({ sessionId, sessionToken, strategy = 'balanced', base = DEFAULT_BASE, fetchImpl = fetch, onEvent = () => {} }) {
  if (!/^[a-f0-9-]{36}$/i.test(sessionId || '')) throw new Error('Valid ranked session ID required');
  if (!/^[a-f0-9]{64}$/i.test(sessionToken || '')) throw new Error('Valid ranked session bearer token required');
  if (!(strategy in STRATEGIES)) throw new Error('Strategy must be safe, balanced or aggressive');
  const url = `${base.replace(/\/$/, '')}/sessions/${sessionId}`;
  // First read confirms this is a paid/ranked session. No free-mode fallback.
  let session = await api(fetchImpl, url);
  if (session.ranked !== true || session.paid !== true) throw new Error('Session is not ranked/paid; refusing to play');
  if (session.sessionId !== sessionId) throw new Error('Session ID mismatch');
  if (session.status !== 'playing') throw new Error(`Ranked session is ${session.status}, cannot start fresh play`);
  const identity = session.identity;
  const history = [];
  for (let i = 0; i < 500 && session.status === 'playing' && session.state.phase !== 'finished'; i++) {
    const state = session.state;
    if (!Array.isArray(state.rows)) throw new Error('Ranked state missing board rows');
    const move = bestMove(state.rows);
    const bank = state.phase === 'decision' && (state.hits >= STRATEGIES[strategy] || move.hits === 0);
    const action = bank ? 'bank' : 'run';
    const response = await api(fetchImpl, `${url}/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(bank ? {} : { startPosition: move.start })
    });
    if (!response.session || response.session.sessionId !== sessionId) throw new Error('Invalid ranked move response');
    const entry = {
      round: state.round + 1, action, start: bank ? undefined : move.start,
      hitChance: bank ? undefined : Number((move.probability * 100).toFixed(1)),
      hit: response.hit, earned: response.earned, banked: response.banked,
      score: response.session.state.totalPoints
    };
    history.push(entry);
    onEvent(entry);
    session = response.session;
  }
  if (session.status === 'playing' || session.state.phase !== 'finished') throw new Error('Ranked run incomplete; no score submission requested');
  // The Worker signs EIP-712 result; only Bankr's transaction tool can submit it on-chain.
  const signedResult = await api(fetchImpl, `${url}/result`, {
    method: 'POST',
    headers: { authorization: `Bearer ${sessionToken}`, 'content-type': 'application/json' },
    body: '{}'
  });
  if (!signedResult.signature || !signedResult.contract || signedResult.tokenId !== identity.tokenId) {
    throw new Error('Malformed signed result; do not submit on-chain');
  }
  return {
    mode: 'ranked', paid: true, onchain: false, runner: 'bankr', verification: 'self_declared',
    sessionId, collection: identity.collection, tokenId: identity.tokenId,
    strategy, score: session.state.totalPoints, moves: history.length, history,
    signedResult, submissionRequired: true
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const strategyIndex = process.argv.indexOf('--strategy');
  const strategy = strategyIndex < 0 ? 'balanced' : process.argv[strategyIndex + 1];
  playRanked({
    sessionId: process.env.FACE64_RANKED_SESSION_ID,
    sessionToken: process.env.FACE64_RANKED_SESSION_TOKEN,
    strategy,
    onEvent: event => console.log(JSON.stringify(event))
  }).then(result => console.log('RANKED_RESULT ' + JSON.stringify(result)))
    .catch(error => { console.error('FACE64 RANKED ERROR:', error.message); process.exitCode = 1; });
}
