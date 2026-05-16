# Aegis.0G — Principal-Protected Shield Agent on 0G

**Deposit A-USDC. Pick any asset. If it goes up, you win. If it goes down, you get every dollar back. Powered end-to-end by the 0G stack.**

> 0G APAC Hackathon submission — Track 1 (Agentic Infrastructure & OpenClaw Lab) + Track 2 (Agentic Trading Arena / Verifiable Finance).

---

## One-sentence

An AI agent on 0G Compute (TEE-verified) recommends a hedge, 0G Storage holds the immutable agreement, and 0G Chain settles the principal-protected shield.

## What it does, in three lines

1. The user types a concern in natural language ("I'm worried about inflation eating my savings"). **0G Compute** picks the right asset to hedge, and the response is signed by a TEE enclave.
2. The user confirms a deposit. The agreement document is uploaded to **0G Storage**; the rootHash plus the user's parameters are recorded on-chain as a `Shield` struct in **`AegisVault`** on 0G Aristotle mainnet.
3. At maturity the user gets back **at minimum** their deposit, **plus** a yield-derived exposure payout if the asset moved in their favor. Principal is mathematically protected by a clamp in the contract.

## 0G integration (the four things that matter)

| Module | What we use it for | Where in the code |
|---|---|---|
| **0G Chain (Aristotle, `16661`)** | Hosts `AegisVault` + `AUSDC`. Shields live on-chain as a `Shield[]` mapping per user. **This is the mandatory mainnet contract address.** | `contracts/contracts/AegisVault.sol`, `contracts/contracts/AUSDC.sol` |
| **0G Compute (TeeML)** | AI shield recommendation. Every response is TEE-signed; signature is verified server-side via `broker.inference.processResponse`. The provider address + signature are stored on the Shield record so the recommendation that produced the trade is auditable. | `server/services/zeroGComputeService.js`, `server/routes/ai.js` |
| **0G Storage** | Immutable shield agreement docs (markdown + JSON envelope) via `MemData → Indexer.upload`. RootHash referenced both on-chain (`bytes32 storageRootHash` in the Shield struct) and in the mongoose record. | `server/services/zeroGStorageService.js`, `server/services/sponsorService.js` |
| **OpenClaw skill** | The existing OpenClaw skill manifest (`openclaw-skill/SKILL.md`) is repointed at the 0G-backed API — gives agentic clients (Claude, etc.) a one-line way to recommend + simulate a shield. | `openclaw-skill/SKILL.md` |

A health endpoint **`GET /api/sponsors/zerog`** returns the live status of all three integrations plus the NIM fallback path, so judges can verify each is wired and reachable.

### For agents — discovery

Any agent (Claude / Cursor / GPT / custom) can autodiscover Aegis with a couple of root-relative fetches. All paths below resolve against whatever host serves the dapp.

- **`/robots.txt`** — allow-all + sitemap + `X-OpenClaw-Skills` hint pointing at the skill index.
- **`/sitemap.xml`** — every public route + every skill markdown URL, prioritized for crawlers.
- **`/.well-known/ai-plugin.json`** — OpenAI plugin-compatible descriptor (bearer auth, OpenAPI URL, logo).
- **`/.well-known/aegis-skills.json`** — Aegis-native skill index: entrypoint + 5 strategies + agent-facing endpoints.
- **`/.well-known/openapi.yaml`** — minimal OpenAPI 3.0 spec for the 6 agent-facing endpoints.
- **`/api/skills/`** — same JSON shape as `aegis-skills.json`, generated live from `openclaw-skill/`. Canonical programmatic index.
- **`/api/skills/aegis.skill.md`** — markdown entrypoint skill (the one to fetch and follow). Strategy skills live at `/api/skills/strategies/<slug>.skill.md`.

## On-chain proof

### 0G Galileo Testnet (chain id `16602`) — verified end-to-end

- **AegisVault**: [`0x60403dd3CC683F65Db6dEb8597051aDc80506C3F`](https://chainscan-galileo.0g.ai/address/0x60403dd3CC683F65Db6dEb8597051aDc80506C3F) — deploy tx [`0x8458bf25…f9bf4505`](https://chainscan-galileo.0g.ai/tx/0x8458bf25e3f623688f2e3e59d21ade28254938499f47447886571d69f9bf4505)
- **AUSDC**: [`0xA3CD4843Fc8f2Af53fa4786b16F70c90BfecD2F2`](https://chainscan-galileo.0g.ai/address/0xA3CD4843Fc8f2Af53fa4786b16F70c90BfecD2F2) — deploy tx [`0x9185d0d7…43b06752`](https://chainscan-galileo.0g.ai/tx/0x9185d0d7d1ee9107dc956cf0a79cacc8c9d6b55f4df14d43ae38274f43b06752)
- **First `createShield` (smoke test)**: [`0x9383ad6d…57f7eb4`](https://chainscan-galileo.0g.ai/tx/0x9383ad6d9e1b6ebf7d73af5fb6f37f74788328f7c8cffec8804ccded157f7eb4) — emits `ShieldCreated(user=0x4523…15B5, idx=0, assetId=keccak256("gold"), deposit=100 A-USDC, duration=7,776,000s, entryPrice=$2050, rootHash=0x742c…cc38bd)`
- **Deployer / relayer**: `0x4523095f3d872dD51aAB5c6428b513AF645C15B5`

### 0G Aristotle Mainnet (chain id `16661`) — live, end-to-end verified

- **AegisVault**: [`0x60403dd3CC683F65Db6dEb8597051aDc80506C3F`](https://chainscan.0g.ai/address/0x60403dd3CC683F65Db6dEb8597051aDc80506C3F) . deploy tx [`0xd52ad1c0…56913f`](https://chainscan.0g.ai/tx/0xd52ad1c0095210a4814c9b9baa00ea7be16655a3e63b0996a11c87c47656913f)
- **AUSDC**: [`0xA3CD4843Fc8f2Af53fa4786b16F70c90BfecD2F2`](https://chainscan.0g.ai/address/0xA3CD4843Fc8f2Af53fa4786b16F70c90BfecD2F2) . deploy tx [`0x2a17704d…23dfffd`](https://chainscan.0g.ai/tx/0x2a17704d508b6304f1403a77b69c395aa5d05fae8c9c9407d1852bef823dfffd)
- **First `createShield` on mainnet**: [`0x5657bf84…85bc130`](https://chainscan.0g.ai/tx/0x5657bf84d44f3711d4620a7957c26bf1cecd7de84aedee7ed9d49432085bc130) emits `ShieldCreated(user=0x4523…15B5, idx=0, assetId=keccak256("gold"), deposit=100 A-USDC, duration=7,776,000s, entryPrice=$2050, rootHash=0x742c…cc38bd)`
- **Deployer / owner / relayer**: `0x4523095f3d872dD51aAB5c6428b513AF645C15B5`
- **Ownership controls**: `setRelayer(addr)` and `transferOwnership(addr) → acceptOwnership()` are on `AegisVault` so the relayer key can be rotated and ownership can be handed off without redeploy.

A full machine-readable `deployment.json` (testnet + mainnet under `networks.*`) lives at `contracts/deployment.json`.

## Architecture

```
Browser (Wagmi + RainbowKit)  ◀──── 0G Aristotle (16661) ──── AegisVault.sol + AUSDC.sol
        │                                                         ▲
        │  REST                                                   │ wagmi txs (approve, createShield)
        ▼                                                         │
Aegis API (server/, Express + Mongoose)
        │
        ├──▶ 0G Compute  (TeeML inference, verifiable)  ───▶  NIM fallback (silent)
        └──▶ 0G Storage  (MemData / Indexer.upload, rootHash on-chain)
```

Full walkthrough in [`docs/aegis-architecture.md`](docs/aegis-architecture.md).

## Tracks targeted

- **Track 1 — Agentic Infrastructure & OpenClaw Lab**: full OpenClaw skill manifest; an AI agent (Elsa) that orchestrates 0G Compute (inference) + 0G Storage (long-context memory / state persistence) + 0G Chain (settlement). The agent has a verifiable trail back to every recommendation it made.
- **Track 2 — Agentic Trading Arena (Verifiable Finance)**: every shield's AI recommendation is TEE-signed by 0G Compute. The signature, the provider address, and the model are persisted alongside the shield, so anyone can audit *why* the agent chose what it chose. This is the verifiable-finance angle applied to autonomous hedging.

## Repository layout

```
contracts/                    Hardhat workspace
  contracts/AegisVault.sol    Vault + Shield struct (on-chain core)
  contracts/AUSDC.sol         Test stablecoin with public faucet
  test/AegisVault.test.js     16 passing tests covering both surfaces
  scripts/deploy.js           Network-agnostic deploy → deployment.json
  hardhat.config.js           Networks: ogTestnet (16602), ogMainnet (16661), baseSepolia (legacy)

server/                       Express API
  services/
    zeroGStorageService.js    @0gfoundation/0g-ts-sdk upload + fetch
    zeroGComputeService.js    @0gfoundation/0g-compute-ts-sdk TeeML inference
    nimFallbackService.js     NVIDIA NIM /chat/completions fallback
    sponsorService.js         Storage provider precedence (0G → Fileverse → hash)
  engine/yieldShieldEngine.js prepareShield / persistShield / settleShield
  routes/
    ai.js                     POST /api/ai/recommend-shield
    yieldShield.js            POST /prepare, POST /activate, GET /doc/:rootHash
  server.js                   GET /api/sponsors/zerog

client/                       React 19 + Vite frontend
  src/config/wagmi.js         0G Aristotle + Galileo chain objects
  src/config/contracts.js     AUSDC_ABI + AEGIS_VAULT_ABI
  src/pages/YieldShieldPage.jsx  Full prepare → on-chain → activate flow + 0G badges

openclaw-skill/SKILL.md       Aegis.0G OpenClaw skill manifest

docs/aegis-architecture.md    System diagram + module map
docs/superpowers/specs/2026-05-16-aegis-0g-port-design.md  Build spec
```

## Local development

### Prerequisites

- Node 20+ (Compute SDK requires it).
- `corepack pnpm` (we use pnpm; if your npm is broken, run `corepack pnpm install` — no admin needed).
- MongoDB Atlas free tier or local `mongod`.

### One-time setup

```bash
# Contracts
cd contracts
corepack pnpm install
corepack pnpm exec hardhat compile   # or: pnpm compile

# Server
cd ../server
corepack pnpm install
cp .env.example .env                  # then fill in keys

# Client
cd ../client
corepack pnpm install
cp .env.example .env.production       # then fill in mainnet addresses after deploy
```

### Required env (server/.env)

```
# Mongo (Atlas free tier works)
MONGO_URI=

# 0G Chain
ZG_NETWORK=testnet                                          # or mainnet
ZG_TESTNET_RPC=https://evmrpc-testnet.0g.ai
ZG_MAINNET_RPC=https://evmrpc.0g.ai
RELAYER_PRIVATE_KEY=                                        # used for storage + compute funding too

# 0G Storage
ZG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
STORAGE_PROVIDER=zerog                                      # zerog | fileverse | hash

# 0G Compute (optional pinning)
ZG_COMPUTE_PROVIDER_PIN=
ZG_COMPUTE_MODEL_HINT=

# NIM fallback
NIM_API_KEY=
NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NIM_MODEL=meta/llama-3.3-70b-instruct

# Contract addresses (filled by deploy script)
VAULT_CONTRACT_ADDRESS=
USDC_ADDRESS=

# Frontend allowed origin
CLIENT_URL=http://localhost:5173
```

### Required env (client/.env)

```
VITE_NETWORK=testnet                                # or mainnet
VITE_ZG_TESTNET_RPC=https://evmrpc-testnet.0g.ai
VITE_ZG_MAINNET_RPC=https://evmrpc.0g.ai
VITE_EXPLORER_BASE=https://chainscan-galileo.0g.ai  # or chainscan.0g.ai for mainnet
VITE_AUSDC_ADDRESS=
VITE_AEGIS_VAULT_ADDRESS=
VITE_API_BASE_URL=http://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=
```

### Faucet (testnet)

- `https://faucet.0g.ai` — 0.1 0G/day per wallet.
- Chainlink faucet: `https://faucets.chain.link/0g-testnet-galileo`.
- Google Cloud Web3 faucet (if available).
- Run multiple wallets in parallel; consolidate into your deployer.

For mainnet, bridge 0G in (BEP-20 contract `0x4B948d64dE1F71fCd12fB586f4c776421a35b3eE`) or buy via supported CEX.

### Running

```bash
# Deploy contracts to 0G Testnet
cd contracts && corepack pnpm exec node node_modules/hardhat/internal/cli/bootstrap.js run scripts/deploy.js --network ogTestnet
# → outputs AUSDC + AegisVault addresses. Save into .env files.

# Start the API
cd ../server && corepack pnpm exec nodemon server.js

# Start the frontend
cd ../client && corepack pnpm dev
# Open http://localhost:5173
```

Smoke check the API:

```bash
curl http://localhost:3001/api/sponsors/zerog | jq
# Should show compute.initialized=true, storage.initialized=true, plus the
# active chain config and any NIM fallback availability.
```

### Mainnet deploy

```bash
# In contracts/
corepack pnpm exec node node_modules/hardhat/internal/cli/bootstrap.js run scripts/deploy.js --network ogMainnet
```

Update `server/.env` and `client/.env.production` with the printed addresses. Restart both apps.

## Demo flow (3-minute video script)

1. **Set up** — open the app, connect wallet to 0G Aristotle.
2. **Concern** — type "I'm worried about inflation eating my savings". Click "Get recommendation".
3. **TEE-verified recommendation** appears with a "0G Compute · TEE Verified ✓" badge. The agent picks gold.
4. **Configure** — pick $1000 deposit, 3 months duration. Show the projection scenarios.
5. **Activate** — confirm approve + createShield in MetaMask.
6. **Success screen** — three live badges:
   - **0G Chain** badge → click → opens chainscan.0g.ai tx page.
   - **0G Storage** badge → click → opens the agreement doc fetched back from 0G Storage by rootHash.
   - **0G Compute** badge → shows the TEE provider address and model.
7. **Health endpoint** — show `curl /api/sponsors/zerog` proving all three modules are live.
8. **OpenClaw skill** — open `openclaw-skill/SKILL.md` in an agentic client; ask "I'm worried about housing costs" and watch it call the same backend.

## Submission checklist

- [x] Project name: **Aegis.0G**
- [x] One-sentence description (≤ 30 words)
- [x] Public GitHub repo with meaningful commit history
- [ ] 0G mainnet contract address + chainscan link (filled at Block 6 deploy)
- [x] Architecture diagram (this README + `docs/aegis-architecture.md`)
- [x] 0G modules integrated: Chain + Storage + Compute (TeeML) + OpenClaw skill
- [x] Local deployment steps + faucet instructions
- [ ] Demo video (≤ 3 min, recorded post-build)
- [ ] X post tagging @0G_labs @0g_CN @0g_Eco @HackQuest_ with #0GHackathon #BuildOn0G
- [x] README in English

## Out of scope (declared)

The following live in the repo but are **not** part of the demo or this submission:

- Perp/trading routes (`server/routes/trade.js`, `MarketsPage`, `VaultPage`, `LeaderboardPage`).
- BitGo custody / WhatsApp / Twilio / Parcl live price feeds — kept as in-repo plumbing from the original PPN.fi project.
- Live yield rates from DeFiLlama — projections use deterministic constants for the demo, transparently. Documented in `docs/aegis-architecture.md`.
- ERC-7857 INFT (Agent ID) — designed but not deployed unless build time permits.

## Credits

Built on the existing PPN.fi / HedgeMyLife codebase; ported and rebranded to the 0G stack for the 0G APAC Hackathon.

---

*Aegis.0G — built with 0G Chain, 0G Storage, 0G Compute, and OpenClaw.*
