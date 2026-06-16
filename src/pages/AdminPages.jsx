import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getPages } from '../lib/pagesScanner'

export default function AdminPages() {
  const [searchQuery, setSearchQuery] = useState('')

  const PAGES = getPages()

  const filtered = PAGES.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Frontend Pages</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>
            All public-facing pages on the platform. Click "Preview" to view or open the source file in your editor.
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', paddingLeft: 14, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: '1px solid #e3e8ee', borderRadius: 8, fontSize: 13, color: '#1a1f36', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(page => (
          <div
            key={page.id}
            style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 10, padding: '20px 20px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, background: page.color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1f36' }}>{page.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{page.desc}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 6, padding: '6px 10px' }}>
              <svg style={{ width: 12, height: 12, color: '#94a3b8', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <code style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{page.path}</code>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <a
                href={`http://localhost:3000${page.path}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#2563eb', color: '#fff', textDecoration: 'none',
                  padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Preview Page
              </a>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#64748b', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit via IDE
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#697386', fontSize: 13 }}>No pages found matching "{searchQuery}".</div>
      )}

      <div style={{ marginTop: 32, padding: '16px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, color: '#1e40af' }}>
        <strong>How to edit page content:</strong> Each page is a React component in the <code style={{ background: '#dbeafe', padding: '1px 4px', borderRadius: 3, fontFamily: 'monospace', fontSize: 12 }}>src/pages/</code> folder. Open the file in your code editor (VS Code recommended) to modify text, sections, and design. After saving, the dev server auto-reloads.
      </div>
    </div>
  )
}
