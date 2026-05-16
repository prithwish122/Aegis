# Recording with your real Brave browser

Best path if you already have MetaMask set up in Brave with the 0G Aristotle network added. No bundled extension, no separate profile, no onboarding.

## One-time preparation in Brave

1. **Set MetaMask as the default Ethereum wallet** so it injects `window.ethereum` instead of Brave's built-in wallet:
   - Address bar: `brave://settings/web3`
   - "Default Ethereum wallet" → **MetaMask**
   - Brave remembers this; you only do it once.
2. **Make sure MetaMask has 0G Aristotle** (chain `16661`, RPC `https://evmrpc.0g.ai`, symbol `0G`, explorer `https://chainscan.0g.ai`). If not, add it manually.
3. **Make sure the active account has** mainnet 0G + an A-USDC balance (or enough A-USDC will be minted via the in-app faucet step). The wallet you funded earlier (`0xCD2bec…7857`) is ready.

## Run the recording

```
cd C:/Users/apbar/codeFiles/ppn.fi/tests-e2e
```

Close **every** Brave window first (taskbar tray too). Chromium locks the profile dir while Brave is open and Playwright will refuse to launch.

```
node record-real-mm-brave.js
```

The script:

1. Auto-detects `brave.exe` at the standard install path and the `User Data` dir under `%LOCALAPPDATA%/BraveSoftware/Brave-Browser/User Data`.
   - Override either with `BRAVE_EXE=...` or `BRAVE_PROFILE=...` env vars if your install is in a non-standard place.
2. Launches Brave with `recordVideo` enabled. Your real profile loads — your MetaMask, your accounts, your networks.
3. Drives the landing scroll, navigates to `/app/shield`, clicks Connect Wallet, picks MetaMask in the RainbowKit modal. **You click Connect in the real MetaMask popup.**
4. Types a concern, hits Get recommendation, waits for the response.
5. Hits the activate flow. **For up to 3 popups in order** (faucet, approve, createShield), the script puts a banner at the bottom of the page and waits — you click Approve in MetaMask each time. The popup-close detector unblocks the script automatically.
6. Shows the success screen, scrolls.
7. Navigates to `/app/trade/gold` then `/app/leaderboard`.
8. Closes, writes a single `.webm` to `tests-e2e/recordings/aegis-demo-brave-mm-<timestamp>.webm`.

## Convert to MP4

```
node transcode.js
```

Final MP4 at `tests-e2e/recordings/aegis-demo-brave-mm-<timestamp>.mp4`. Plays in Windows Movies & TV, browsers, anywhere.

## If something goes wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| `Could not launch Brave` | Brave is still running | Close every Brave window including taskbar tray, retry |
| Pages open but MetaMask popup never appears | Brave Wallet is overriding `window.ethereum` | `brave://settings/web3` → default to MetaMask |
| MetaMask popup says "wrong network" | 0G Aristotle not in MetaMask | Add it manually, params above |
| Script times out at a popup | You took longer than 150s | Just re-run — popup close detection re-arms each beat |
| Faucet popup doesn't appear | You already had ≥25 A-USDC | The script proceeds correctly; the slot for that popup just doesn't trigger |

## Where Brave usually lives on Windows

```
exe         : C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe
User Data   : C:/Users/<you>/AppData/Local/BraveSoftware/Brave-Browser/User Data
```

Both auto-detected. Override via env vars only if Brave is somewhere weird.

## Tear-down

Your Brave profile is your real profile. Nothing to clean up. The recordings dir is gitignored.
