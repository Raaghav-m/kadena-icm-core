# Kadena Trial – Full-stack Example

This workspace shows an end-to-end dApp flow on a local Kadena **devnet**:

1. Generate / fund a development account.
2. Spin up a local Chainweb node in Docker.
3. Deploy a Pact contract (`helloWorld.pact`).  
   • ABI JSON is generated automatically (**script.ts**) and copied to the React app.
4. A Next.js frontend lists every function, lets you write / read messages.

---

## Prerequisites

* Node ≥ 18 (includes `corepack` / Yarn 1).  
* Docker (for the `chain` script).

```bash
corepack enable  # optional; ensures yarn is available
```

---

## Installation

```bash
yarn        # installs root dependencies (@kadena/*, ts-node …)
cd sample
yarn        # installs Next.js frontend deps
cd ..
```

---

## Scripts

| command | description |
|---------|-------------|
| `yarn chain` | Remove any existing `devnet` container and start a fresh Kadena devnet on <http://localhost:8080>. |
| `yarn dev-account` | Generates a keypair, creates an alias (see `.kadena/accounts/acc.yaml`) and funds it on the devnet. |
| `yarn deploy` | Interactive deploy of `helloWorld.pact`. Generates `helloWorld.json` and copies it to `sample/src/utils/`. |
| `yarn write-hi` | Example backend script – writes the message *hi* using `writeMessage.ts`. Override `--msg` to send something else. |
| `yarn read-msg --account <acct>` | Reads the current message for an account (uses `readMessage.ts`). |
| `cd sample && yarn dev` | Runs Next.js frontend on <http://localhost:3000>. |

---

## Typical Dev Flow

```bash
# 1. start the chain once
yarn chain &   # runs in another terminal

# 2. get a funded dev account (only needs to be done once)
yarn dev-account

# 3. deploy the contract
#    you can rerun this after every code change to helloWorld.pact
yarn deploy -f ./helloWorld.pact \
  --pub  <publicKey> \
  --priv <secretKey> \
  --sender k:<publicKey>  # uses the same key as gas payer

# 4. start the UI
yarn --cwd sample dev
```

The UI will list:

* **write-message** – requires `ACCOUNT-OWNER` capability.  
  Editing the *account* field in the header applies to all cards.
* **read-message** – simple local read.

Console shows:

```
[input] write-message arg 0 : k:<account>
[input] write-message arg 1 : hola
[call] write-message inputs: ["hola"] account: k:<account>
[result] { status:"success", … }
```

---

## How capability warnings work

* `script.ts` parses the Pact source, detects `with-capability`, and writes a `caps` array per function into `helloWorld.json`.
* `FunctionCard` displays `requires: …` and passes the list to `callContract`.
* `callContract` automatically attaches the required capabilities.

Update the contract ➜ redeploy ➜ refreshed ABI ➜ UI updates automatically.

---

## Clean up

```bash
yarn chain --stop   # or docker rm -f devnet
```

---

Happy building! 🚀 