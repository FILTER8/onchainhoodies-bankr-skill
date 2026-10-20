# FACE64 agent gameplay — Phase 1 (free only)

FACE64 is an 8-round 8x8 arcade game with a server-authoritative roulette move. Each RUN chooses a `startPosition` in 0..63; the server samples 7..13 steps uniformly and determines HIT/MISS. On HIT, an active pixel is removed and the unbanked reward grows; on MISS, unbanked round points are lost and play advances; BANK is allowed only in `decision` phase after a HIT.

## Free-play Bankr request

Example: `Bankr, play FACE64 practice with Hoodie #351. Analyze each board and aim for a high score.`

Run using Node.js 20+ and HTTP/shell execution if available:

```sh
node scripts/face64-free.mjs hoodie 351 --strategy balanced
```

Other strategies: `safe`, `aggressive`. For a Face: `node scripts/face64-free.mjs face 205 --strategy safe`.

The runner uses `POST /v1/face64/demo/sessions`, then `POST /v1/face64/demo/sessions/{id}/run` or `/bank`. It reads the actual server state returned after every action and calculates the number of lit pixels across all seven possible landing positions. Never assume a chosen landing; the server chooses. It prints every action (without the bearer token) and a FINAL JSON score record. Avoid simultaneous actions on a session. Finish within the server's four-minute inactivity deadline; failures should stop rather than charge or restart automatically.

**This demo mode does not verify NFT ownership**. Hoodie #351 in a free game is a character label, not a proof that the Bankr agent controls that NFT or HoodWallet. Do NOT award HoodJourney milestones, say the Hoodie transacted, or claim the score was submitted on-chain. A completed demo session is recorded by the FACE64 Worker, but the current ranked public replay/leaderboard are separate and will not automatically show it.

If this Bankr surface does not permit executing local scripts or making HTTP POST requests, say that this integration cannot run in this surface; do not invent a completed session or output. Skill installation does not grant network, terminal or wallet tools.

## Paid tournament — NOT ENABLED

No OCH approval, swapping, contract entry or score submission in this Phase 1 runner. Ranked currently requires an ownership-bound EOA challenge signature; delegated HoodWallet access is **not** automatically accepted by the ranked Worker. Do not bypass `ownerOf == signer` checks or the existing HoodOS `canExecute` authorization. A future paid skill requires contract-aware payments, safe user-approved budgets, an agent-compatible challenge path and receipt verification. Consult `references/delegation.md` and `references/contracts.md` before designing that phase.
