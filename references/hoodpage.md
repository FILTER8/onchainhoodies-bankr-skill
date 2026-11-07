# HoodPage: edit a Hoodie's homepage (source-verified, 2026-11-07)

**Worker**: `https://api.onchainhoodies.xyz`. **Public page**: `https://onchainhoodies.xyz/hoodies/{tokenId}`. **Editor for humans**: `https://onchainhoodies.xyz/hoodos/homepage`. This workflow uses the existing HoodOS full/open delegation, **not** a separate agent-access table.

## Read and publish

1. Resolve the authenticated Bankr signing EOA. Verify NFT `ownerOf(tokenId)` or existing **full/open** HoodDelegation authorization recognized by `HoodOS.canExecute(canonicalWallet, tokenId, signer, 0x000000000000000000000000000000000000dEaD, 0, 0x, 0)`. This is the Worker probe used for off-chain homepage rights, **not** a transaction to dead. Check the wallet is active if acting as delegate. Contract rules and signer policy take priority. Never grant self-delegation or request private keys.
2. `GET /v1/homepage/{tokenId}` returns `{ok,tokenId,published,config}`. Read it **before** changing a page. Preserve modules not mentioned in the user's request. A missing page returns `config:null`; derive a valid starter configuration from the documented schema rather than claiming the Worker provides a default editor payload.
3. Construct version-2 config. **Max 16 modules**. Preserve stable unique module IDs, theme/background, original layout and order. See module schema below. Keep a copy for preview/diff. Do not promise an actual preview endpoint; rendering is in the website frontend.
4. `POST /v1/homepage/nonce` with JSON `{ "tokenId": 351, "config": <complete version-2 config> }`. Response `{nonce,message,expiresAt}`. The Worker validates and normalizes the config and hashes the canonical `JSON.stringify` of that normalized config. **Important:** the final config must normalize identically when resubmitted. Do not modify it after creating the nonce.
5. Sign **exactly** the response `message` using Bankr's authenticated EIP-191 personal-sign interface. Do not invent signing tools. Agent signing requires Bankr host capabilities; never fabricate signature.
6. `PUT /v1/homepage/{tokenId}` with `{ "config": <same config>, "nonce": "...", "signature": "0x..." }`. Worker recovers EOA, checks owner/full HoodOS delegate **at submission**, consumes a single-use R2 nonce, stores the page and immutable homepage history. Check `{ok:true,published:true}`; reread `GET` and verify changes.
7. User permission to edit does not authorize arbitrary linked transactions, buys, signing broad approvals, or asset transfers. Full/open on-chain delegation is extremely powerful—warn before *granting* it and never grant without explicit owner authorization.

## Configuration shape (from `src/homepage/index.ts`)

Top-level: `{ "version": 2, "theme": "robin", "title": "...", "showOuterFrame": true, "modules": [] }`. `theme` is `robin` or `green`; optional `backgroundColor` is `#RRGGBB`; optional `background` is `{asset?:string,nft?:{contract:string,tokenId:string},mode:"tile"|"cover"|"contain"|"stretch",scale:number}`. Always read existing config for the exact values the UI emits. Each module requires unique `id` (letters, digits, `_`, `-`; max 64) and `type`. Optional shared style: `align: left|center|right`, `inverted:boolean`, `framed:boolean`, `size: sm|md|lg|xl`, `textFill: none|black|robin`.

Module types accepted by the Worker:

| type | Relevant fields |
|---|---|
| identity | `avatarSize` 64–320, `showSubtitle` boolean |
| talk | no special fields |
| text | `title` ≤70 chars, `text` ≤2000 chars; GIF tags `[[gif:filename.gif]]` allowed with valid curated asset |
| links | `items` array max 12 of `{label,url,gif?}`; label ≤45, URL must be HTTP(S) |
| divider | `style:"stars"|"line"`, `asset?` |
| marquee | `text` |
| assets | `showTokens`, `showNfts`, `tokenSymbols`, `nftKeys`, `limit` 1–24 |
| following | `showFollowers`, `showFollowing`, `showLists` booleans |
| memory | `limit` 1–20, `category?`, `showStats?` |
| netmint | `collection` valid EVM address, `title?` ≤70 |
| journey | `completedOnly?`, `limit` 1–24, `showStats?` |
| decor | `asset` curated `.gif` file, `width` 32–480 |
| midi | `asset` curated MIDI, `label?`, `loop?` (max one MIDI module) |

The Worker may reject unknown assets, bad media references, overlong fields or invalid background settings; do not make up accepted filenames. `GET /v1/homepage/assets` provides curated assets. The `following` module controls the optional follower statistics and lists; the small universal Follow button is a separate website control.

## Safe example: update only one module

User: "Use Hoodie #351 to promote collection 0x... on my homepage." First fetch current page and retain all other modules. Change just the chosen `netmint` module's `collection` (or append a new uniquely-ID'd module if the user asks and there's room). Ask for confirmation of the diff when material. Create challenge, sign and PUT. If no personal-sign support in this Bankr runtime, report the blocker rather than returning a made-up successful publication.

## History

- `GET /v1/token/{tokenId}/memory` contains immutable `HOMEPAGE_CREATED` / `HOMEPAGE_UPDATED` records under `source:HOODPAGE`.
- `GET /v1/hood/live?stream=homepage` returns homepage-only activity with `afterHomepage` off-chain cursor.
- `GET /v1/hood/live?includeHomepage=1` opts homepage actions into the merged feed; original blockchain cursors stay separate.
- Social history is covered in `references/following.md`; social inclusion in Live/Memory requires the companion Worker patch to be deployed, not only installing this skill.
