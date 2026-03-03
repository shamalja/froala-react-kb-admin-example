# Froala + React Knowledge Base Admin (Real-World Example)

This repo is a practical example you can run in VS Code and publish to GitHub:

- React admin UI for KB articles (title + category + tags + body)
- Froala editor embedded inline with a KB-focused toolbar
- HTML save/load to a simple Express API (file-based storage)
- Image upload endpoint (Express + multer) that Froala can use
- Live preview of rendered KB article HTML

> Note on licensing: Froala requires a license key for production use. This example includes a placeholder environment variable.
> Use your Froala trial/license key when testing.

---

## Quick start

### 1) Install
```bash
npm install
```

### 2) Add your Froala key (optional but recommended)
Create `client/.env`:
```bash
cp client/.env.example client/.env
```
Then set:
```
VITE_FROALA_KEY=YOUR_KEY_HERE
```

### 3) Run (client + server)
```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

---

## What to test

1. Open the admin UI and create a new article
2. Add headings, lists, tables, links
3. Upload an image via the editor
4. Save and reload the article
5. Check the preview panel (renders stored HTML)

---

## API endpoints (server)

- `GET /api/kb/articles` → list articles
- `GET /api/kb/articles/:id` → fetch article
- `POST /api/kb/articles` → create article
- `PUT /api/kb/articles/:id` → update article
- `POST /api/kb/uploads/images` → Froala image uploads (returns `{ "link": "<url>" }`)

Uploads are served from: `http://localhost:3001/uploads/<filename>`

---

## Where to link from your article

After you push this repo to GitHub, add a line like:

> Get the complete React + Express knowledge base editor example here: **(GitHub repo link)**

---

## Security note

This example includes basic server-side HTML sanitization using `sanitize-html`.  
In production, also validate auth/permissions and store uploads in object storage (S3, GCS, etc.).
