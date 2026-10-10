# HoodJourney — Bankr integration

Network: Robinhood Chain, chain ID 4663.
HoodJourneyRegistry: `0x93513A0e4d0E016ccf296C4c2888b59c06708ea7`
HoodOS: `0x1993c5515E81d2768f7F8D8a1e6e38Bbf4e4beB9`

This reference is derived from `HoodJourneyRegistry(10).sol`, `HoodWallet(20261010-164556).sol`, and `HoodOS(20261010-164556).sol`. Confirm deployed implementations before funds-moving transactions.

## Read milestones

- `GET https://api.onchainhoodies.xyz/v1/journey/milestones`: milestone definitions and IDs; do not invent IDs.
- `GET https://api.onchainhoodies.xyz/v1/token/{tokenId}/journey`: indexed historical milestone status (may lag).
- `GET https://api.onchainhoodies.xyz/v1/journey/integrations`: available integrations.
- On chain: `journeySummary(uint256)` and `journeyMilestone(uint256,bytes32)`; the latter includes completion count, `maxCompletions`, `milestoneActive`, `selfCheckIn`, and `verifiableNow`. Prefer fresh chain status before a write.

## Execute milestone through the Hoodie, not the EOA

The registry's `checkIn` and `verifyAndRecord` call `_requireActiveHoodWallet`, which explicitly checks `msg.sender == HoodOS.walletOf(tokenId)` and that the Hoodie is active. Therefore an EOA calling the Journey registry directly REVERTS. The Bankr wallet must call the actual Hoodie token-bound account's `execute`, causing the registry to receive a call from the HoodWallet.

ABI fragments:

```solidity
// HoodWallet (ERC-6551)
function execute(address target, uint256 value, bytes calldata data, uint8 operation) external payable returns (bytes memory);
// HoodJourneyRegistry
function checkIn(uint256 tokenId, bytes32 milestoneId) external;
function verifyAndRecord(uint256 tokenId, bytes32 milestoneId) external;
function journeyMilestone(uint256 tokenId, bytes32 milestoneId) external view returns (tuple);
function journeySummary(uint256 tokenId) external view returns (tuple);
// HoodOS
function canExecute(address account, uint256 tokenId, address caller, address target, uint256 value, bytes calldata data, uint8 operation) external view returns (bool);
function walletOf(uint256 tokenId) external view returns (address);
function isActive(uint256 tokenId) external view returns (bool);
```

Construct `innerData = ABI.encodeFunctionData('verifyAndRecord', [tokenId, milestoneId])` only if the milestone actually has configured verification and passes its live state check. For self-check-in-enabled milestones construct `innerData = ABI.encodeFunctionData('checkIn', [tokenId, milestoneId])` only when the user's intended action qualifies. Never claim that check-in by itself proves an external achievement.

Then construct the **outer transaction**:

```
from: Bankr-authenticated signer who owns the NFT or has a specific active HoodOS delegation
to: HoodOS.walletOf(tokenId)
value: 0
data: ABI.encodeFunctionData('execute', [JOURNEY_REGISTRY, 0, innerData, 0])
```

`operation=0` is CALL; no delegatecall or ETH transfer. `HoodWallet.execute` calls `HoodOS.canExecute` with the actual target, calldata and caller. Owner has authority only while active. For an independent agent signer, require a **separately configured, enabled HoodOS delegation** granting the narrow target/function; never treat a social account, API key or skill installation as delegation. The current owner can submit via Bankr's wallet tool without needing delegation when Bankr's signer is that owner.

Safety checks: fresh `ownerOf`, `isActive`, `walletOf`, milestone ID and active/maxed status, `canExecute(...)`, simulate the *outer* call as the real signer using `eth_call`, then follow Bankr's required approval/sign/submit workflow. Wait for confirmed receipt and confirm on-chain milestone completion. Do not auto-claim every milestone. Do not repeat transaction after ambiguous receipt without checking chain state first. Bankr may lack support for nested ABI transactions in some surfaces; if so explain the limitation rather than pretending completion.

Note: Hoodie activation is an NFT-owner transaction to HoodOS; Journey recording is a HoodWallet transaction. These are different transaction paths.
