[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/TonyWanders/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/TonyWanders/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

# Nightshift: The Meridian Vault

A complete, original top-down stealth game that plays offline in a desktop browser. Slip past patrolling guards, grab 3 intel files, and reach the glowing exit unseen. Three hand-built levels, from the Meridian Vault ground floor to the Director's Wing.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and open http://localhost:8080).

- **Move:** WASD or arrow keys
- **Sneak:** hold Shift (slower, quieter, harder to spot)
- **Throw a coin:** Q or click (pulls a guard to the noise, 3 per level)
- **Mute:** M, **Retry level:** R, **Pause:** P, **Start:** Enter

## The stealth

- Guards patrol fixed routes with bright vision cones. Walls and crates block their sight.
- Getting seen fills a guard's suspicion meter. A full meter means a chase, and a chase that catches you raises an alarm. Three alarms and the job is off.
- Bushes hide you completely. Shadow zones slow detection. Footsteps carry: walking is louder than sneaking, and guards hear both.
- Lose a guard and it searches your last seen spot, then walks back to patrol. A thrown coin sends a guard to investigate the clink.

## What is in here

- `game/index.html` plus `game/src/`: the game, plain ES modules, no libraries, no network requests, no audio files (all sound is synthesized with WebAudio).
- `game/src/config.js` tuning, `level.js` three levels, `player.js` movement and noise, `guard.js` patrol/vision/chase AI, `world.js` level flow and scoring, `render.js` canvas art and HUD, `audio.js` synthesized sound, `input.js` keyboard and mouse, `shots.js` staged screenshot scenes, `main.js` the shell.
- `screenshots/`: 4 real renders of the game's own code (title, patrol, alert, exit).
- `main.ts`: the make.fun hand-in program. `vendor/makefun-game.ts`: the kit's library, unchanged.

## Entry

Built for the make.fun bounty [Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759) ($50, ends 22 Nov 2026 06:59 WAT). Serve and check with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
