# HoodOS surfaces and integration boundaries (source: uploaded `hoodos/` pages, 2026-11-07)

These are **human website** workflows, not automatically agent-callable server APIs. Agents should reuse proven documented routes/contracts and current Bankr wallet tooling, not browser UI assumptions.

| Surface | Web route | Agent status / reference |
|---|---|---|
| HoodPage | `/hoodos/homepage` | Public API read/nonce/PUT supports owner and full/open delegate. [hoodpage.md](hoodpage.md) |
| ProfileOS | `/hoodos/profileos` | OpenSea name/bio/link/avatar/banner/username. ERC-1271 SIWE; server-side website routes must be audited. [profileos.md](profileos.md) |
| DelegateOS | `/hoodos/delegateos` | HoodDelegation owner grant/revoke; use exact deployed contract ABI and consider open delegation high risk. [delegation.md](delegation.md) |
| FloorOS | `/hoodos/flooros` | Protocol-funded buy to Treasury, OCH incentive; complete agent workflow. [flooros.md](flooros.md) |
| ListingOS | `/hoodos/listingos` | Seaport listings and ERC-1271 caveats, including current limits for delegated signers. [marketplace.md](marketplace.md) |
| BuyOS | `/hoodos/buyos` | Purchase NFTs with canonical HoodWallet; ETH and USDG routes supported in uploaded frontend; inspect fresh current server quote and approvals. [marketplace.md](marketplace.md) |
| MintOS | `/hoodos/mintos` | Generic collection minting: OpenSea resolver `/api/mintos/resolve`, contract-specific ABI/mint authorization, payable value. No blanket mint() assumption. |
| NET Mint | `/hoodos/netmint` | Collection directory in public API `/v1/netmint/collections`; mint via displayed contract-specific payment path, optionally transfer claimed token into HoodWallet. |
| HoodOS overview | `/hoodos` | Human app directory; do not assume its buttons imply agent-ready APIs. |

The public Worker source supplied in `src.zip` is **not** the Next.js `/api/*` website routes, so it cannot validate all OpenSea/Listings/BuyOS route schemas alone. Any funds-moving action requires fresh chain/quote preflight, simulation where possible, and the user's Bankr host confirmation.
