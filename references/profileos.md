# ProfileOS: agent-owned Hoodie OpenSea profile updates

**Website:** `https://onchainhoodies.xyz/hoodos/profileos`  
**Website API host:** `https://onchainhoodies.xyz` (NOT `api.onchainhoodies.xyz`)  
**Sources:** inspected `hoodos/profileos/page.tsx` plus Next.js `profileos/nonce`, `profileos/artwork` and `profileos/verify` server routes (2026-11-07). An agent-owned Hoodie #1574 successfully saved its text profile and verified a public read-back; avatar and banner uploads are supported in the backend but still require live agent testing.

## Important: attempt owner-wallet operation; do not reflexively refuse

When an authenticated Bankr wallet **directly owns** an activated Hoodie (for example, Hoodie #1574), the existing frontend describes a candidate automated path. The previous blanket instruction "automated ProfileOS is unverified, use the website" was too restrictive. **Try the documented preflight, with owner approval for signing the terms-bearing message,** if Bankr has authenticated HTTP and wallet-signing tools. A missing capability or server/API rejection is a concrete blocker to report, not a reason to skip attempting the safe preflight.

**Do not conflate direct ownership with delegation:** `HoodOS.canExecute` is NOT ERC-1271 authorization. A delegate must independently pass HoodWallet `isValidSignature` for this exact message or stop. Do not use another wallet's signature.

## Owner-controlled step-by-step workflow

1. Resolve authenticated **Bankr EOA** with the supported Bankr wallet tools (never assume that an X handle is the signing wallet). On Robinhood Chain **4663**, use `HoodOS.hoodInfo(tokenId)` to retrieve canonical `wallet`, `owner`, `active`, `walletDeployed`. Require active and deployed. Require `owner == authenticated Bankr signer` for the direct-owner path.
2. Read `GET https://onchainhoodies.xyz/api/profileos/verify?wallet=<canonical HoodWallet address>` for current OpenSea profile; capture the returned `exists`, `username`, `displayName`, `bio`, `externalUrl`, `profileImageUrl`, `bannerImageUrl` when `ok`. A GET failure is a useful diagnostic. Profile address is the **HoodWallet**, not Bankr EOA.
3. Use **the existing ProfileOS page's shared identity convention** for a newly created profile: `displayName = OnchainHoodie_<tokenId>` and suggested `username = OnchainHoodie_<tokenId>` (the exact capitalization in the frontend). The OpenSea username must be available and may be normalized or assigned differently: **never assume save claimed it**. The profile URL default in the inspected page is `https://onchainhoodies.xyz/hoodies/<tokenId>` (plural `/hoodies/`, never singular `/hoodie/`). Read back actual username; request user confirmation before a separate `action: "claim"` if needed. Preserve any existing OpenSea name/username unless the user requested a change. `displayName` regex `^[A-Za-z0-9_-]{1,50}$`; `username` same; `bio` <=500 characters; `externalUrl` is an HTTP/HTTPS URL. Preserve existing fields and media unless instructed to change them. `action: "save"` changes profile; `action: "claim"` claims username. Do not assume both operations happen in one action.
4. **OpenSea terms / privacy consent:** the SIWE message says it accepts OpenSea Terms of Service and Privacy Policy. Do not sign it without explicit user authorization to accept those terms for this Hoodie and action. A generic request to inspect feasibility does not grant acceptance. If the host has a confirmation/approval flow, show the exact challenge text and let it enforce approval. If the user has explicitly instructed the profile change and authorized terms acceptance, proceed subject to the wallet host's normal confirmation. Never silently agree to legal terms on behalf of a user.
5. Request `POST https://onchainhoodies.xyz/api/profileos/nonce` with JSON `{}` and `Content-Type: application/json`. Expect `{ok:true,nonce:string}`; take only the fresh nonce. Generate an ISO-8601 UTC `Issued At` timestamp. Construct the SIWE message **exactly**, with `wallet` = canonical HoodWallet:

```text
opensea.io wants you to sign in with your Ethereum account:
<canonical-HoodWallet>

Click to sign in and accept the Platform Terms of Service (https://opensea.io/tos) and Privacy Policy (https://opensea.io/privacy).

URI: https://opensea.io
Version: 1
Chain ID: 4663
Nonce: <nonce-from-API>
Issued At: <ISO-8601-UTC-now>
```

6. Ask the authenticated Bankr owner EOA to perform **EIP-191 `personal_sign` / `signMessage`** of this exact UTF-8 message through the supported host signer. **Do not hash the message before `personal_sign`.** For ERC-1271 call `HoodWallet.isValidSignature(hashMessage(message), signature)` as a *read-only contract call*. `hashMessage` is the EIP-191 prefixed message hash. Require exact magic `0x1626ba7e` before submitting. If Bankr lacks arbitrary-text message signing, stop and report that precise limitation; do not solicit keys or substitute a transaction signature.
7. For `action="save"`, send `POST https://onchainhoodies.xyz/api/profileos/verify` with JSON:

```json
{
  "message": "<the exact SIWE string>",
  "signature": "<the Bankr EOA personal_sign result>",
  "wallet": "<canonical HoodWallet>",
  "hoodieId": "1574",
  "action": "save",
  "username": "<requested or existing username>",
  "displayName": "<requested or existing name>",
  "bio": "<requested or existing bio>",
  "externalUrl": "<requested or existing URL>",
  "imageData": "",
  "bannerData": ""
}
```

`imageData`/`bannerData` are PNG `data:image/png;base64,...` values when updating images. The server does **not** accept a URL in place of image bytes. The frontend builds Hoodie art through `/api/profileos/artwork?tokenId=<id>` and browser canvas. Each image must be a genuine PNG, **<= 2,000,000 decoded bytes**, with the encoded data URL **<= 2,800,000 characters**. The server uploads media via OpenSea image-context/storage endpoints, then supplies the returned upload token to `profile/save`. Empty media fields mean **do not change existing media**. For avatar/banner creation follow `references/profileos-media.md`. For `action="claim"`, retain the same request shape and the exact confirmed username; use `"action":"claim"`.
8. Treat `ok:false`, HTTP error, an error `stage`, or lack of expected side effects as **failure**. Record the returned `error`, `details`, `stage`, `status`, `readBackMatches`. Upon `ok:true`, **read back** with the same GET and compare requested changes. When available, check `https://opensea.io/<claimed-username>` or `https://opensea.io/<canonical HoodWallet>`. Do not announce success until read-back confirms it.

## Default bio: latest Hood Talk, not an invented description

For a **new** OpenSea profile, fetch the latest on-chain Hood Talk from `GET https://api.onchainhoodies.xyz/v1/token/<tokenId>/hood-talk` and use `current.quote` as the proposed `bio` (truncate at 500 characters). If the current endpoint is unavailable, use `GET /v1/token/<id>/hood-talk/history` and select the newest by `count`/`sequence` (do not select the oldest entry). If there is no Hood Talk, leave the bio empty or ask what text the user wants—never manufacture a quote. A blank quote is not a successful fetch.

**For an existing profile, preserve its saved bio by default.** Do not overwrite an existing bio merely because a newer Hood Talk exists. A request such as "set my latest Hood Talk as my bio" explicitly authorizes that change. Present the exact fetched quote to the user before signing an OpenSea terms-bearing update if the user has not already approved that content. For a new profile, the default quote is a proposal, not an automatically scheduled update; no background syncing is implied.

## Image and banner policy

- For a new profile, propose its **actual on-chain Hoodie artwork** as the avatar (20x20 pixel art scaled to 512x512 by nearest-neighbor interpolation). Do not use invented generative artwork or an arbitrary image search result. Retrieve `https://onchainhoodies.xyz/api/profileos/artwork?tokenId=<id>` (SVG), render it on a black 512x512 canvas and encode PNG data URL. The server rejects non-PNG data.
- The **banner** is an optional 1200x300 PNG, strictly black `#000000` and Robin green `#CCFF00`. The site editor's template centers the selected Hood Talk in a middle width of about 610px to accommodate the mobile crop. You may reproduce that template using a PNG rendering tool, keeping text away from edges. Banner text should be the approved/latest Hood Talk; default to the same bio quote as selected above.
- Do not send huge base64 strings in natural-language chats. Build them within the authenticated agent's HTTP tool/script context. If no media rendering or binary upload support exists, finish the text update and report media as a specific untested capability, **not** as a success.
- For an established account: by default omit both image fields (empty strings) to preserve its avatar/banner. Ask for approval before replacing visible artwork. When media is submitted, read back `profileImageUrl` and `bannerImageUrl`, and check both URLs if possible. `profileUpdated:true` alone does not prove both media assets propagated.

## Boundaries / verification status

- **Verified owner EOA text profile save:** Hoodie #1574 passed nonce, signed OpenSea SIWE, HoodWallet ERC-1271 (`0x1626ba7e`), profile update (`HTTP 200`), and read-back. **Artwork and banner are not yet confirmed in live agent execution.** Backend routes support both PNG fields; recheck public media URLs after attempting them.
- This workflow works at most to the extent Bankr exposes authenticated HTTP requests, EIP-191 signing, ERC-1271 read calls and host confirmations. **Try preflight and show concrete diagnostics.** Do not manufacture or bypass Bankr signing methods or transfer owner keys.
- OpenSea terms text must stay exact; don't replace domain, wallet, nonce, chain, timestamp, or statement to trick verification. Never automate signing legal agreements without user approval.
- A successful owner EOA ERC-1271 check is a required precondition, **not proof** OpenSea accepted any new update.
- For agents using **delegation** rather than direct NFT ownership, stop at the ERC-1271 validation unless their signature genuinely passes and server policy permits it; do not assume delegated signatures work.
- All profile updates are **off-chain OpenSea operations**. No HoodWallet `execute()` call is required by the inspected frontend for a direct-owner profile save.

## Useful Bankr test prompt

"Use your own wallet that currently owns Hoodie #1574. Read the canonical HoodWallet and existing OpenSea profile. Check whether you can request the ProfileOS nonce and sign the exact SIWE message via your authenticated wallet. Before accepting OpenSea's Terms and Privacy Policy, obtain my approval. If the signature passes the HoodWallet ERC-1271 check, save only the display name/bio I specify (preserve artwork), read the profile back, and report the precise API errors if anything fails. Do not substitute delegated authority."
