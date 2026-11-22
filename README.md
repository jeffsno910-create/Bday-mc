# For Priti — A Birthday Written in the Stars ♡

A self-contained, mobile-friendly birthday microsite made by Jeffrin for Priti. It includes the opening gift-and-whistle sequence, India-time birthday countdown, photo and video memories, birthday letters, wishes, cake celebration, creative studio, selfie booth, a final surprise, chapter-by-chapter ambient artwork, the one-minute Catch the Starlight game, and a four-relic Minecraft-inspired adventure with an optional four-game side-quest arcade.

## Run locally

Keep `index.html`, `style.css`, `script.js`, and the `assets/` folder together. Open `index.html` in a modern browser or use VS Code Live Server. The website uses plain HTML, CSS and JavaScript; there are no build steps or package dependencies.

## Add the personal media

Use the filenames listed in `assets/photos/README.txt`, `assets/videos/README.txt`, and `assets/music/README.txt`. The current project contains its original visual artwork and graceful placeholders, but not Priti's private photographs, videos or chosen birthday song. Add only media you have permission to share.

## The one-minute game

Open **little game** in the navigation and press **start the little game**. Catch golden stars (+1), collect bonus hearts (+3), and avoid sleepy clouds (-2). Every fifth good catch gives a +2 combo bonus. Reach 26 points before the 60-second timer ends. Pause/resume is supported, and the personal-best score is stored locally in that browser. The game rotates through the included celestial artwork.

## The Minecraft-inspired birthday adventure

The small **the birthday realm quest** panel tracks four collectibles tucked into the existing site:

- Diamond — Memories
- Golden Apple — Videos
- Ender Pearl — Birthday Letter
- Birthday Cake — Art Studio

Collect all four to unlock the realm. Then follow the five chapters:

1. **Overworld:** meet Pixel, a friendly blocky dog. Give Pixel a pat to invite the companion along.
2. **Magic Portal:** activate the purple gateway and travel to an ancient stronghold.
3. **End Portal:** discover the separate twelve-frame End Portal chamber and jump through the glowing portal surface.
4. **The End:** awaken five floating star crystals. Once all five glow, send birthday starlight to dissolve the Ender Dragon's shield. The dragon turns into a sky full of light; the scene is intentionally gentle and non-graphic.
5. **Sweet Cherry Grove:** arrive beneath pixel cherry blossoms with Pixel. Launch the sky-shot fireworks: bright rockets visibly rise, burst into wide layered flower-like displays, and end with a multi-rocket finale. Reveal the legendary birthday cake for one last reward.

The adventure is an original HTML/CSS/SVG/canvas scene; it does not require Minecraft, game files, external libraries, or a server. Relic progress is stored in the visitor's browser. Adventure-stage progress is kept for the current page session.

### Pixel's Side-Quest Arcade

After reaching the Sweet Cherry Grove, choose **explore Pixel's side-quest arcade** for four optional mini-games:

- **Confetti Vault:** a harmless TNT-themed rune-order puzzle. The crates are magical party props; the challenge is to repeat the moon → paw → star pattern.
- **Enderman Hide & Seek:** search six blossom glades to find three randomly hidden Endermen.
- **Pixel's Jigsaw:** solve a 3×3 sliding puzzle using the original `assets/images/pixel-cherry-jigsaw.svg` artwork. The board is shuffled through legal moves, so every generated puzzle is solvable.
- **Birthday Realm Verdict:** a five-question yes/no quiz with feedback, a score and replay.

The arcade is optional and does not change the core birthday message or the relic collection.

### Mobile finale layout

The main-site entrance uses an opacity-only animation instead of leaving a transform on the entire page. This keeps fixed controls anchored to the viewport. On phones the music player starts as a small expandable dock; while the final message is visible, the completed relic tracker and back-to-top control tuck away so they do not cover the closing message.

A separate tiny Creeper cameo can be found by typing `CREEPER` on a keyboard, or tapping the small **for priti** logo five times quickly. The cameo is a playful visual surprise.

## Background artwork

The included high-resolution images in `assets/images/` are used as chapter-specific ambient backgrounds behind the main site. They crossfade as the visitor moves through the chapters, with dark overlays for text readability. The mini-game also cycles through its own skies and victory artwork.

## Publish with GitHub Pages

1. Create a GitHub repository and upload the **contents** of this project folder (not the ZIP file).
2. Keep `index.html` at the repository root beside `style.css`, `script.js`, and `assets/`.
3. Open **Settings → Pages**.
4. Under the build/deployment settings, choose **Deploy from a branch**, select the publishing branch (usually `main`) and repository root (`/(root)`).
5. Save and open the Pages URL shown by GitHub after deployment.

This is a static site, so no server, API key, database or build step is needed. Camera access for the selfie booth requires HTTPS; GitHub Pages provides HTTPS.

## Privacy and notes

- The countdown follows `Asia/Kolkata` and targets November 26.
- The one-minute game and Minecraft-inspired adventure are optional; they do not block the existing birthday pages or final surprise.
- Personal wishes and mini-game best score stay in the visitor's browser. Relic progress is also stored locally and is not uploaded.
- The supplied files did not include Priti's personal photos, videos or birthday soundtrack. Their folders contain filename instructions and the site keeps graceful placeholders until those media files are added.
- GitHub Pages websites are public. Before publishing, make sure Priti is comfortable with the photos/videos being online and that everyone shown has agreed to being included. Do not upload private or sensitive material.
- `ORIGINAL_FILES/` contains byte-for-byte copies of the three source files provided before the site enhancements. Edit the main project files, not those backups.
