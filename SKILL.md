---
name: onchainhoodies
description: Inspect OnChainHoodies NFTs and HoodOS token-bound HoodWallets on Robinhood Chain, check NFT ownership, wallet activation, OCH cost and approval, and help a Bankr wallet owner activate a Hoodie safely. Use for requests such as "show my Hoodies", "inspect Hoodie #351", "what is my HoodWallet", "check activation", or "activate my Hoodie".
---

# OnChainHoodies for Bankr

Use the current Bankr user's wallet context. **Never use a fixed address as the user's wallet**, infer ownership from an X handle, or request private keys. The target chain is **Robinhood Chain mainnet (4663)**. Consult `references/contracts.md` before crafting contract interactions.

## Read-only discovery

1. Resolve the user's *currently authenticated Bankr EVM wallet address* using the host's supported wallet/portfolio context. If unavailable, ask the user to supply a **public address**; do not pretend it is automatically available. The X account and a local development address are not proof of NFT ownership.
2. For a particular Hoodie ID, read `ownerOf(tokenId)` on the NFT contract. Compare to the actual wallet executing any future transaction. If these differ, explain that `activate` cannot be submitted from the wrong owner. NFT ownership may be a smart contract and require a different execution route.
3. Read `walletOf(tokenId)`, `isActive(tokenId)`, `activationEnabled()`, `activationCost()`, and `paymentToken()` from HoodOS. Note: `walletOf` is a deterministic address and is **not proof of deployment**.
4. Check ERC-20 `balanceOf(owner)` and `allowance(owner, HoodOS)` on the token returned by `paymentToken()`, plus native ETH for gas.
5. Provide the owner, wallet, active/inactive status, **live** cost (not a hardcoded 2,500 OCH), payment-token contract, required allowance, and any blocker. If token ownership has moved, activation may have reset.

For a local, independent read-only diagnostic (requires Node.js 20+ and `npm install`), run `node scripts/hoodie-info.mjs <tokenId> [walletAddress]`. The script does **not** access Bankr accounts or sign transactions. `RH_RPC_URL` may override the official public RPC.

For "show my Hoodies", use Bankr's NFT portfolio if available, filter by exact collection contract **and chain ID**, and cross-check each `ownerOf`. Do not claim that enumerating wallet holdings via the collection contract is universally supported. If the host has no reliable NFT inventory source, request token IDs rather than guess.

## Activation (explicit approval; never automatic spending)

1. Repeat every read-only check immediately before writing. Validate chain ID 4663, exact contract addresses, matching signer/owner, `activationEnabled` and `isActive=false`.
2. Present the live cost, ETH gas requirement, current OCH balance, and whether an ERC-20 approval is needed. Get the user's explicit consent to **each** write transaction. Never acquire OCH or swap tokens automatically; separately ask before any purchase.
3. If allowance is insufficient, use the host's supported transaction mechanism to send `approve(HOODOS, activationCost)` **from the NFT-owning wallet** to the *configured payment token*. Prefer an exact, limited allowance rather than unlimited approval. Wait for confirmed success; reread allowance.
4. Request authorization to send `activate(tokenId)` **from that same NFT-owning wallet** to HoodOS. This function transfers the activation cost from `msg.sender`, deploys the token-bound wallet if needed, and marks the current owner active.
5. After receipt confirmation, reread `isActive(tokenId)` and `walletOf(tokenId)`. Provide transaction hash and explorer URL only if observed in the host result. If a write fails or the host cannot target Robinhood Chain, explain the limitation and stop; do not fabricate completion.

**Bankr compatibility:** This skill describes the intended workflow but cannot grant the Bankr X bot any new signing permission. Use only documented Bankr wallet actions available in the actual agent/runtime. Do **not** assume installation into an individual Bankr terminal also installs the skill globally into public @bankrbot replies on X.

## References

- `references/contracts.md`: addresses, ABI signatures, source-backed authorization and fees
- `references/bankr.md`: installation, host-wallet limitations, transaction checks
- `scripts/hoodie-info.mjs`: read-only local inspect tool
