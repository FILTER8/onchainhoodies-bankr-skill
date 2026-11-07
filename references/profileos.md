# ProfileOS: Hoodie-owned OpenSea profile (website integration; Bankr verification pending)

**Human interface:** `https://onchainhoodies.xyz/hoodos/profileos`. This is a distinct **OpenSea account profile owned by the canonical HoodWallet**; it is not the off-chain HoodPage website. Based on uploaded `hoodos/profileos/page.tsx` (2026-11-07), do not treat these as the same publisher.

## Currently implemented in the frontend

1. Select a Hoodie, resolve its canonical HoodWallet through HoodOS and confirm activation and current authority.
2. `GET https://onchainhoodies.xyz/api/profileos/verify?wallet={HoodWallet}` reads profile information (`displayName`, `bio`, `externalUrl`, `username`, `profileImageUrl`, `bannerImageUrl`).
3. `POST https://onchainhoodies.xyz/api/profileos/nonce` with `{}` gets a sign-in nonce.
4. Construct the OpenSea SIWE-style message **exactly as the frontend does**: domain `opensea.io`, URI `https://opensea.io`, chain 4663, nonce, issued-at timestamp, and the **canonical HoodWallet** as the address. It contains an OpenSea Terms/Privacy acceptance statement. The EOA signs the text with its wallet.
5. Verify `HoodWallet.isValidSignature(hashMessage(message),signature) == 0x1626ba7e` (ERC-1271). A contract-wallet signature must be accepted by the canonical HoodWallet. For an agent-owned Hoodie, the owner EOA signature may pass; **do not presume that full open delegation also makes a delegate's SIWE signature valid under ERC-1271**. This is separate from HoodOS.canExecute and must be verified live.
6. `POST https://onchainhoodies.xyz/api/profileos/verify` includes `{message,signature,wallet,hoodieId,action,username,displayName,bio,externalUrl,imageData,bannerData}`. Actions from frontend: `claim` username; `save` profile. `imageData` and `bannerData` are base64 PNG data URLs; the frontend can generate art from the Hoodie SVG and compose a banner with Hood Talk and manual pixel strokes. Read back with GET.

## Critical limitation

Only the **frontend page** was supplied; `/api/profileos/nonce`, `/api/profileos/verify`, and `/api/profileos/artwork` server route files were **not** supplied. Their validation/side effects, payload limits, OpenSea compatibility, and delegated-owner policy remain **unverified**. This reference is a source-derived description, **not an authorization to auto-call undocumented endpoints**. Before enabling automated Bankr profile edits or username claims: obtain and inspect those actual backend routes, confirm OpenSea current requirements, test a real owner-signed SIWE challenge, then separately test delegated EOA ERC-1271 acceptance. Until verified, guide the user to the human ProfileOS UI; never assert successful OpenSea profile edits from mere frontend code. Do not sign a terms-of-service acceptance without explicit user instruction and wallet confirmation.
