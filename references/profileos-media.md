# ProfileOS avatar and banner media (owner or ERC-1271-valid signer)

Read `references/profileos.md` first. Both media fields are optional `data:image/png;base64,...` strings inside the JSON `action: "save"` body; this is **not** a multipart upload and it is **not** an image URL.

## Avatar: canonical Hoodie artwork

1. GET `https://onchainhoodies.xyz/api/profileos/artwork?tokenId=<tokenId>`; require HTTP 200 and actual SVG, not a JSON error.
2. Render the **exact SVG** on opaque black at 512x512 PNG, with nearest-neighbor resampling so 1-bit pixels remain crisp. Use a browser canvas or a local image renderer available to the agent. Do not invent an avatar.
3. Validate PNG signature `89504e470d0a1a0a`, file size <= 2,000,000 bytes, data URL length <= 2,800,000. Set `imageData` to the complete `data:image/png;base64,...` string.
4. Preserve existing profile picture by using `imageData: ""` unless the user actually wants to change it.

## Banner: ProfileOS 1200×300 black/Robin-green template

The site default is 1200×300 pixels, black `#000000` and green `#CCFF00` (optionally inverted). Center the quote inside approximately 610px width in the middle so mobile's narrow crop retains the words. Render a suitable pixel/monospace font. Wrap lines; shrink font or truncate responsibly instead of clipping. The site lets humans draw over this banner; agents may produce a standard banner from the latest approved Hood Talk without duplicating that drawing UI.

Fetch the latest quote from `GET https://api.onchainhoodies.xyz/v1/token/<id>/hood-talk` -> `current.quote`. Require non-empty text. Limit bio to <=500 chars; banner text may need additional wrapping. Render real PNG and send complete `bannerData` data URL, or `""` to preserve the existing banner. Never silently replace a custom banner.

## Backend and read-back

Existing API `POST https://onchainhoodies.xyz/api/profileos/verify` with `action: "save"` validates PNG and gets upload contexts for `profile_picture` and `banner_image` via OpenSea. It uploads bytes, then saves `profileImageToken`/`bannerImageToken`. Check returned `stage` and `status` on failures; a failed upload must not be presented as a completed update. Re-read `GET /api/profileos/verify?wallet=<canonical TBA>`, compare media URLs before and after, and inspect OpenSea profile where possible. OpenSea may be delayed; report unverified media plainly.

The user's approval to accept OpenSea Terms and Privacy SIWE must be given before signing, even if the agent owns the Hoodie. Do not dump signed messages, nonce, or large base64 into a public channel.
