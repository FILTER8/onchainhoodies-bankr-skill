# OnChainHoodies Bankr Skill

A public skill for inspecting fully on-chain OnChainHoodies, activating HoodWallets, and executing explicitly authorized owner or delegated-agent actions on **Robinhood Chain (4663)**.

## Install in Bankr

Ask your Bankr agent: `install the skill at https://github.com/FILTER8/onchainhoodies-bankr-skill`

Bankr installs this skill to the Bankr account using it. Installation alone does **not** globally enable it for all @bankrbot interactions on X.

## Supported workflows

- Inspect a specific Hoodie by token ID: current owner, token-bound wallet, deployment/activation state
- Show Hoodies in the authenticated Bankr wallet when Bankr's NFT portfolio supports collection filtering
- Check current OCH activation cost, token balance, token allowance, and native ETH for gas
- Handle a single request such as **"Bankrbot, activate my Hoodie #351"**: check readiness, quote/swap for missing OCH if needed, approve exact allowance, activate, and verify through compatible Bankr tools

No private keys. The activation request can initiate the full workflow, but Bankr must enforce all required confirmations, permissions, swap limits, and transaction security checks.

## Local read-only verification

Requirements: Node.js 20 or newer.

```bash
npm install
node scripts/hoodie-info.mjs 351
node scripts/hoodie-info.mjs 351 0xb316e8ea7bc9b24ea5fd4ebd07051678c27ffe79
```

The optional second argument is a comparison address; the skill itself does **not** hardcode an owner's wallet. Override RPC with `RH_RPC_URL` if needed.

## Important limitations

A skill provides agent instructions; it does not create Bankr transaction-signing privileges. Read-only functions can be evaluated independently, but an activation requires Bankr support for sending both ERC-20 `approve` and HoodOS `activate` **from the actual NFT owner on chain 4663**, under Bankr's required authorization and transaction controls. Publishing a repository does not automatically enroll it in Bankr's public catalog or enable the X bot's skills globally.

Contract details: [references/contracts.md](references/contracts.md). Integration notes: [references/bankr.md](references/bankr.md).

Official Bankr installation docs: https://docs.bankr.bot/skills/in-bankr/from-github/

## License

MIT (skill code and documentation). NFT artwork and related OnChainHoodies project assets are outside the scope of this repository.

## One-command activation (v0.3)

Ask Bankr: `@bankrbot activate my Hoodie #351`. The skill directs Bankr to attempt a funded ETH-to-OCH swap when needed, then approve precisely the activation fee and activate through HoodOS. Every write remains subject to Bankr wallet security settings and tool permissions. If ETH is insufficient or safe routing is unavailable, Bankr should report the blocker rather than request an extra OCH-buy prompt.

## v0.4: Hood knowledge and milestones

Read public Hood ecosystem data and inspect HoodJourney milestones. For eligible on-chain claims Bankr must execute the Journey registry function **through** `HoodWallet.execute`; direct EOA check-ins are rejected by the registry. This write path remains untested in Bankr and requires owner authorization or valid scoped delegation. See `references/api.md` and `references/hoodjourney.md`.

```bash
node scripts/hood-knowledge.mjs --help
node scripts/hood-knowledge.mjs milestones
node scripts/hood-knowledge.mjs journey 351
```

## v0.5: HoodOS delegation

Hoodie owners may grant temporary, scoped permission to another EOA (including an AI agent) without transferring their NFT. Use the **DelegateOS** UI to grant and revoke. The agent must derive its signing EOA from its **own Bankr session**, not from this repo. It then verifies the NFT, active canonical HoodWallet, valid delegation, and `HoodOS.canExecute` for the **exact proposed call**, simulates, and submits `HoodWallet.execute` using normal Bankr transaction approval.

The tested Hoodie #336 flow included a successful delegated self-call and a wallet-funded `0.001 ETH` mint of 64 Faces #205 (transaction hashes and caveats in [references/delegation.md](references/delegation.md)). The signer did not own the Hoodie.

Public delegation read endpoints: `https://api.onchainhoodies.xyz/v1/token/{id}/delegations` and `/history`. Index data can lag; use **on-chain authorization** for any write.

**Security:** OPEN delegation can move tokens and NFTs from the HoodWallet. The native ETH cap is a per-call limit, not an ERC-20/NFT spending limit. Default to narrow permissions and short expiry, never prefill a developer/agent address.

## v0.6: HoodiePunks agent artwork + HoodieStudio

Includes the user's **62 genuine 20x20 traits** in `assets/hoodiepunks_traits.json` and an offline generator that understands the collection's five-layer assembly, Robin-green masks and black-pixel output. Modes: **Safe** (traits), **Creative** (small surprise), **Wild** (more experimentation). Fixed Background plus a choice of Punk/eyes/Mouth/TOP. **Preview first, publish separately.**

```bash
node scripts/compose-hoodiepunk.mjs --mode creative --seed 5500 --out ./output/my-punk
```

Inspect `./output/my-punk.svg` and `.json`; output is offline-only. To plan on-chain creation, read [artwork guide](references/hoodiepunks-art.md) and [HoodieStudio V4.2 operations](references/hoodiestudio-transactions.md). The skill contains a copy of the HoodieStudio creator's offline `artwork.mjs` validation/planning helper under `scripts/hoodiestudio-artwork.mjs`; check the original creator's redistribution license before re-publishing this portion. Nothing here automatically mints a 10,000-piece collection: the traits are a **reference art library** and HoodieStudio publishes to a Canvas through its distinct contracts.

For Bankr/X, use a short prompt such as: `@bankrbot With the OnChainHoodies skill, make a Creative HoodiePunk for delegated Hoodie #5500 and show a preview only.` Ability to produce SVG previews on X depends on the agent runtime; installing a skill doesn't add rendering tools.


## v0.8: Live four-mode Art Registry

Bankr can create public HoodiePunk previews through `POST https://api.onchainhoodies.xyz/v1/art/create`. The API stores canonical images in R2 and generation records in D1, with exact-image deduplication by final 20x20 bitmap. Preview generation is **off-chain**, independent of the user's HoodWallet authority.

| Mode | Meaning | API input |
|---|---|---|
| Safe | Exact source trait composition | `"mode":"safe"` |
| Creative | Subtle black-pixel additions | `"mode":"creative"`, optional `extraPixels` |
| Wild | Stronger black-pixel additions | `"mode":"wild"`, optional `extraPixels` |
| Glitch | Real horizontal row displacement and removal | `"mode":"glitch"`, optional `glitchStrength` |

True Glitch is different from horizontal black streaks. In Glitch, the Worker clears selected original rows and shifts their occupied pixels by signed offsets; the response exposes `glitchBands` and `removedPixels`. The API rejects `extraPixels` in Glitch mode. Use `glitchStrength: "mild"`, `"medium"`, or `"strong"` (default medium). The result is a new draft, **not automatically a legal additive edit to an existing on-chain Canvas**.

Example live request:

```bash
curl -sS -X POST https://api.onchainhoodies.xyz/v1/art/create \
  -H 'content-type: application/json' \
  -d '{"source":"hoodiepunks-v1","hoodieId":5500,"mode":"glitch","glitchStrength":"strong","traits":{"Punk":"square","eyes":"VR goggle","Mouth":"robot mouth","TOP":"punky hair"}}'
```

Short X prompt: `@bankrbot glitch HoodiePunk for #5500. Strong horizontal shifts. Preview only. PNG + gen ID.`

For this request, Bankr **must actually send `mode: glitch`**, verify `glitchBands` in the server response, and report the server-issued PNG + generation ID. `mode: wild` with hand-picked streak indices does **not** count as native Glitch. See [art rules](references/hoodiepunks-art.md) and [API reference](references/api.md). Bankr may need to reload this skill to use the updated instructions; skill installation alone does not guarantee HTTP tool access or globally enable public X interactions.
