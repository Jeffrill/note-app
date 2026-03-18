# Notes App — Deploy to Vercel

A dark-mode iOS-style notes PWA. One-time setup, then install on any phone.

---

## Deploy in 5 minutes

### Step 1 — Upload to GitHub
1. Go to **github.com** → click **New repository**
2. Name it `notes-app`, keep it **Public**, click **Create**
3. On your computer, open a terminal in this folder and run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/notes-app.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to **vercel.com** → sign in with GitHub
2. Click **Add New → Project**
3. Find and import your `notes-app` repo
4. Leave all settings as-is (Vercel auto-detects Vite)
5. Click **Deploy** — done in ~30 seconds
6. You'll get a URL like `https://notes-app-abc123.vercel.app`

### Step 3 — Install on iPhone
1. Open the Vercel URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (box with arrow pointing up)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **Add** — the Notes icon appears on your home screen ✅

### Step 4 — Install on Android
1. Open the Vercel URL in **Chrome**
2. Tap the **three-dot menu** (top right)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **Install** ✅

---

## Local development
```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Build for production
```bash
npm run build
# Output is in the /dist folder
```

---

## Project structure
```
notes-app/
├── public/
│   ├── manifest.json        ← PWA manifest
│   ├── sw.js                ← Service worker (offline support)
│   └── icons/
│       ├── icon-192.png     ← Android icon
│       ├── icon-512.png     ← Android splash icon
│       └── apple-touch-icon.png  ← iPhone icon
├── src/
│   ├── main.jsx             ← React entry + SW registration
│   └── App.jsx              ← Full notes app
├── index.html               ← HTML shell with all PWA meta tags
├── vite.config.js           ← Vite + PWA plugin config
├── vercel.json              ← Vercel routing + cache headers
└── package.json
```

---

## Customise your app icon
Replace the files in `public/icons/` with your own PNG images:
- `icon-192.png` → 192×192px
- `icon-512.png` → 512×512px  
- `apple-touch-icon.png` → 180×180px

Free tool to generate all sizes: **https://progressier.com/pwa-icons-and-ios-splash-screen-generator**
