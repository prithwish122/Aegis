# Recording the demo with real MetaMask popups

The pure-Playwright recording with the mock provider lives at
`tests-e2e/recordings/aegis-demo-2026-05-16T15-21-14-326Z.mp4`. It does not
show real MetaMask popups, which is the part judges most want to see.

We tried **Synpress v4** and **dappwright**; both have known issues on
Windows (Synpress explicitly aborts; selectors drifted on MetaMask 13.13.1).

The pragmatic recipe: **Playwright drives the deterministic browser flow,
you click Approve in MetaMask when prompted, the recording captures
everything in one take.** Real popups, no flaky automation.

## Prerequisites

- API on `http://127.0.0.1:3001` and Vite on `http://127.0.0.1:5173` running.
- `tests-e2e/.cache-synpress/metamask-chrome-13.13.1/` exists (it does — the
  earlier Synpress run downloaded it).
- A wallet you want to use, with mainnet 0G + some A-USDC. The funded test
  wallet from earlier works: PK `6542f243…2d9423`, address `0xCD2bec…7857`.

## One-time setup (~60 seconds)

```
cd C:/Users/apbar/codeFiles/ppn.fi/tests-e2e
node record-real-mm.js setup
```

A Chromium window opens with MetaMask pre-loaded. In the MetaMask side panel:

1. Accept terms → "Import an existing wallet".
2. Either use the test seed `test test test test test test test test test test test junk` and then add an account via private key (`Account menu → Add account → Import account → private key`), pasting `6542f24354453c21f9a0731e638fb43aac0983bc1586bc5b32bc4566df2d9423` — OR enter a 12-word recovery phrase you control if you prefer.
3. Add the 0G Aristotle network:
   - Network name: `0G Aristotle`
   - RPC URL: `https://evmrpc.0g.ai`
   - Chain ID: `16661`
   - Symbol: `0G`
   - Explorer: `https://chainscan.0g.ai`
4. Switch to the 0G Aristotle network.
5. Back in the terminal, press **Ctrl+C** to save and exit.

The profile lives in `tests-e2e/.mm-profile/`. Delete that directory to start over.

## Recording run (~3 minutes, your hand at the keyboard)

```
node record-real-mm.js record
```

What the script does:

1. Opens the saved profile (wallet already imported, network already added).
2. Navigates and scrolls through the landing page.
3. Goes to `/app/shield`, clicks Connect Wallet, picks MetaMask in RainbowKit.
4. **Banner appears at the bottom of the page:** "👉 Pick MetaMask in the modal, then click Connect in the popup". You click Connect in the MetaMask popup that appears.
5. Types a concern, clicks Get recommendation, waits for the response.
6. Hits the Activate / Show projections button.
7. **For each on-chain step (up to 3 popups)**, a banner says "👉 Approve in MetaMask". You click Approve. The script detects the popup closing and continues.
8. Renders the success screen with the three badges, scrolls.
9. Goes to `/app/trade/gold` to show the agent feed, then `/app/leaderboard`.
10. Closes, writes `tests-e2e/recordings/aegis-demo-real-mm-<timestamp>.webm`.

## Convert to MP4

```
node transcode.js
```

Picks the largest .webm in `recordings/` and writes `.mp4` next to it (H.264, yuv420p, +faststart). Plays in Windows Movies & TV, browsers, anywhere.

## Tips

- **Don't move the MetaMask popup window** while the script is waiting; the recording captures whatever is on the main browser window.
- The script has 90-120s of patience per popup. If you take longer, it logs a warning and continues — the recording is still good; the timing just drifts.
- To re-shoot, just delete the latest `.webm` in `recordings/` and re-run `record`. The profile is preserved.
- The on-chain txs are **real mainnet txs**. Each `createShield` costs a tiny amount of 0G gas + locks the deposit A-USDC. Expect ~$50 of A-USDC consumed per take if you keep activating.

## Tear-down

To start completely over (forget the wallet, drop the cached extension state):

```
rm -rf tests-e2e/.mm-profile
```

The MetaMask extension cache itself stays — re-onboarding only needs the
profile dir to be empty.
