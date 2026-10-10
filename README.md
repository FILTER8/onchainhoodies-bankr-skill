# OnChainHoodies Bankr Skill

A public skill for inspecting fully on-chain OnChainHoodies and preparing carefully authorized HoodOS activation on **Robinhood Chain (4663)**.

## Install in Bankr

Ask your Bankr agent: `install the skill at https://github.com/FILTER8/onchainhoodies-bankr-skill`

Bankr installs this skill to the Bankr account using it. Installation alone does **not** globally enable it for all @bankrbot interactions on X.

## Supported workflows

- Inspect a specific Hoodie by token ID: current owner, token-bound wallet, deployment/activation state
- Show Hoodies in the authenticated Bankr wallet when Bankr's NFT portfolio supports collection filtering
- Check current OCH activation cost, token balance, token allowance, and native ETH for gas
- Guide **explicitly authorized** ERC-20 approval and HoodOS activation through compatible Bankr wallet tools

No private keys. No automatic transactions. No automatic token purchases.

## Local read-only verification

Requirements: Node.js 20 or newer.

```bash
npm install
node scripts/hoodie-info.mjs 351
node scripts/hoodie-info.mjs 351 0xb316e8ea7bc9b24ea5fd4ebd07051678c27ffe79
```

The optional second argument is a comparison address; the skill itself does **not** hardcode an owner's wallet. Override RPC with `RH_RPC_URL` if needed.

## Important limitations

A skill provides agent instructions; it does not create Bankr transaction-signing privileges. Read-only functions can be evaluated independently, but an activation requires Bankr support for sending both ERC-20 `approve` and HoodOS `activate` **from the actual NFT owner on chain 4663**, with explicit authorization. Publishing a repository does not automatically enroll it in Bankr's public catalog or enable the X bot's skills globally.

Contract details: [references/contracts.md](references/contracts.md). Integration notes: [references/bankr.md](references/bankr.md).

Official Bankr installation docs: https://docs.bankr.bot/skills/in-bankr/from-github/

## License

MIT (skill code and documentation). NFT artwork and related OnChainHoodies project assets are outside the scope of this repository.
