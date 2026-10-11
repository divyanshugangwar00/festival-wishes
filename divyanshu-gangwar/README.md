# Festival Wishes Frontend — Divyanshu Gangwar

Vite frontend project. **Ek hi link** — date ke hisaab se tyohar + image automatic.

## Structure

```
festival-frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── images/
│       ├── divyanshu.jpg          ← aapki photo
│       ├── navratri.svg
│       ├── diwali.svg
│       ├── dussehra.svg
│       └── ... (sab tyohar images)
└── src/
    ├── main.js
    ├── style.css
    └── festivals.js
```

## Local run

```bash
cd festival-frontend
npm install
npm run dev
```

Browser: http://localhost:5173

## Build + deploy (Vercel / Netlify)

```bash
npm run build
```

`dist/` folder upload karo, ya Vercel pe repo connect:
- Framework: Vite
- Build: `npm run build`
- Output: `dist`

## Photo replace

- Apni: `public/images/divyanshu.jpg`
- Tyohar: `public/images/<id>.svg` — overwrite karke apni JPG/PNG bhi rakh sakte ho (festivals.js mein path update)

## Features

- Live date/time
- Auto festival by date (Navratri, Dussehra, Diwali, Holi…)
- Navratri 9 Mata days
- Festival images (SVG cards)
- Personalized wish + share link
