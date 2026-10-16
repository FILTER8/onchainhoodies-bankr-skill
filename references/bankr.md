# Bankr integration and publishing

## Install the skill in a Bankr agent

After the public repository contains `SKILL.md` at its root, tell your Bankr agent:

`install the skill at https://github.com/FILTER8/onchainhoodies-bankr-skill`

Bankr's documentation says it installs `SKILL.md` and supporting files from public repositories, per wallet/account. Reinstall from the same URL for updates. This **does not automatically publish the skill to every user of @bankrbot on X**.

Official reference: https://docs.bankr.bot/skills/in-bankr/from-github/

## Wallet transactions

- Obtain the **actual authenticated wallet address** from the Bankr host tools. Never hardcode the author's testing address.
- Native Bankr wallet operations, if available in the running agent, must be used to authorize `approve` and `activate` on Robinhood Chain chain ID 4663. A descriptive skill file does not guarantee such operations are supported through every Bankr client.
- Wallet API signing generally requires an API key with proper permissions. A user tagging @bankrbot on X is not equivalent to granting this skill raw Wallet API access.
- Do not ask for API secrets or private keys in a public conversation or save secrets to the repository.
- Never send approval or activation merely because a read-only inspection command was requested.

Docs: https://docs.bankr.bot/wallet-api/sign/ and https://docs.bankr.bot/skills/overview/

## Suggested acceptance tests

1. Install skill from public GitHub into a personal Bankr agent.
2. Ask "inspect OnChainHoodie 351" and verify owner/activation status with chain data.
3. Check incorrect owner path: it must refuse to activate.
4. Check already active path: it must refuse unnecessary spending.
5. Test explicit approval/activation authorization with a wallet holding sufficient OCH and ETH. Confirm no transaction is sent without the user's permission.
6. Test the @bankrbot X surface separately for installation/discovery and write permission.

## Single-prompt activation (v0.3)

User: `Bankrbot, activate my Hoodie #351`

The skill may initiate the necessary OCH swap when the user's wallet has insufficient OCH, then exact ERC-20 approval and activation, without asking the user to issue three separate commands. This is **not** blanket approval to spend: use only the host's supported swap/sign/submit tools, respect its required permissions and confirmations, and honor user-defined spend/slippage limits. Avoid purchases when the wallet cannot afford the quote plus gas.

If a reliable quote or a safe route is unavailable, or Bankr's host refuses a write operation, give the user the precise blocker rather than implying completion. Check the final on-chain activation state before announcing success.

## Do not stop at an OCH shortfall

When the user says "activate my Hoodie" and the owner has 0 OCH, **do not end the action by asking whether they want to buy OCH**. Quote the missing OCH against existing ETH in the same Bankr session, reserve gas, and execute through the host's permitted trade mechanism (respecting its confirmations and limits). Only ask for follow-up when actual funding, quote availability or wallet security prevents completing the action. If a swap's status is uncertain, query the activity/receipt before attempting it again; use Bankr's idempotency key when available.

Wallet-level spend limits and arbitrary-contract-call settings always take precedence over skill instructions. Official documentation: https://github.com/BankrBot/skills/blob/main/bankr/SKILL.md

## v0.5 — delegated agent execution

Bankr can submit `HoodWallet.execute` from a signer **different from the NFT owner** only when HoodOS grants authorization for the specific calldata. Verify the signer with Bankr host wallet context, check `HoodOS.canExecute`, simulate, follow host signing policy, and verify the result. See `references/delegation.md`. Never use the historical Bankr test EOA as a default or imply that installing the skill grants delegation.

## v1.0 — Autonomous ListingOS for Bankr-owned Hoodies

Read `references/marketplace.md`. **Agent-owned Hoodie** is now a proven OpenSea seller path: when the authenticated Bankr signing wallet is the on-chain owner of the Hoodie, its Seaport EIP-712 signature can validate via that HoodWallet's ERC-1271 and can be submitted through ListingOS. Discover available durations with `GET /api/listingos/prepare` (1h, 12h, 1d, 3d, 7d default, 30d), use exact `durationSeconds`, configure creator royalties ON by default, and use ETH/USDG as collection-supported. Do not assume an NFT held by HoodWallet is owned directly by the Bankr EOA; always use the HoodWallet as Seaport offerer and use ListingOS rather than native EOA seller tools.

A **delegated** Bankr EOA can approve NFT conduit and call Seaport `validate()` on-chain but cannot supply the Hoodie owner's ERC-1271 signature. Do not claim OpenSea listing visibility from on-chain validation. Never announce a listing until OpenSea accepts/indexes it. Public X @bankrbot may have different installation and transaction authority than the private Bankr agent; test that integration separately.

## Short-context public X / social listing flow (v1.1)

For a single-turn public listing request, **read `references/marketplace.md`**, especially `Fast path for short social / X requests`, `Payment token quick reference`, and `Exact EIP-712 signing envelope`. That file contains the precise full `/api/listingos/submit` request shape; copy the complete returned `/prepare.parameters` object and do not drop `totalOriginalConsiderationItems` from HTTP submission (omit it only from EIP-712 `OrderComponents` signing). For 8x8portrait and 64 Faces request USDG immediately. Do not run long forensic/browser-bundle scripts when the documented schema suffices.

Execution requires that **this X runtime** exposes the authenticated Bankr signer and permitted transaction tools. Test that availability directly; private terminal authority, prior conversation state and skill installation do not automatically transfer to X. On any missing authority, expired prepared order, signature failure or API mismatch, stop and state the blocker rather than guessing or claiming a listing went live.
