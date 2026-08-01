import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (err) throw err
      if (data) setCategories(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const val = e.target.value
    setName(val)
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description.trim() || null,
        parent_id: parentId || null
      }

      const { error: insErr } = await supabase
        .from('categories')
        .insert(payload)

      if (insErr) throw insErr

      setMessage('Category created successfully!')
      setName('')
      setSlug('')
      setDescription('')
      setParentId('')
      await loadCategories()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Subcategories may be deleted or orphaned.')) return
    
    try {
      const { error: delErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (delErr) throw delErr
      await loadCategories()
    } catch (err) {
      console.error(err)
      alert('Failed to delete category: ' + err.message)
    }
  }

  // Group categories into Parent and Subcategories
  const parentCategories = categories.filter(c => !c.parent_id)
  const getSubcategories = (parentId) => categories.filter(c => c.parent_id === parentId)

  // Style helpers
  const containerStyle = {
    fontFamily: 'var(--font, sans-serif)',
    color: '#0f0d0a',
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e3e8ee',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    marginBottom: '24px',
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '16px',
    fontFamily: 'inherit'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  const buttonStyle = {
    background: 'var(--g600, #0f0d0a)',
    color: '#ffffff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease'
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Product Categories</h2>
        <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Organize products into hierarchical categories and subcategories.</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, color: '#991b1b', fontSize: 14, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534', fontSize: 14, marginBottom: 16 }}>
          ✅ {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: windowWidth < 768 ? '1fr' : 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        {/* CREATE CATEGORY FORM */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f0d0a', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Create Category</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label style={labelStyle}>Category Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={handleNameChange} 
                placeholder="e.g. Shoes, Cufflinks" 
                style={inputStyle} 
                required 
              />
            </div>

            <div>
              <label style={labelStyle}>Slug (URL Friendly)</label>
              <input 
                type="text" 
                value={slug} 
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                placeholder="e.g. shoes, elegant-cufflinks" 
                style={inputStyle} 
                required 
              />
            </div>

            <div>
              <label style={labelStyle}>Parent Category (Optional)</label>
              <select 
                value={parentId} 
                onChange={e => setParentId(e.target.value)} 
                style={inputStyle}
              >
                <option value="">None (Top-Level Parent)</option>
                {parentCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Description (Optional)</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Brief details about products in this category..." 
                style={{ ...inputStyle, height: '80px', resize: 'vertical' }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting} 
              style={{ ...buttonStyle, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Creating...' : 'Add New Category'}
            </button>
          </form>
        </div>

        {/* CATEGORIES LIST TREE */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f0d0a', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Categories Hierarchy</h3>
          
          {loading ? (
            <div style={{ color: '#64748b', fontSize: 14 }}>Loading categories...</div>
          ) : parentCategories.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>No categories created yet. Create your first category on the left!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {parentCategories.map(parent => {
                const subs = getSubcategories(parent.id)
                return (
                  <div key={parent.id} style={{ border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                    {/* Parent row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 20px', borderBottom: subs.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <div>
                        <strong style={{ fontSize: 15, color: '#0f0d0a' }}>{parent.name}</strong>
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>/{parent.slug}</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(parent.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>

                    {/* Subcategories list */}
                    {subs.length > 0 && (
                      <div style={{ padding: '12px 20px 12px 40px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {subs.map(sub => (
                          <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px', lastOfType: { border: 'none' } }}>
                            <div>
                              <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{sub.name}</span>
                              <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8' }}>/{parent.slug}/{sub.slug}</span>
                            </div>
                            <button 
                              onClick={() => handleDelete(sub.id)}
                              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
