# Game Developer Portfolio

A personal portfolio site to showcase Unity/Unreal projects, skills, and experience — built with plain HTML, CSS, and JavaScript, with a **playable 3D hero scene** (Three.js) styled with a chromatic-aberration/glitch look.

## Hero mini-game

The hero isn't just a spinning model — it's a small playable scene:

- Walk a low-poly character around with **WASD / arrow keys** (desktop) or a **virtual joystick** (auto-shown on touch devices)
- Walking into one of the 6 glowing orbs "collects" a skill — it bursts, the score/dot counter updates, and a glitchy "+1 · SKILL" toast pops up
- Collect all 6 and a full "PORTFOLIO UNLOCKED!" banner plays
- The whole scene runs through a hand-written chromatic-aberration shader (RGB-split + scanlines) for that glitchy arcade look, which pulses stronger for a moment on each pickup
- Project card and skill card titles also get a quick RGB-split glitch on hover, tying the rest of the page into the same aesthetic

## Files

- `index.html` — page structure/content
- `style.css` — all styling, including the glitch/chromatic-aberration effects and game HUD
- `script.js` — nav scroll-tracking, the playable hero scene (character controller, collectibles, post-processing shader, joystick), the ambient background, and card tilt
- `resume.pdf` — downloadable resume, linked from the hero button and Direct Links panel

## Status

Name, GitHub, LinkedIn, email, phone, and resume are filled in. Still pending:

- Replace `resume.pdf` with a newer version whenever you update it (keep the filename the same, or update the `href="resume.pdf"` links in `index.html` if you rename it)
- Project descriptions/tags — add screenshots, gameplay clips, or GitHub/itch.io links per project if you want them

**Note:** if GitHub/LinkedIn links didn't open before, it was because an earlier download still had placeholder `#` links — this version has the real URLs wired in.

## Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `portfolio`).
2. Upload `index.html`, `style.css`, `script.js`, and `resume.pdf` to the root of the repo (drag-and-drop on the GitHub web UI works, or use git):
   ```
   git init
   git add index.html style.css script.js resume.pdf README.md
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`, then **Save**.
5. GitHub will give you a live URL shortly, usually:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

That's it — no build step needed, since it's plain HTML/CSS/JS.

