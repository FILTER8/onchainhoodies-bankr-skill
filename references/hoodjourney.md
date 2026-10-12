# HoodJourney — live checks and wallet execution

This reference restores the file path used by the existing `SKILL.md` (it was missing from the supplied archive). Treat it as operational guidance; verify live contracts and ABI before sending a transaction.

- Robinhood Chain mainnet ID: `4663`.
- Hoodie NFT: `0x9Ec6C5b9f572A9B02138E553BC5F5882Da735F45`.
- HoodOS: `0x1993c5515E81d2768f7F8D8a1e6e38Bbf4e4beB9`.
- HoodJourneyRegistry: `0x93513A0e4d0E016ccf296C4c2888b59c06708ea7`.
- Read indexed `/v1/journey/milestones`, `/v1/token/{id}/journey`, and the journey endpoints in `references/api.md`. Indexed data can lag behind on-chain state.

To record a milestone, fetch the current ABI and contract status, determine whether the user is eligible, and encode the appropriate `verifyAndRecord` or eligible `checkIn` call. It must originate from the authorized HoodieWallet, not directly from an unrelated EOA. Check `ownerOf`, active HoodOS wallet, delegated scope if used, and `HoodOS.canExecute` for the exact call; simulate the outer `HoodWallet.execute` from the actual Bankr signer. Respect Bankr transaction confirmation and budget policies. Confirm the receipt and re-read chain state. Never call milestone functions on a read-only request, fabricate eligibility, or treat indexed status as final authorization.

For owner/delegation execution mechanics consult `references/delegation.md` and `references/contracts.md`.
