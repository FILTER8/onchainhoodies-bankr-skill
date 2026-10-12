# HoodOS delegation — Bankr workflow (v0.5)

**Chain:** Robinhood Chain mainnet **4663**. **HoodDelegation:** `0x2C3046462bd09890C14c8A465ae4eDC41515A0c6`. **HoodOS:** `0x1993c5515E81d2768f7F8D8a1e6e38Bbf4e4beB9`. **NFT:** `0x9Ec6C5b9f572A9B02138E553BC5F5882Da735F45`.

Public indexed read endpoint: `GET https://api.onchainhoodies.xyz/v1/token/{tokenId}/delegations`; historical events: `/v1/token/{tokenId}/delegations/history`. API is useful for discovery but may lag and is **not transaction authorization**. A token may have an official HoodWallet plus unrelated ERC-6551 accounts. Delegation here applies **only to the canonical HoodOS HoodWallet**.

## Authorization checks for an actual transaction

1. Resolve the Bankr **signing EOA from the active Bankr session** and confirm chain ID 4663. It may differ from `ownerOf(tokenId)`.
2. Read `ownerOf(tokenId)`, `walletOf(tokenId)`, `isActive(tokenId)`, code at `walletOf(tokenId)`, and active delegation status. Verify HoodOS delegation is enabled/configured on chain. Transfer of the NFT may invalidate grants and reset activation.
3. Encode the real target call. Read or simulate the exact policy predicate before submission:

```solidity
function canExecute(address account, uint256 tokenId, address caller, address target, uint256 value, bytes calldata data, uint8 operation) external view returns (bool);
function execute(address target, uint256 value, bytes calldata data, uint8 operation) external payable returns (bytes memory);
```

`account` must be `HoodOS.walletOf(tokenId)`; `caller` must be the authenticated Bankr signer; `operation` is **0 (CALL)**. Other operations are unsupported. A general capability status alone does not prove authorization for a particular value/target/calldata.
4. Check target-specific prerequisites and exact payment value. For a payable contract mint, the **HoodWallet must already hold enough ETH**; the outer EOA pays gas. Don't equate the Bankr EOA's ETH balance with the HoodWallet's balance. Simulate the outer `execute` from the delegate EOA with actual calldata.
5. Follow Bankr host signing/spending confirmation. On receipt success verify contract state and NFT `ownerOf` / balances. Do not retry without checking whether an uncertain transaction already executed.

## Owner-granted capabilities

From supplied `HoodDelegation.sol` (validate against live bytecode before first write):

```solidity
function grantOpenCapability(uint256 tokenId, address delegate, uint256 maxNativeValue, uint64 expiresAt) external;
function revokeOpenCapability(uint256 tokenId, address delegate) external;
function getOpenCapability(uint256 tokenId, address owner, address delegate) external view returns (bool active, uint64 expiresAt, uint256 maxNativeValue);
function grantTargetCapability(uint256 tokenId, address delegate, address target, uint256 maxNativeValue, uint64 expiresAt) external;
function grantSelectorCapability(uint256 tokenId, address delegate, address target, bytes4 selector, uint256 maxNativeValue, uint64 expiresAt) external;
function grantExactCapability(uint256 tokenId, address delegate, address target, bytes calldata data, uint256 maxNativeValue, uint64 expiresAt) external;
```

Grant and revoke are **owner-only**, not agent-self-service. Expiry is a Unix timestamp (`uint64`); zero means no expiry. Capabilities are owner-bound and cease to apply after an NFT transfer. Scopes: `exact` (exact calldata), `selector` (one target/function, arbitrary args), `target` (all calls to target), `open` (all targets/call data). The contract also exposes matching `revokeExactCapability`, `revokeSelectorCapability`, and `revokeTargetCapability`. Do not guess their signatures: inspect verified ABI when needed.

**High risk:** `maxNativeValue` limits native ETH value **per execution** only. It does **not** limit ERC-20 transfers, NFT transfers, ERC-20 approvals, future allowance use by targets, or number of calls. Even zero native ETH does not prevent draining tokens. Open delegation permits broad asset control while active. Prefer limited scope/duration, simulate, and consider revocation after a task.

## Demonstrated Robinhood mainnet workflows (reported and transaction-identifiable)

- **Hoodie #336** is owned by `0xbDd13098b4f756Eca18C41250d71af9aD8D6c1c5`; its official HoodWallet is `0xa8adc63795c856feb8c8cd8a8fd2d0d406ab20f0`. A distinct Bankr EOA, `0xb316e8ea7bc9b24ea5fd4ebd07051678c27ffe79`, was granted temporary OPEN delegation (reported expiry 2026-10-18 11:51:31 UTC). **These are historical test addresses, never use as user defaults.**
- Harmless delegated self-call: transaction `0x0a801f22d9b24459e4fa84f9495dec41d2b1c40eaee870578984bef988af30aa`; HoodWallet `state()` reportedly changed 66 → 67.
- 64 Faces delegated mint: collection `0xc8e36ae47246e5943da2b228fbaff1fb27a473b0`, `mint(uint256 amount)` with amount 1 and wallet-funded `0.001 ETH`, transaction `0x39949cd2c2c2119635a6f7d9606b3d30fded7066f592f9ebb6631af9e55f5ba9`; resulting NFT **#205** reportedly owned by the Hoodie #336 HoodWallet. Before wallet funding, the Bankr preflight **correctly stopped** at a 0 ETH wallet balance. Verify state live instead of treating past results as ongoing permission.

For a new user: identify their intended Hoodie, **their own delegate signer**, specific operation and spending authorization. Never assume Bankr's published X account maps to a fixed wallet or automatically has delegation.
