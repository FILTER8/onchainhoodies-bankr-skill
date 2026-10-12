# HoodiePunks agent artwork V1 — creative and protocol specification

Use this reference for HoodiePunks generation, previewing, or publishing through HoodieStudio. **Read `references/hoodiestudio-transactions.md` for actual contract calls.** This is a creative layer, not a separate NFT contract, an independent mint, or a source of spending authority.

## How the collection is constructed

The designer supplied `assets/hoodiepunks_traits.json`: name `HoodiePunks`, `gridSize: 20`, `supply: 10000` (generator collection metadata, NOT the supply of OnChainHoodies or an on-chain HoodieStudio cap), 62 traits across 5 ordered layers. These are the actual available layers and trait counts:

| Layer | Choice | Count |
|---|---|---:|
| Background | Fixed Robin layer | 1 |
| Punk | Pick one base (normally exclude Invisible unless explicitly requested) | 5 |
| eyes | Pick one | 16 |
| Mouth | Pick one | 16 |
| TOP | Pick one | 24 |

Layer order exactly **Background -> Punk -> eyes -> Mouth -> TOP**. The order of `layers` in the supplied JSON is authoritative. Each trait is a row-major array of 400 pixel color strings, index `y*20+x`. Black `#000000` draws; `transparent` preserves earlier layers; **Robin green `#ccff00` is an intentional visual mask that clears earlier layers' black pixels** and appears as preview background. A green mask is NOT ignored during layer composition. It is ignored only when producing the **final black-pixel bitset**. Keep fixed background's black pixels if any; they are not automatic "green-only" emptiness. Do not allow masks to remove previously published on-chain pixels.

Use trait `id` for stable selection; preserve the source JSON unchanged. Lightweight name aliases for prompts only: `bold` -> `bald`, `Crazy Hear` -> `Crazy Hair`, `smal mouth` -> `small mouth`, `once teeth out` -> `one tooth out`. Other names remain source-authoritative. `rarity` and `weight` are metadata; a user asking "random" is not a promise of an on-chain rarity or random mint guarantee. Avoid inventing compatibility rules absent from the supplied JSON.

The agent should understand the **construction process**, not hallucinate that it has a pre-existing token generator deployed: select traits; composite masks in declared order; optionally invent extra black pixels on the draft; render 20×20; encode the **final** black cells into indices 0–399; compare with live currentBitmap for an additive proposal; quote, fund, simulate, publish after approval.

## Generation modes and live API compatibility

- **Safe:** choose one trait from each non-background layer, no AI additions. Prefer recognizable faces.
- **Creative (default):** same four trait selections, plus 2–5 carefully chosen extra black pixels. These are optional if no sound additions exist; never claim generated pixels are artistic intelligence if simply randomized. Allow manual agent-authored edits for coherent variations.
- **Wild:** trait-guided base and strong, coherent pixel additions. The offline CLI currently auto-adds 6–14 nearby pixels; Bankr can intentionally choose a bolder set of pixels itself (aim up to ~32, respecting API validation). May change any non-anchored trait. The live API still renders traits plus black additions, not arbitrary pixel removal.
- **Glitch (experimental offline mode):** apply real horizontal band shifts to a *draft* (including moving/removing pixels), producing offset visor/face sections, stepped mohawks, fragmented scanlines. CLI `--mode glitch` does this locally. **The live registry does not accept `mode: glitch`**. For Bankr/X today use `mode: wild` with purposeful *additive horizontal stripes/fragments* and call it a glitch-inspired preview, not a true shifted Glitch. Full Glitch requires a Worker update supporting row transforms or a validated full bitmap. On an existing published Canvas, removed/dark-to-green pixels are not erasable.

No default publication. For preview requests, never write on chain. A publishing request must refer to an identifiable approved exact bitmap/title/artist, live checked and simulated in the authorized wallet context. Ask for confirmation if required by agent/wallet policy; an instruction to use the skill is not financial authorization.

## Local generation and preview (Node.js >=18)

```sh
node scripts/compose-hoodiepunk.mjs --mode safe --seed test1 --out ./output/punk
node scripts/compose-hoodiepunk.mjs --mode creative --seed test2 --eyes 'small shades' --mouth smile --out ./output/punk
node scripts/compose-hoodiepunk.mjs --mode wild --seed test3 --out ./output/punk --canvas-id 5500 --custody-id 5500
node scripts/compose-hoodiepunk.mjs --mode glitch --seed test4 --out ./output/glitch
```

Output `.svg` is a 400x400 crisp scaled image with a **20x20 underlying grid**. Output `.json` contains chosen trait IDs/names, full final bitmap numbers, `newPixels`, and the new pixel count. `--seed` reproduces the draft. `--punk`, `--eyes`, `--mouth`, `--top` accept trait names/aliases/IDs. An **optional** `--edits edits.json` accepts `{"add":[1,2],"remove":[3]}` with positions 0–399 to encode deliberate agent inventions; use no removals of permanent bits. For a previously published Canvas supply a fresh verified `--current current.json` with decimal `bitmapLow`, `bitmapHigh`. The preview will OR in all existing permanent bits, and `newPixels` will exclude them. This is a proposed additive design, never proof the transaction can succeed.

If `--canvas-id` is supplied, the JSON contains `artworkDraft`; fill `allocations` with live authorized Bottle funds before calling the official HoodieStudio helper `scripts/hoodiestudio-artwork.mjs` on that draft JSON. The helper rejects empty or mismatched allocations. Match exact added pixel count to live `quotePublish`; display INK, OCH, and potential edit fee. **The CLI never makes blockchain calls**.


## Public Art Registry (preferred for Bankr on X)

Use `https://api.onchainhoodies.xyz` for browser-accessible preview images. The deployment has confirmed: `GET /v1/art/sources`, `POST /v1/art/create`, `GET /v1/art/generations/{id}`, `GET /v1/art/images/{hash}.png`, and `.svg`. `GET /v1/art/sources/{id}` is **not** supported.

Example preview-only request:

```http
POST /v1/art/create
Content-Type: application/json

{"sourceId":"hoodiepunks-v1","hoodieId":5500,"mode":"wild","traits":{"Punk":"square","eyes":"VR goggle","Mouth":"smile","TOP":"Mohawk"},"extraPixels":[148,151]}
```

The live API returns `generationId`, `hash`, `png`, `svg`, `selectedTraits`, `extraPixels`, `pixelCount`, `exactDuplicateImage`, and `status`. Respect validation errors and daily rate limits; do not spam regeneration to force uniqueness. Reusing the same final bitmap will produce the same canonical image hash, even if generation IDs differ.

**Do not conflate these:** server-generated random variation, agent-selected artistic pixel coordinates, and a faithful full-image glitch distortion. An agent can select intentional `extraPixels` without altering the Worker, but `extraPixels` can only add black pixels, not horizontally relocate or clear existing black pixels. For true Glitch use the offline CLI now and plan a separate Worker change before saying it is supported by the public registry.

Short X-style commands (only when the skill is available in that Bankr runtime):
- `@bankrbot creative HoodiePunk for #5500. Preview only. PNG + gen ID.`
- `@bankrbot wild HoodiePunk for #5500. Preview only. PNG + gen ID.`
- `@bankrbot glitch-inspired HoodiePunk for #5500. Preview only. PNG + gen ID.`

## Publication with HoodOS delegated execution

Do not confuse HoodieStudio's **draft artist delegation** (`saveDraft`) with the separate **HoodOS agent delegation** (`HoodDelegation`), which may allow calls *from* the official HoodieWallet. For a valid OPEN or appropriately scoped HoodOS grant, resolve the Canvas and Bottle custody HoodWallets, validate exact `HoodOS.canExecute(wallet, hoodieId, signer, target, value, calldata, 0)`, and simulate the **outer `HoodWallet.execute`** from the agent signer. `publishOwnerPixels` is the *owner publication path originating from the canonical Wallet* if the relevant Canvas authority and no conflicting active HoodieStudio artist draft delegation permit it. The signer is still not the NFT owner; authorization is enforced by HoodOS.

Always obtain live chain state, correct mainnet dependencies, proof manifest if claiming, active wallet, currentBitmap, adequate INK (may require several Bottles), current OCH price and balances, exact allowance, artist-name reservation, actual `quotePublish`, and successful simulation. For claim workflows inspect and verify official frozen INK manifest/proofs as specified in `hoodiestudio-transactions.md`. Have an authorized signer spend only its authorized budget and report receipts. Do not issue transactions because an offline bitmap script succeeds. When already published, zero *new* pixels cannot be published as a title-only update. Do not mistake visual green masks for the ability to erase on-chain black pixels.

## Example agent prompts

- "Check delegated Hoodie #5500 for HoodieStudio readiness. Read-only."
- "Make me a Safe HoodiePunk preview using Hoodie #5500; do not publish."
- "Create a Creative HoodiePunk with shades and a smile, using my traits; preview only."
- "Surprise me with a Wild HoodiePunk. Show the black-pixel count and proposed bitmap. No transaction."
- "Quote and simulate publication of the exact preview I approved using delegated Hoodie #5500; report costs before any spend."
