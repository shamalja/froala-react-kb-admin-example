import { useEffect, useMemo, useState } from "react";
import KnowledgeBaseArticleEditor from "./components/KnowledgeBaseArticleEditor.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function App() {
  const [articles, setArticles] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  async function refreshList(nextSelectId) {
    const res = await fetch(`${API_BASE}/api/kb/articles`);
    const data = await res.json();
    setArticles(data);
    if (nextSelectId) setSelectedId(nextSelectId);
    else if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id);
  }

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => articles.find((a) => a.id === selectedId) || null,
    [articles, selectedId]
  );

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Knowledge Base Admin</h1>
          <p className="sub">
            Real-world demo: Froala embedded in React + HTML save/load + image uploads (Express).
          </p>
        </div>

        <div className="header-actions">
          <label className="label">
            Article
            <select
              className="select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title || "(Untitled)"} — {a.id}
                </option>
              ))}
            </select>
          </label>

          <button
            className="btn"
            onClick={async () => {
              const res = await fetch(`${API_BASE}/api/kb/articles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: "New article",
                  category: "Getting Started",
                  tags: ["kb"],
                  bodyHtml: "<h2>Start here</h2><p>Write your article…</p>"
                })
              });
              const created = await res.json();
              await refreshList(created.id);
            }}
          >
            + New article
          </button>
        </div>
      </header>

      <main className="main">
        {selected ? (
          <KnowledgeBaseArticleEditor
            key={selected.id}
            articleId={selected.id}
            onSaved={() => refreshList(selected.id)}
          />
        ) : (
          <div className="card">
            <p>No articles found. Click “New article”.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>
          Tip: Try inserting a table, uploading an image, then Save → refresh → open the same article.
        </span>
      </footer>
    </div>
  );
}
