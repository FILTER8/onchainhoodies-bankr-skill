# FACE64 Phase 2 — Bankr-hosted paid ranked gameplay (directly owned NFT only)

This is a **restricted paid pilot** on Robinhood Chain 4663. Never substitute demo mode when ranked is requested. The existing FACE64 ranked engine's server RNG is not independently verifiable; do not promote public prize play without fairness/legal review. The skill is not an authorization bypass.

## Addresses / required ABIs

- Tournament: `0x753aa3bFd757D62e69389D90359bCB0c315b7c38`
- OCH: `0x8BDD5adFF8A9D08372323d5BAF5e8e52605AF983`
- Hoodies: `0x9ec6c5b9f572a9b02138e553bc5f5882da735f45`
- 64 Faces: `0xc8e36ae47246e5943da2b228fbaff1fb27a473b0`
- Ranked API: `https://api.onchainhoodies.xyz/v1/face64/ranked`

Solidity function signatures (from the deployed FACE64 tournament source supplied for this integration):

```solidity
function enter(address collection, uint256 tokenId) external;
function submitResult(uint256 day, address collection, uint256 tokenId, uint256 score, bytes32 gameId, uint256 deadline, bytes signature) external;
function entryFee() external view returns (uint256);
function paidEnabled() external view returns (bool);
function entriesPaused() external view returns (bool);
function getEntry(uint256 day,address collection,uint256 tokenId) external view returns ((address payer,bool joined,bool resultSubmitted,bool refundClaimed,bool prizeClaimed,uint256 score,bytes32 gameId));
function currentDay() external view returns (uint256);
function tournaments(uint256 day) external view returns (uint32 entrants,uint32 results,uint32 winnerCount,uint256 pool,uint256 lockedFee,bool configLocked,bool finalized,bool refundAll,address winningCollection,uint256 winningTokenId,uint256 winningScore);
function ownerOf(uint256 tokenId) external view returns (address);
function balanceOf(address account) external view returns (uint256);
function allowance(address owner,address spender) external view returns (uint256);
function approve(address spender,uint256 amount) external returns (bool);
```

The tournament accepts `enter(collection,tokenId)` from the *direct NFT owner* or a specifically recognized TBA. **The current ranked Worker is narrower:** the wallet signing its challenge must equal `ownerOf(tokenId)`. This Phase 2 pilot uses the same Bankr owner EOA as payer and ranked-session signer. No delegated wallets.

## Authorized workflow (one Hoodie, one day, no unrequested swaps)

1. Obtain the **current authenticated Bankr signing wallet** and verify chain ID 4663. Never hardcode a wallet from prior reports. Confirm direct `ownerOf(tokenId)` equality, enough native gas, exact OCH address, `balanceOf` and `allowance`. Read tournament `entriesPaused`, `paidEnabled`, `entryFee`, `currentDay`, `getEntry` and today's `tournaments`. Check the entry cutoff (23:45 UTC) and session/score deadline (midnight UTC). The live required fee can be zero when paid mode is disabled; if the user explicitly requests paid play, **do not silently treat a free entry as paid**. If the day's tournament configuration has locked a different fee, stop. Require expected cost of exactly 100 OCH if the user authorized exactly 100 OCH; amounts are in OCH token base units (verify decimals). Never swap or spend more without new authorization.
2. Explain the actual cost, network, contract, wallet and required approval/entry. Obtain Bankr's normal user confirmations before financial writes; the skill cannot waive them. `approve(tournament, exactFee)` only when allowance is insufficient; do not revoke or change a prior high allowance without explicit instruction. Re-read allowance after confirmation.
3. `enter(collectionAddress, tokenId)` on tournament from the **actual NFT owner EOA**, with zero native transaction value. Simulate when Bankr supports it; do not retry a transaction with uncertain receipt. Confirm the receipt and re-read `getEntry(currentDay,collection,tokenId)`: `joined=true`. Record its transaction hash. Enter *at most once* for that NFT/day.
4. `POST /v1/face64/ranked/challenge` JSON `{"collection":"hoodie","tokenId":351,"wallet":"<authenticated wallet>"}`. The response includes `nonce`, `message` and `expiresAt`. Sign **the exact returned UTF-8 message** via the currently authenticated Bankr EOA's supported personal-message signing tool (EIP-191 / `personal_sign` compatible with `viem.verifyMessage`). Do not substitute an EIP-712 signature or a signature from a different wallet. Never send private keys to the API or a local script.
5. `POST /v1/face64/ranked/sessions` JSON `{"wallet":"<wallet>","nonce":"<nonce>","signature":"<EIP-191 signature>"}`. This consumes the one-time nonce and issues `sessionId` and **secret sessionToken**. Keep the token private; never paste it into public chat, GitHub, logs or command-line args. If the host does not provide message-signing or appropriate HTTP calls, stop and report precisely what is missing. Do not bypass Worker checks.
6. In the **same isolated Bankr execution session**, pass `FACE64_RANKED_SESSION_ID` and `FACE64_RANKED_SESSION_TOKEN` as process environment values (not CLI flags) and run `node scripts/face64-ranked.mjs --strategy balanced`. The runner fetches server state, plays up to eight rounds, and calls `POST /sessions/{id}/result` when finished. It prints a `RANKED_RESULT` with a `signedResult` from the Worker. The signed result is **not an on-chain transaction**, and expires soon (the Worker currently gives ~2 minutes). Be prepared to submit promptly; don't delay for an unrelated interaction after playing.
7. Validate `signedResult.contract` equals the tournament, `collection` equals the intended NFT address, `tokenId`, day, score, gameId, signature, and `deadline`. Submit to the tournament: `submitResult(uint256 day,address collection,uint256 tokenId,uint256 score,bytes32 gameId,uint256 deadline,bytes signature)` **exactly as signed** via Bankr's authorized wallet transaction tool. Any wallet can relay this signed score, but use the authenticated wallet for the pilot. Never invent score parameters or sign a score yourself. Verify confirmed receipt and `getEntry(...).resultSubmitted=true` and score match. Report tx hashes and actual chain state. Until confirmation, say "score not yet submitted on-chain".
8. If transaction approval, wallet signing, API support, gas, token balance, entry deadline, permissions or receipt verification fails, **stop** with a specific blocker. Don't retry spending or switch to free mode automatically.

### Tool boundary and agent identity

`face64-ranked.mjs` is a **move/result helper only**. It cannot access Bankr's native wallet context, submit ERC-20 approvals, enter tournaments, sign the challenge, or relay scores. Bankr must perform those steps using the tools actually exposed in that runtime, not hypothetical wallet APIs. The script emits no secret token.

Current `src/face64/ranked.ts` does **not** persist `runner` or `strategy` in ranked D1 tables or expose them in ranked leaderboards. Do not claim a `BANKR` badge is live for paid games; that is a **separate small Worker/frontend update**. This does not affect completing the ranked game.

The Bankr runner is named by the host workflow, not proven to be AI. Never claim a cryptographic agent attestation.
