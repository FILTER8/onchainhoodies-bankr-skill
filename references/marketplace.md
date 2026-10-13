# HoodOS marketplace: BuyOS / ListingOS (v0.9)

**Network:** Robinhood Chain mainnet, chain ID **4663**.
**Canonical Hoodie NFT:** `0x9Ec6C5b9f572A9B02138E553BC5F5882Da735F45`.
**HoodOS:** `0x1993c5515E81d2768f7F8D8a1e6e38Bbf4e4beB9`.
**Listing Seaport 1.6:** `0x0000000000000068F116a894984e2DB1123eB395` (verify against returned order and the deployment before use).

## Use HoodOS, not a duplicate marketplace implementation

- **BuyOS (human UI):** `https://onchainhoodies.xyz/hoodos/buyos` — check that this is the current deployed route before sending the user. Purchase an NFT **into the selected Hoodie’s canonical HoodWallet**. Do not assume the connected human EOA is the asset recipient.
- **ListingOS (human UI):** `https://onchainhoodies.xyz/hoodos/listingos` — choose an active Hoodie, select an ERC-721 in its inventory, enter a fixed ETH price, prepare/review the OpenSea-supported order, then approve/sign as required. Active orders are displayed with artwork, price, **Cancel Listing** and **Change Price**; there is no longer a separate manual backup/import cancellation section.
- These frontend routes are user-facing pages, **not autonomous agent APIs**. Bankr's ability to submit a transaction is determined by its actual host capabilities and wallet policy, not by availability of the website.
- The working listing implementation uses OpenSea v2 listing creation actions to prepare Seaport orders, not fabricated order components. The successful public listing/cancellation was tested by the project developer in the human frontend; Bankr automation has **not** been proven end-to-end.

## Human ListingOS flow

1. Resolve the connected human EOA and selected Hoodie; check `ownerOf(tokenId)`, `HoodOS.walletOf(tokenId)`, active/deployed wallet and actual NFT owner. Avoid confusing the Hoodie token ID with the *listed NFT* token ID.
2. Get the requested price in **ETH display units**; do not send wei into OpenSea's ETH price amount field. Present actual royalties and marketplace fees returned by OpenSea, not hardcoded rates.
3. The human owner signs OpenSea/Seaport EIP-712 order data. In the tested ListingOS architecture, HoodWallet's ERC-1271 verifies that owner signature. **Delegation does not confer the human owner's EIP-712 signing identity.**
4. If the NFT needs approval, the owner confirms the `HoodWallet.execute` transaction to approve the verified Seaport conduit; gas is paid by the outer signer. Submit the order and confirm OpenSea acceptance/indexing; a prepared or merely signed order is not proof of a live listing.
5. **Cancel:** Select the exact active order; the server verifies it against the actual HoodWallet and on-chain order hash before preparing a Seaport `cancel` wrapped through `HoodWallet.execute`. Confirm receipt; re-query status. Do not cancel by matching only NFT name or arbitrary user-supplied hashes.
6. **Change price:** Cancel the old listing on chain **first**, confirm it cannot remain fillable, then prepare/review/sign/publish a *new* order with the intended price. Cancelling does not itself update a price or automatically relist.

Important: If an order has already been signed or validated but is not indexed by OpenSea, it can still need cancellation. An OpenSea API listing view alone is not a complete inventory of possible signed orders. When in doubt, inspect Seaport state or use the exact saved order data, and avoid duplicate active orders.

## Bankr agent decision path

1. **Guidance only:** For requests such as “How do I list Hoodie #351’s NFT?” or “Where can I change a listing price?”, point to the existing HoodOS page and describe the steps. No chain write or signature.
2. **Read-only inspection:** If the user requests a price/order/asset check, use available, authorized Bankr tools or supported public APIs to check the selected Hoodie, canonical HoodWallet, chain, NFT balance and OpenSea status. Do not claim marketplace results if no reliable source is accessible.
3. **Buy on behalf of a Hoodie:** Only if Bankr supports the target action and the user explicitly requests it: derive Bankr's current signer, Hoodie ownership and wallet, activation, exact purchase target/value/data, wallet funds and gas, and live `HoodOS.canExecute` for the exact outer `HoodWallet.execute(target,value,data,0)` call. Simulate, obey all Bankr confirmation/spend limits, await receipt and verify that the NFT entered the *HoodWallet*. The human BuyOS may offer separate execution paths; do not blindly copy transactions.
4. **List:** Do **not** claim Bankr can create the same ListingOS listing merely because it can buy and sell from its *own* EOA. The tested Seaport ERC-1271 method needs the current human Hoodie owner's EIP-712 signature, which delegation by itself does not provide. Unless Bankr has a separately verified authorized way to obtain that signature and complete OpenSea submission, instruct the human holder to use ListingOS. Never forge signatures, solicit private keys or submit an unsigned order.
5. **Cancel/approve as delegate:** Distinguish a native on-chain HoodWallet operation from off-chain order signing. A delegate **may** be able to submit the exact `HoodWallet.execute` for cancellation or approval if `HoodOS.canExecute` authorizes it and the Bankr host supports the call; the Seaport order must be validated against the actual wallet and order details first. No blanket consent from an existing broad capability; request explicit user intent, simulate and obey policy.
6. **Change price:** First ensure a confirmed cancellation of the old order, then require a newly signed/published replacement. Never claim a price is changed solely because cancellation succeeded.

## Security / money movement

- Robinhood chain ID must equal **4663**, target and NFT contracts must match the intended action, and the signing identity must come from the authenticated Bankr session. Never use the owner's previously documented test EOA as a default.
- A Hoodie owner and an authorized delegate are different identities; delegation is narrow permission, not transfer of ownership, control of the owner's browser, or ERC-1271 owner signing authority.
- **ETH gas** for the outer transaction is usually paid by the authenticated sender. **ETH value** spent via `HoodWallet.execute` comes from HoodWallet's balance; never confuse these.
- Buyer total, seller proceeds, fees, royalty recipients and token approvals are all critical. Verify the exact order and amounts before signing, and never silently normalize/adjust a price.
- NFT approvals such as `setApprovalForAll` allow broad transfer authority; limit to verified marketplace operator/conduit, only when necessary, with explicit consent.
- No trade, listing, approval or cancellation is successful until the relevant receipt and/or marketplace state have been checked.

## Suggested verification tests

- Bankr can correctly answer where BuyOS and ListingOS are, without pretending to control the frontend.
- Bankr stops an attempted human owner listing when no owner signature is available.
- Bankr correctly distinguishes Hoodie owner, canonical wallet, Bankr EOA and underlying listed NFT.
- In an actual authorized delegated transaction, it checks `HoodOS.canExecute` with exact calldata and reports true transaction status.
- After cancelling a listing, it does not claim that the new price is live until a replacement order is accepted.
