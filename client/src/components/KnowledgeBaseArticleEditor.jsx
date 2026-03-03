import { useEffect, useMemo, useState } from "react";
import FroalaEditorComponent from "react-froala-wysiwyg";

// Froala core + plugins
import "froala-editor/js/plugins.pkgd.min.js";

// Froala styles
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function KnowledgeBaseArticleEditor({ articleId, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [html, setHtml] = useState("");

  // Load existing article
  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/kb/articles/${articleId}`);
      const data = await res.json();
      setTitle(data.title || "");
      setCategory(data.category || "");
      setTagsText((data.tags || []).join(", "));
      setHtml(data.bodyHtml || "");
      setLoading(false);
    }
    load();
  }, [articleId]);

  const config = useMemo(() => {
    const licenseKey = import.meta.env.VITE_FROALA_KEY || undefined;

    return {
      key: licenseKey, // optional in dev; required for production use
      placeholderText: "Write your knowledge base article…",
      charCounterCount: true,

      // KB-focused toolbar
      toolbarButtons: [
        "bold",
        "italic",
        "underline",
        "|",
        "paragraphFormat",
        "formatOL",
        "formatUL",
        "|",
        "insertLink",
        "insertImage",
        "insertTable",
        "insertHR",
        "|",
        "clearFormatting",
        "undo",
        "redo"
      ],

      paragraphFormat: {
        N: "Normal",
        H2: "Heading 2",
        H3: "Heading 3"
      },

      // Image upload → your backend
      imageUploadURL: `${API_BASE}/api/kb/uploads/images`,
      imageUploadMethod: "POST",

      // Optional constraints (adjust as you like)
      imageAllowedTypes: ["jpeg", "jpg", "png", "gif", "webp"],
      imageMaxSize: 5 * 1024 * 1024,

      // Keep things clean-ish on paste (still sanitize server-side)
      // pastePlain: false,
    };
  }, []);

  async function handleSave() {
    setSaving(true);

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch(`${API_BASE}/api/kb/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        tags,
        bodyHtml: html
      })
    });

    if (!res.ok) {
      alert("Save failed. Check the server console for details.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved?.();
  }

  if (loading) {
    return (
      <div className="card">
        <p>Loading article…</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Editor</h2>

        <div className="form">
          <label className="label">
            Title
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className="label">
            Category
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>

          <label className="label">
            Tags (comma-separated)
            <input
              className="input"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="e.g., onboarding, api, billing"
            />
          </label>
        </div>

        <div className="editor-wrap">
          <FroalaEditorComponent tag="textarea" model={html} onModelChange={setHtml} config={config} />
        </div>

        <div className="actions">
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save article"}
          </button>
        </div>

        <p className="hint">
          Images are uploaded to the Express server and served from <code>/uploads</code>.
        </p>
      </section>

      <section className="card">
        <h2>Preview</h2>
        <p className="sub">This is how your stored HTML will render in the knowledge base.</p>

        <div className="preview froala-view" dangerouslySetInnerHTML={{ __html: html }} />
      </section>
    </div>
  );
}
