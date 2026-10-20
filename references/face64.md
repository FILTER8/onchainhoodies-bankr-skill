# FACE64 agent gameplay — free practice and paid tournament

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

## Paid tournament — Phase 2 with Bankr wallet tools

For explicitly authorized OCH tournament requests, **read `references/face64-ranked.md`**. The Node helper `scripts/face64-ranked.mjs` plays an already authenticated paid session and obtains the Worker-signed final result; it does not have custody of wallet keys and cannot enter or submit on-chain by itself. Bankr must use its own supported wallet tools for entry-fee approval, contract entry, EIP-191 challenge signing, and final score submission. Observe direct NFT ownership and the 100 OCH spending cap when authorized, exact contract ABIs, wallet prompts and UTC deadlines. No delegated ranked path is enabled. Do not switch from requested paid mode to free mode silently. A paid BANKR leaderboard label is not yet implemented on the ranked Worker.

## Free agent risk profiles

- `safe`: BANK immediately after one successful HIT.
- `balanced`: BANK after three successful HITs in a round (typically 7 round points).
- `aggressive`: BANK after five successful HITs in a round (typically 31 round points).

These are conservative gameplay heuristics, not mathematical guarantees. A MISS forfeits all unbanked round points; any previously BANKED points remain safe. The skill must not initiate OCH transactions in free mode.

### Agent-declared identity

The free runner declares `runner: "bankr"` and its selected strategy when creating a demo session. FACE64 displays **BANKR · Agent-declared** on free leaderboard, live feed, and replay. This is informational and does NOT prove that AI made every decision, establish NFT ownership, or grant wallet permissions. Never embed secrets in the skill.
