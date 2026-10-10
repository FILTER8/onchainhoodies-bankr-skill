# Bankr integration and publishing

## Install the skill in a Bankr agent

After the public repository contains `SKILL.md` at its root, tell your Bankr agent:

`install the skill at https://github.com/FILTER8/onchainhoodies-bankr-skill`

Bankr's documentation says it installs `SKILL.md` and supporting files from public repositories, per wallet/account. Reinstall from the same URL for updates. This **does not automatically publish the skill to every user of @bankrbot on X**.

Official reference: https://docs.bankr.bot/skills/in-bankr/from-github/

## Wallet transactions

- Obtain the **actual authenticated wallet address** from the Bankr host tools. Never hardcode the author's testing address.
- Native Bankr wallet operations, if available in the running agent, must be used to authorize `approve` and `activate` on Robinhood Chain chain ID 4663. A descriptive skill file does not guarantee such operations are supported through every Bankr client.
- Wallet API signing generally requires an API key with proper permissions. A user tagging @bankrbot on X is not equivalent to granting this skill raw Wallet API access.
- Do not ask for API secrets or private keys in a public conversation or save secrets to the repository.
- Never send approval or activation merely because a read-only inspection command was requested.

Docs: https://docs.bankr.bot/wallet-api/sign/ and https://docs.bankr.bot/skills/overview/

## Suggested acceptance tests

1. Install skill from public GitHub into a personal Bankr agent.
2. Ask "inspect OnChainHoodie 351" and verify owner/activation status with chain data.
3. Check incorrect owner path: it must refuse to activate.
4. Check already active path: it must refuse unnecessary spending.
5. Test explicit approval/activation authorization with a wallet holding sufficient OCH and ETH. Confirm no transaction is sent without the user's permission.
6. Test the @bankrbot X surface separately for installation/discovery and write permission.
