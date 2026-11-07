# Hood Live and Hoodie History — source audit (2026-11-07)

## Original uploaded API Worker

- `GET https://api.onchainhoodies.xyz/v1/hood/live` — on-chain indexed activity only by default, using `afterBlock`/`afterLog` blockchain cursor.
- `GET /v1/hood/live?stream=homepage` — off-chain homepage publishes `HOMEPAGE_CREATED` and `HOMEPAGE_UPDATED`; cursor `afterHomepage` (string matching immutable R2 publication keys).
- `GET /v1/hood/live?includeHomepage=1&limit=25` — mixed latest on-chain plus homepage actions; blockchain cursor does **not** track homepage records. Do not claim a blockchain transaction for a homepage event.
- `GET /v1/token/{id}/memory` — already includes immutable homepage creations/updates in the source.
- Following works via `/v1/homepage/social/...` and D1 `hoodie_follow_events`, but the **uploaded** Live and Memory code did not yet query these events.

## Companion Worker patch packaged separately

- `GET /v1/hood/live?stream=social&limit=25` — only D1 follow/unfollow actions, `HOODIE_FOLLOWED` / `HOODIE_UNFOLLOWED`, with numeric `socialCursor`; `afterSocial=<id>` returns subsequent events oldest first. Off-chain and no tx hashes.
- `GET /v1/hood/live?includeHomepage=1&includeSocial=1&limit=25` — combined latest feed. Keep blockchain cursor logic separate; do **not** use `afterBlock` to paginate social or homepage events.
- `GET /v1/token/{id}/memory` — social events where token is actor **or** target are added to the per-Hoodie event history, up to latest 1000 event rows per Hoodie. Target-side records use target token ID with actor and target in `data`.
- No D1 migration, new Worker binding, RPC variable, or new API path required. The existing `HOODFRAME_LIKES` D1 database contains social tables from Phase 2.

**Status:** The companion code must be compiled and deployed in the user's API project before claiming these extra endpoints work. A Bankr skill repository update **does not** deploy the Worker. The market `/v1/market/history` is a different endpoint (OpenSea sales/floor history) and should not be described as follow/homepage activity.
