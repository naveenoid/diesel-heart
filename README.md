# diesel-heart

A railway-themed strategy game. You are the dispatcher — thread rescue
train 9X through busy scheduled traffic by reading switches and choosing
your route before the points lock.

**Play it:** `naveenoid.github.io/diesel-heart` *(once GitHub Pages is enabled)*

---

## Project layout

```
diesel-heart/
├── web/          # Browser-native build — current implementation
│   └── index.html
├── godot/        # Reserved — future Godot project
├── unity/        # Reserved — future Unity project
└── .github/
    └── workflows/
        └── deploy.yml   # Deploys web/ to GitHub Pages on push to main
```

The web build is the fast iteration target and the public demo. Native
platform builds (PC, Mac, iOS) will live in their own directories when
the time comes. The GitHub Actions workflow will need to be updated to
point at the engine's web-export output instead of `web/` at that point.

---

## Running locally

No build step. Open `web/index.html` directly in a browser, or serve the
`web/` directory:

```bash
cd web
python3 -m http.server 8080
# open http://localhost:8080
```

---

## Deploying to GitHub Pages

1. Push to `main` — the workflow triggers automatically.
2. **First-time setup:** go to *Settings → Pages → Source* and select
   **GitHub Actions** as the source. Subsequent pushes deploy without
   any manual steps.

---

## Controls

| Key | Action |
|-----|--------|
| `↑` | Switch to upper track at next points |
| `↓` | Switch to lower track at next points |
| `Space` | Emergency brake (damages cargo) |

For more info, email: naveen.sk@gmail.com
