# Demo recording with OBS + Brave + real MetaMask

This is the path that actually works. OBS captures the whole desktop (so MetaMask popups, which are separate Chromium windows, are captured for free). Playwright just drives the dApp page with simple time-based pacing. No popup-detection brittleness.

## One-time OBS setup (3 minutes)

OBS is already installed at `C:/Program Files/obs-studio/bin/64bit/obs64.exe`. Open it once and do:

1. **Tools → WebSocket Server Settings**
   - Enable WebSocket Server: ON
   - Server Port: `4455` (default)
   - Enable Authentication: ON
   - Set a password (anything — we'll pass it via env var)
   - Click **Apply** → **OK**
2. **Settings → Output → Recording**
   - Recording Path: pick somewhere convenient (default `Videos\` is fine)
   - Recording Format: **`mp4`**
   - Video Encoder: **NVENC H.264** if you have an NVIDIA GPU, else x264
   - Click **Apply** → **OK**
3. **Sources panel (bottom of main window)**
   - Click the `+` → **Display Capture**
   - Name it something like "Primary Monitor"
   - Pick your main monitor in the dropdown → **OK**
   - If you have multiple monitors and the dapp + MetaMask popup might appear on different ones, capture the one they'll be on (run the dapp on that monitor before recording).
4. **(Optional) Audio Output Capture** — Click `+` → Audio Output Capture if you want system sound. Skip if you'll do voiceover separately.

Verify it works: click **Start Recording** in OBS once, wait 2 seconds, click **Stop Recording**. A short .mp4 should land in the recording dir.

## Run the recording

```powershell
# In a fresh PowerShell window:
$env:OBS_WS_PASSWORD = "<the password you set in OBS>"
cd C:\Users\apbar\codeFiles\ppn.fi\tests-e2e
node record-obs-brave.js
```

Make sure **every Brave window is closed** before running (taskbar tray included; right-click → Quit). The script:

1. Connects to OBS, starts recording.
2. Launches Brave with your Work profile + your real MetaMask.
3. Drives landing → connect → recommend → activate → trade → leaderboard, pausing **25 seconds at each MetaMask popup beat** so you have time to click.
4. Stops OBS, closes Brave, prints the path of the .mp4 file.

## Timing reference (what to expect)

| Beat | Approx wall time | Your action |
|---|---|---|
| Launch + OBS connect + scene switch | ~5s | none |
| Landing scroll | ~14s | none |
| Open `/app/shield`, click Connect Wallet | ~5s | none |
| Banner: pick MetaMask, then click Connect in popup | **25s window** | click MetaMask in modal, click Connect in real MM popup |
| Concern field, recommend (AI roundtrip ~10s) | ~15s | none |
| Click "Show projections", scroll | ~5s | none |
| Click "Start earning" / Activate | ~2s | none |
| Banner: approve faucet OR approve | **25s window** | click Approve in real MM popup |
| Banner: approve approve OR createShield | **25s window** | click Approve in real MM popup |
| Banner: approve createShield (mainnet tx) | **30s window** | click Approve in real MM popup |
| Success screen, scroll, trade page, leaderboard | ~15s | none |

Total: ~3 minutes 10 seconds. The 25-second windows at each popup are deliberately generous; if you click fast the recording just has a few extra seconds of the dapp idling, harmless.

## Override env vars

| Var | Default | Use |
|---|---|---|
| `OBS_WS_URL` | `ws://127.0.0.1:4455` | Override only if you ran OBS WebSocket on a non-default port |
| `OBS_WS_PASSWORD` | (required) | Set this from your OBS settings |
| `OBS_SCENE` | (current scene) | If you made a scene specifically for the demo, set its name |
| `BRAVE_EXE` | auto-detected | Override only if Brave is in a non-standard install path |
| `BRAVE_PROFILE` | auto-detected | Override only if your `User Data` is non-standard |
| `BRAVE_PROFILE_NAME` | `Work` | The friendly profile name; auto-resolves to the `Profile N` directory |
| `CLIENT_BASE` | `http://127.0.0.1:5173` | Override if the Vite dev server is on a different port |

## Why this is more reliable than Playwright's built-in `recordVideo`

| | `recordVideo` | OBS + WebSocket |
|---|---|---|
| Captures MetaMask popups | No (popups are separate Chromium windows; recordVideo records the dApp tab only) | **Yes** (Display Capture sees the whole screen) |
| Needs popup detection to advance | Yes (broke in v1 + v2) | No — generous fixed pauses; OBS captures whatever happens during them |
| Loses recording if Playwright crashes mid-run | Yes | No — OBS keeps recording even if the Playwright session dies |
| Output format | `.webm` (needs transcoding) | **`.mp4`** native (NVENC/x264) |
| Multi-monitor / DPI sensitive | No | Yes — make sure Display Capture sees the right monitor |

## Troubleshooting

- **"OBS connect failed"** — OBS isn't running, WebSocket isn't enabled, or the password is wrong. Open OBS, Tools → WebSocket Server Settings, verify enabled + password. Set `$env:OBS_WS_PASSWORD` to the same value.
- **"Brave launch failed: profile is already in use"** — A Brave window or tray icon is still alive. Close all of them; in PowerShell: `Get-Process brave | Stop-Process -Force`.
- **MetaMask popup appears on the wrong monitor** — drag MetaMask popup to the Display-Capture monitor before clicking Approve, or in OBS use Display Capture set to "All displays".
- **Recording is silent** — system audio not captured. Add an Audio Output Capture source in OBS if you want sound. Or do voiceover separately and merge in post.
- **Recording is paused mid-take** — OBS WebSocket may have lost connection. Look for a `Stopping OBS recording...` log line; if the script logged it before you expected, the run errored out earlier. Check the script's earlier stdout.

## What you'll have at the end

One .mp4 file. The script prints its path. Plays in Windows Movies & TV, browsers, your phone, anywhere. Real MetaMask popups visible, real on-chain createShield tx, real success screen with the 0G integration badges, real trade-page agent feed, real leaderboard.
