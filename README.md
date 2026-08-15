# Game Developer Portfolio

A personal portfolio site to showcase Unity/Unreal projects, skills, and experience — built with plain HTML, CSS, and JavaScript, with an interactive 3D scene (Three.js) in the hero section.

## Files

- `index.html` — page structure/content
- `style.css` — all styling
- `script.js` — nav scroll-tracking, HUD animation, and the 3D viewport scene

## Before you publish — personalize it

Open `index.html` and replace these placeholders:

- `Your Name` (appears in the `<title>` and hero heading)
- The hero paragraph and footer copyright name
- The **Direct Links** section (`#contact`) — swap the `href="#"` links for your real GitHub, LinkedIn, and resume PDF URL, and update the `mailto:you@example.com` address
- The **Download Resume** button `href="#"` in the hero
- The project descriptions/tags if you want to add screenshots, gameplay clips, or itch.io/GitHub links per project

## Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `portfolio`).
2. Upload `index.html`, `style.css`, and `script.js` to the root of the repo (drag-and-drop on the GitHub web UI works, or use git):
   ```
   git init
   git add index.html style.css script.js README.md
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
