# Game Developer Portfolio

A personal portfolio site to showcase Unity/Unreal projects, skills, and experience — built with plain HTML, CSS, and JavaScript, with a **playable 3D hero scene** (Three.js) styled with a chromatic-aberration/glitch look.

## Hero mini-game

The hero is a small playable scene, not just a spinning model:

- Walk a low-poly character with **WASD / arrow keys** (desktop) or a **virtual joystick** (auto-shown on touch devices)
- **Coins**: 6 are tagged to your real skills (Unreal Engine 5, Unity/C#, Blueprints, Enemy AI, Web Dev, Combat Systems), plus 8 unlabeled bonus coins — 14 total. Walking into one bursts it, updates the score, and pops a glitchy "+1" toast
- **Portals**: 4 glowing rings placed around the floor — walk through one and it acts instantly:
  - **THEME** portal flips the whole site between dark and light mode
  - **SKILLS** / **PROJECTS** / **CONTACT** portals smooth-scroll straight to that section
  - A **⌂ HOME** button lives permanently in the top scoreboard bar, so getting back is always one tap away — no need to find a portal for the return trip
- **Idle dance**: stand still for ~4 seconds and the character breaks into a little idle dance instead of just standing there
- Collect all 14 and a "PORTFOLIO UNLOCKED!" banner plays
- The whole scene runs through a hand-written chromatic-aberration shader (RGB-split + scanlines), which pulses harder for a moment on every pickup or portal jump
- A slim **scoreboard bar** is pinned to the very top of the page at all times (coin count, music toggle, theme toggle, home button) — visible no matter which section you've scrolled to

## About the music

You uploaded "Jalebi Baby" (Tesher x Jason Derulo) to use as background music — I couldn't include it. That's a commercially released, copyrighted song, and I'm not able to embed licensed music like that in anything I build. What's in the site instead: a **procedural ambient pad** synthesized live in the browser with the Web Audio API (no audio file at all), wired to the same "♪ MUSIC" toggle button. It's a placeholder, not a replacement for a real track.

If you want actual music, you have two options:
1. **Use a track you have the rights to** (something you made, or a royalty-free track from a site like Pixabay Music or YouTube Audio Library). Drop the file in this folder as `music.mp3`, and I can wire up an `<audio>` element to loop it through the same toggle button — just ask.
2. Keep the procedural pad — it's original, costs nothing, and needs no file.

## About the contact form

There's no backend here (it's a static site), so true silent "send" isn't possible without a server or a third-party form service. Right now, submitting the form opens the visitor's email app with the name/email/message pre-filled and addressed to **sathkrith0@gmail.com** — they just hit send in their own mail client. If you'd rather it submit silently in-page, the standard no-backend fix is a free service like **Formspree** or **EmailJS** (sign up, get a form endpoint/API key, and I can wire it in) — let me know if you want that instead.

## Files

- `index.html` — page structure/content
- `style.css` — all styling, including the glitch/chromatic-aberration effects, game HUD, scoreboard, and light/dark theme
- `script.js` — nav scroll-tracking, the playable hero scene (character controller, coins, portals, idle dance, post-processing shader, joystick), theme toggle, procedural music, the mailto contact form, the ambient background, and card tilt
- `resume.pdf` — downloadable resume, linked from the hero button and Direct Links panel

## Status

Name, GitHub, LinkedIn, email, phone, and resume are filled in. Still pending:

- Swap in a real `music.mp3` if you want actual music instead of the procedural pad (see above)
- Decide if you want the contact form upgraded to a silent-send service (see above)
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


