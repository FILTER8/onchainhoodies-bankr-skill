# HoodOS marketplace: agent-owned ListingOS / BuyOS (v1.0)

**Robinhood Chain:** chain ID `4663`. **Hoodie NFT:** `0x9Ec6C5b9f572A9B02138E553BC5F5882Da735F45`. **HoodOS:** `0x1993c5515E81d2768f7F8D8a1e6e38Bbf4e4beB9`. **Seaport 1.6:** `0x0000000000000068F116a894984e2DB1123eB395` (always cross-check against the live prepared order). **ListingOS:** `https://onchainhoodies.xyz/hoodos/listingos`; **BuyOS:** `https://onchainhoodies.xyz/hoodos/buyos`.

## Status: what has actually worked

- **Bankr-owned Hoodie #351:** Bankr signing wallet equalled on-chain Hoodie owner. The EIP-712 Seaport typed-data signature returned ERC-1271 magic `0x1626ba7e` from its HoodWallet, even though the HoodWallet—not the signing EOA—was Seaport `offerer`.
- NFT `64 Faces #83` listed on OpenSea for **10 USDG**, with the NFT remaining in Hoodie #351's HoodWallet. The order was later **cancelled on-chain**: `0x688fcc40c9a04e1c545aa10ac4b93a47e675aae4bcfa5ae8bb61b06dc11573ac`. Do NOT treat this historical order as live.
- ListingOS V2 prepared a 1-hour order with 10 USDG, creator royalties ON, for `8x8portrait #3` in Hoodie #351. The agent reported successful subsequent publication. **Do not reuse historical order hashes or expiry timestamps**; always prepare a new order for current trades.
- **Delegated Hoodie #5500:** Bankr successfully minted `8x8portrait #687` from the delegated HoodWallet and approved the conduit; Seaport `validate()` succeeded, but Bankr's delegated EOA signature failed HoodWallet ERC-1271. OpenSea orderbook did not publish that delegated order. Do not confuse validated-on-chain with listed-on-marketplace.

## Agent-owned listing: operational workflow

1. Resolve the **actual Bankr signing EOA** from authenticated host tools. Query current Hoodie `ownerOf(hoodieId)`, active/deployed canonical `HoodOS.walletOf(hoodieId)` and NFT `ownerOf(listedTokenId)`. Owner EOA must equal Bankr signing EOA; listed NFT must be held by canonical HoodWallet. Never hardcode the test addresses from examples.
2. Discover duration presets via **`GET https://onchainhoodies.xyz/api/listingos/prepare`**. Supported IDs and seconds: `1h`=`3600`, `12h`=`43200`, `1d`=`86400`, `3d`=`259200`, `7d`=`604800` (default), `30d`=`2592000`. Use `durationSeconds` on POST. `days` exists for compatible older day-based clients, but use presets for new operations.
3. **`POST https://onchainhoodies.xyz/api/listingos/prepare`** with Hoodie ID, listed NFT contract and token ID, desired currency (`ETH` or `USDG`), display-unit price and exact duration, plus `useCreatorFee: true` by default. Example request (check deployed schema before relying on optional aliases):

   ```json
   {"hoodieId":"351","contract":"0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653","tokenId":"3","currency":"USDG","priceAmount":"10","durationSeconds":3600,"useCreatorFee":true}
   ```

   Use the currently deployed API schema for `priceAmount`; if a deployment uses a different alias, inspect its route and adapt rather than guessing. **ETH values are decimal ETH, not wei**; USDG uses its live contract decimals. Let OpenSea generate its listing Actions fee recipients and conduit. Do not handwave marketplace or creator fees or splice an old signature into new order parameters.
4. Validate **all** returned data: `offerer` must equal the HoodWallet; offered token/ID/quantity must match; counter and Seaport domain must be correct; consideration must sum to requested amount; all consideration items must use the chosen payment token; inspect seller proceeds, marketplace recipient and actual royalties. **Creator royalties ON** is the default request, not proof of a payout: inspect the signed consideration/verification result. Do not promise a creator payout when none applies. Respect enforced royalties; never bypass them.
5. Verify `startTime` and `endTime`: the order must match the selected preset, not OpenSea's older default 30 days (or prior accidental multi-year expiration). ListingOS may modify OpenSea's original endTime and recompute the order hash. Sign **only the final returned Seaport EIP-712 `OrderComponents` with the final counter and timestamps**, never the original OpenSea Actions 30-day payload. Request a fresh order if expired.
6. Inspect `approval`. If non-null, use the Bankr-host-supported transaction tool to call `HoodWallet.execute(nftContract,0,approval.data,0)` from the authenticated signer, after verifying the operator is the conduit obtained on-chain from the returned conduit key. Simulate, obey host confirmations, await receipt and reread approval. `setApprovalForAll` is broad; never approve an unexpected operator.
7. Sign the final Seaport 1.6 typed-data payload using the **actual Hoodie-owner Bankr signing EOA**. Verify `HoodWallet.isValidSignature(digest, signature) == 0x1626ba7e`, including through `/api/listingos/check-signature` when supported. Mere delegation does not pass this check.
8. **`POST /api/listingos/submit`** with the freshly prepared `parameters`, `counter`, `orderHash`, `seaport`, NFT identity, Hoodie ID and EIP-712 signature. Before submitting, recheck seller, price, all recipients, exact duration and active ownership. The backend validates signature and reports `submittedToOpenSea` / `activeConfirmed`; `submittedToOpenSea` alone does not prove active indexing. Verify via order lookup or marketplace UI and report any indexing lag accurately.
9. Return listing link, exact expiration, order hash, payout breakdown, approval transaction hash (if any), and whether marketplace status was independently confirmed. Don't label a prepared/validated/signed order as "live".

**Host limitations:** Installing this skill does not confer Wallet API signing permissions, authenticated web sessions, OpenSea API credentials or public X bot write access. The ListingOS backend holds its own OpenSea API key; never request or expose it. Use Bankr's supported calls and wallet policy, with the user's authorization for actual transactions.

## Cancellation / price change

- Identify the **exact** currently active Seaport order, full components and counter; verify its HoodWallet offerer, NFT and status. Cancel via authorized `HoodWallet.execute(Seaport,0,Seaport.cancel([OrderComponents]),0)` and wait for receipt; verify `getOrderStatus(orderHash).isCancelled == true`. Do not cancel by token name alone.
- A cancelled order may remain visually cached on OpenSea for a short time; chain cancellation prevents normal fulfillment. Cancelling does **not** revoke an existing NFT conduit approval; revoke separately only when requested/appropriate.
- **Change price:** cancel original order **first**, confirm cancellation, then prepare/sign/submit a new order with the requested price. Never claim cancellation alone reprices a listing.

## Delegated Hoodies: limitations (not an automatic listing)

- Delegates with valid exact `HoodOS.canExecute` permission may mint, approve, cancel or call Seaport `validate()` through `HoodWallet.execute`. This does **not** change NFT ownership, make the delegate the ERC-1271 signer or grant unlimited agent authority.
- A Seaport-prevalidated order with `signature: "0x"` can be enforceable **on-chain** even if its signature is not accepted by OpenSea's orderbook. This alone is not a public marketplace listing.
- As inspected for Robinhood, Net Bazaar `BazaarV2FlexibleFee` `0x000000058F3aDE587388DaF827174d0E6fC97595` has `minFeeBps=0` and presently allows one consideration item, thus **not** separate seller/creator royalty recipients. Its SDK filters prevalidated orders lacking EOA/ERC-1271-valid signatures. Do not strip royalties just to force a submission; report the exact blocker and preserve the royalty policy.
- Never tell a delegate to use the Hoodie owner's private key. A direct owner-signed flow through ListingOS is a different authorization path. Changes to signing permissions or Net Bazaar integration remain future work, not shipped features.

## Bankr-ready examples

- "List my 8x8portrait #3 from Hoodie #351 for 10 USDG, duration 1h, creator royalties ON." Verify ownership, discover presets, prepare, compare final signed order, approve only if needed, sign, ERC-1271-check, submit and confirm.
- "List this NFT from delegated Hoodie #5500." Verify delegation; **explain the owner-signature barrier** before promising OpenSea discovery. Agent can carry out authorized on-chain operations only; do not claim ERC-1271 signing works for delegated EOAs.
- "Cancel Hoodie #351's listing." Verify exact order and cancel on-chain, then check cancellation status.
