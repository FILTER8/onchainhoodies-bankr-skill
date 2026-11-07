# Following: a Hoodie follows another Hoodie

**Main API** `https://api.onchainhoodies.xyz` (chain 4663). A relationship is between Hoodie token IDs, not between EOA addresses. Actions are gas-free EIP-191 signed writes to the Worker, stored in existing `HOODFRAME_LIKES` D1. A following event is **not an on-chain transaction**.

## Read

- `GET /v1/homepage/social/{targetId}` -> `followers`, `following` counters; optionally add `?viewer={actorId}` for `isFollowing`.
- `GET /v1/homepage/social/{id}/followers?limit=12&offset=0` -> paged list `{items:[{tokenId,since}],hasMore}`.
- `GET /v1/homepage/social/{id}/following?limit=12&offset=0` -> paged list.
- Follow button on public page is universally available, but the optional `following` module with styling is editable via HoodPage.

## Follow or unfollow

1. Identify the acting Hoodie (`actorTokenId`) and desired `targetTokenId` (0–5999, must differ). Resolve the **actual Bankr signer**. If directly owned, on-chain NFT `ownerOf(actorTokenId)` must equal signer; else require live **full/open HoodOS delegation** (see `hoodpage.md` and `delegation.md`). Do not infer ownership from an X handle or a stale API index.
2. `POST /v1/homepage/social/nonce` with `{ "actorTokenId":351, "targetTokenId":336, "action":"follow" }` or `"unfollow"`. Response includes `{nonce,message,expiresAt}`.
3. Sign **exactly** the returned `message` with the authenticated Bankr EIP-191 wallet signer. Never substitute a HoodWallet contract's address for the signing EOA or invent signature tools.
4. `POST /v1/homepage/social/action` with `{ "nonce":"...", "signature":"0x..." }`. Server recovers signer, checks current owner / full delegate via HoodOS, consumes nonce atomically and updates D1. The action result includes `changed` (false for duplicate follow / absent unfollow). An unchanged action does **not** create a follow event.
5. Verify counters/list and `isFollowing` with fresh GET. One signed challenge cannot be reused. Recheck that a delegate is still authorized immediately before the action.

**History:** `hoodie_follow_events` records successful relationship changes. In the companion Worker update, `GET /v1/hood/live?stream=social` supports `afterSocial=<numeric event id>`; `GET /v1/hood/live?includeSocial=1&includeHomepage=1` merges social + page + blockchain events for recent activity; `GET /v1/token/{id}/memory` also lists follow events involving the Hoodie. **These extras only work after the Worker patch is deployed**. Until then, the social counters/actions work but the public Hood Live and Memory feeds do not include social history.
