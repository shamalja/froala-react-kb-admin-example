import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { nanoid } from "nanoid";
import sanitizeHtml from "sanitize-html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Serve uploads
const uploadsDir = path.join(__dirname, "..", "uploads");
await fs.mkdir(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// File-based "DB"
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "articles.json");
await fs.mkdir(dataDir, { recursive: true });

async function readDb() {
  try {
    const raw = await fs.readFile(dbPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    const seed = [
      {
        id: "seed-1",
        title: "Welcome to the Knowledge Base",
        category: "Getting Started",
        tags: ["kb", "welcome"],
        bodyHtml:
          "<h2>Getting started</h2><p>This is a seeded article. Edit it, insert a table, and upload an image.</p><ol><li>Write content</li><li>Upload screenshots</li><li>Save and publish</li></ol>"
      }
    ];
    await fs.writeFile(dbPath, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function writeDb(items) {
  await fs.writeFile(dbPath, JSON.stringify(items, null, 2));
}

// Basic sanitizer (tune per your KB needs)
function sanitizeKbHtml(dirty) {
  return sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td"
    ]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "style"],
      "*": ["style", "class"]
    },
    allowedSchemes: ["http", "https", "data"],
    // Keep it simple; in production, consider stricter CSS/style policies.
  });
}

// Articles API
app.get("/api/kb/articles", async (_req, res) => {
  const items = await readDb();
  res.json(
    items.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      tags: a.tags
    }))
  );
});

app.get("/api/kb/articles/:id", async (req, res) => {
  const items = await readDb();
  const found = items.find((a) => a.id === req.params.id);
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});

app.post("/api/kb/articles", async (req, res) => {
  const items = await readDb();

  const id = nanoid(10);
  const title = String(req.body.title || "Untitled");
  const category = String(req.body.category || "");
  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
  const bodyHtml = sanitizeKbHtml(String(req.body.bodyHtml || ""));

  const created = { id, title, category, tags, bodyHtml };
  items.unshift(created);
  await writeDb(items);

  res.status(201).json(created);
});

app.put("/api/kb/articles/:id", async (req, res) => {
  const items = await readDb();
  const idx = items.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Not found" });

  const next = {
    ...items[idx],
    title: String(req.body.title ?? items[idx].title),
    category: String(req.body.category ?? items[idx].category),
    tags: Array.isArray(req.body.tags) ? req.body.tags : items[idx].tags,
    bodyHtml: sanitizeKbHtml(String(req.body.bodyHtml ?? items[idx].bodyHtml))
  };

  items[idx] = next;
  await writeDb(items);
  res.json(next);
});

// Image uploads (Froala expects { link: "url" })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({ storage });

app.post("/api/kb/uploads/images", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  // Froala image upload response format:
  res.json({ link: url });
});

app.get("/", (_req, res) => {
  res.type("text").send("KB Admin API running. Client should be on :5173");
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
