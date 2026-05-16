# Aegis.0G — 3-minute demo storyboard

This is what to record. The Playwright capture (`tests-e2e/recordings/aegis-demo-<timestamp>.webm`) gives you the UI motion track. Record your screen, drive MetaMask yourself, and use this storyboard for narration timing.

**Real on-chain artifacts from the most recent live mainnet run** (always re-run `node tests-e2e/mainnet-flow.js` to refresh):

- User wallet: `0x4523095f3d872dD51aAB5c6428b513AF645C15B5`
- Chain: 0G Aristotle mainnet (`16661`)
- AegisVault: `0x60403dd3CC683F65Db6dEb8597051aDc80506C3F`
- AUSDC:      `0xA3CD4843Fc8f2Af53fa4786b16F70c90BfecD2F2`
- Mainnet `createShield` tx (idx=1, $50 gold): https://chainscan.0g.ai/tx/0xe4e019e973aa278c8dd9bec12e0d1eb7c0b69f2acb4cc8f0ab65a4811ddc2693
- Mainnet `createShield` tx (idx=0, $100 gold smoke): https://chainscan.0g.ai/tx/0x5657bf84d44f3711d4620a7957c26bf1cecd7de84aedee7ed9d49432085bc130
- 0G Storage rootHash (latest shield): `0x904c2699447452de2c2deb422f9f9f59cc0ddf171e782e5ec71ffacd712cc723`
- Doc fetch URL: `http://localhost:3001/api/yield-shield/doc/0x904c2699447452de2c2deb422f9f9f59cc0ddf171e782e5ec71ffacd712cc723`

---

## Recommended recording setup

- OBS / QuickTime / Loom, 1920×1080.
- Chrome at 100% zoom, MetaMask extension visible.
- Two screens or a split-view: the dapp + one of {chainscan.0g.ai, terminal showing the curl commands}. The cross-reference makes the on-chain proof feel real.
- A short opening title card with the project name + 0G Hackathon (3 seconds at the start).

## Beat-by-beat (target 2:50, hard cap 3:00)

### 00:00 . 00:10 — Title + one-line claim
Static title card: "Aegis.0G . Verifiable hedging for autonomous agents".

> "Aegis.0G is a principal-protected shield product on 0G Chain. Any agent can call it on a user's behalf with a session key. Every recommendation is TEE-signed by 0G Compute. Every shield doc is stored on 0G Storage. Settled on 0G mainnet."

### 00:10 . 00:35 — Landing page scroll
Open `https://<deploy-url>/`. Scroll smoothly from hero to "Stack" to "Is / Isn't" to activity feed.

> "The product is built for agents first. The hero shows the actual API call. Below it we ledger out the trail: session key, TEE attestation, on-chain shield tx, 0G Storage CID."

Pause briefly on each section. ~5 seconds each.

### 00:35 . 00:55 — Connect wallet (MetaMask popup)
Click "Launch App" → land on Shield page → click **Connect Wallet** in the top right.
- MetaMask popup appears asking to connect.
- Approve.
- Switch chain prompt → approve.

> "Connecting on 0G Aristotle mainnet, chain ID 16661. Real money."

### 00:55 . 01:20 — Create a session key (MetaMask sign)
Navigate to **My Agents** (top nav). Click **+ Create key**.
- Enter label "Demo agent".
- Click "Sign + create".
- MetaMask shows a "Sign message" popup with the nonce string.
- Approve.
- The reveal-once modal appears showing the raw `aegis_sk_…` key. Pretend to copy it.

> "Session keys are wallet-derived. The user signs once. The agent never sees the user's wallet private key. The user can revoke at any time."

### 01:20 . 02:00 — Agent recommends + activates a shield
Navigate to **Shield**. Type into the concern box:
> "I'm worried about gold price volatility for my retirement savings."

Click **Get recommendation**. The card appears showing:
- Asset: **Gold**
- Provider used: `nim` (or `zerog` if Compute ledger is funded)
- TEE verified: badge

> "0G Compute serves the inference. If the TEE ledger isn't funded we drop to a NIM fallback transparently, but the API path proves the integration."

Click **Activate** → enter $50 → confirm. MetaMask popups in order:
1. **A-USDC.faucet** (only if balance < $50) — approve
2. **A-USDC.approve** — approve
3. **AegisVault.createShield** — approve

> "Three signatures, no custody. The agent has its own wallet for these but I'm signing here so you can see the popups."

Success screen appears with three live badges:
- **0G Chain** → click → chainscan.0g.ai tx page opens in a new tab
- **0G Storage** → click → markdown of the agreement doc fetched back from rootHash
- **0G Compute · TEE** → shows provider address + model

### 02:00 . 02:30 — Trade page with the live agent feed
Navigate to **Assets** → click **Gold**. The asset detail page loads:
- TradingView chart on top (real-time gold price)
- "Your agents on Gold" panel below

The shield we just created shows up in the table: `inflation-hedger · gpt-4o · $50.00 invested · current value · 1 minute ago`.

> "Every agent that touched this asset for this wallet, scoped by session key. Click any row for the full action timeline."

### 02:30 . 02:50 — Leaderboard + skill discovery URL
Navigate to **Leaderboard**. Show the row.

> "Real-time PnL across all shields. Mark-to-market against the live price feed."

Bottom of screen: small browser nav to `chainscan.0g.ai/address/0x60403dd3CC683F65Db6dEb8597051aDc80506C3F` showing the vault contract with the txs.

### 02:50 . 03:00 — Outro
Title card: contract addresses + skill index URL.

> "Mainnet contracts and the OpenClaw skill manifest at `/.well-known/aegis-skills.json`. Any agent can autodiscover and start calling. Aegis.0G."

---

## Recording tips

- **Slow down** the cursor; viewers need to follow MetaMask popups.
- **Read MetaMask popup contents aloud** for the first popup (gives credibility). Skip-narrate the rest.
- **Cut idle waits** in post — the on-chain confirmation can take 5-20 seconds. Speed-ramp 2x or cut.
- **Keep MetaMask zoomed in** if your screen is high-DPI — the popups can look tiny.
- **Avoid showing the seed phrase / private key** anywhere. The reveal-once `aegis_sk_…` modal is fine to show (it's a session token), but don't show your wallet PK.

## If you want to skip recording yourself

The Playwright `.webm` at `tests-e2e/recordings/aegis-demo-*.webm` already captures most of the non-MetaMask portion (landing, shield page, trade page, leaderboard). It's mute and ~5 MB. You can:

1. Convert it: `ffmpeg -i aegis-demo-*.webm -c:v libx264 -crf 23 -preset slow aegis-demo.mp4`
2. Add a voiceover on top using QuickTime / Audacity.
3. Add MetaMask popup screen recordings as overlay clips at the right timestamps (use the beats above as anchors).

This is faster than recording end-to-end but loses the "see real MetaMask popups" credibility — which is the part judges value most for an agent + on-chain product. Recommend you spend the extra 15 minutes for a full recording.
