import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── HELPERS FOR SYLLABUS BULK EDIT ──────────────────────────────────────────

const parseDurationToSeconds = (durStr) => {
  if (!durStr) return 600; // default to 10 minutes
  durStr = String(durStr).toLowerCase().trim();
  if (/^\d+$/.test(durStr)) {
    return parseInt(durStr);
  }
  
  let seconds = 0;
  const hourMatch = durStr.match(/(\d+)\s*h/);
  const minMatch = durStr.match(/(\d+)\s*m/);
  const secMatch = durStr.match(/(\d+)\s*s/);
  
  if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600;
  if (minMatch) seconds += parseInt(minMatch[1]) * 60;
  if (secMatch) seconds += parseInt(secMatch[1]);
  
  if (seconds === 0 && durStr.includes(':')) {
    const parts = durStr.split(':').map(Number);
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  
  return seconds || 600;
};

const formatSecondsToDuration = (seconds) => {
  if (!seconds) return '10m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  let res = '';
  if (h > 0) res += `${h}h `;
  if (m > 0) res += `${m}m `;
  if (s > 0 && h === 0) res += `${s}s`;
  return res.trim() || '0s';
};

const parseSyllabusText = (text) => {
  const lines = text.split('\n').map(l => l.trim());
  const parsed = [];
  let currentModule = null;

  for (const line of lines) {
    if (!line) continue;

    if (line.toLowerCase().startsWith('module:') || line.toLowerCase().startsWith('m:')) {
      const title = line.replace(/^(module:|m:)/i, '').trim();
      currentModule = { title, lessons: [] };
      parsed.push(currentModule);
    } else {
      let cleanLine = line.replace(/^(lesson:|l:|-)/i, '').trim();
      const parts = cleanLine.split('|').map(p => p.trim());
      const title = parts[0];
      if (!title) continue;

      const type = (parts[1] || 'video').toLowerCase();
      const contentOrUrl = parts[2] || '';
      const video_duration = parts[3] || '10m';
      const is_free_preview = parts[4]?.toLowerCase() === 'free' || parts[4]?.toLowerCase() === 'true';

      const lesson = {
        title,
        type: ['video', 'article', 'quiz'].includes(type) ? type : 'video',
        video_url: type === 'video' ? contentOrUrl : '',
        content: type === 'article' ? contentOrUrl : '',
        video_duration,
        is_free_preview
      };

      if (!currentModule) {
        currentModule = { title: 'Welcome / Introduction', lessons: [] };
        parsed.push(currentModule);
      }
      currentModule.lessons.push(lesson);
    }
  }
  return parsed;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [uploadingImage, setUploadingImage] = useState(false)
  const navigate = useNavigate()

  // Quick Edit Course State
  const [editingCourseId, setEditingCourseId] = useState(null)

  // Bulk Syllabus State
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditCourseId, setBulkEditCourseId] = useState(null)
  const [bulkSyllabusText, setBulkSyllabusText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `course-covers/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath)

      setCourseForm(prev => ({ ...prev, cover_image: publicUrl }))
    } catch (err) {
      alert('Error uploading image: ' + err.message + '\n\nMake sure you have created a public bucket named "course-assets" in your Supabase storage dashboard.')
    } finally {
      setUploadingImage(false)
    }
  }

  const [courseForm, setCourseForm] = useState({
    title: '', slug: '', price: '', compare_price: '',
    cover_image: '', level: 'beginner', what_you_learn: [], bonuses: [], is_published: false, is_free: false
  })

  // Auto-save create form to localStorage (only if creating new course)
  useEffect(() => {
    if (!editingCourseId && (courseForm.title || courseForm.price)) {
      localStorage.setItem('draft_newCourse', JSON.stringify(courseForm))
    }
  }, [courseForm, editingCourseId])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        level,
        what_you_learn,
        created_at,
        products (
          title,
          slug,
          price,
          old_price,
          cover_image,
          is_published
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCourses(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleOpenAdd = () => {
    setEditingCourseId(null)
    const saved = localStorage.getItem('draft_newCourse')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCourseForm({
          ...parsed,
          what_you_learn: Array.isArray(parsed.what_you_learn) ? parsed.what_you_learn : [],
          bonuses: Array.isArray(parsed.bonuses) ? parsed.bonuses : []
        })
      } catch (e) {
        setCourseForm({ title: '', slug: '', price: '', compare_price: '', cover_image: '', level: 'beginner', what_you_learn: [], bonuses: [], is_published: false, is_free: false })
      }
    } else {
      setCourseForm({ title: '', slug: '', price: '', compare_price: '', cover_image: '', level: 'beginner', what_you_learn: [], bonuses: [], is_published: false, is_free: false })
    }
    setShowModal(true)
  }

  const handleOpenEdit = (c) => {
    const p = c.products || {}
    setEditingCourseId(c.id)
    setCourseForm({
      title: p.title || '',
      slug: p.slug || '',
      price: p.price || '',
      compare_price: p.old_price || '',
      cover_image: p.cover_image || '',
      level: c.level || 'beginner',
      is_published: p.is_published || false,
      is_free: p.is_free || false,
      what_you_learn: Array.isArray(c.what_you_learn) ? c.what_you_learn : [],
      bonuses: Array.isArray(p.features) ? p.features : []
    })
    setShowModal(true)
  }

  const handleCreateOrUpdateCourse = async (e) => {
    e.preventDefault()
    if (!courseForm.title.trim() || !courseForm.slug.trim()) return
    setSubmitting(true)

    try {
      if (editingCourseId) {
        // 1. Update product
        const { error: pErr } = await supabase
          .from('products')
          .update({
            title: courseForm.title.trim(),
            slug: courseForm.slug.trim(),
            price: courseForm.is_free ? 0 : (parseInt(courseForm.price) || 0),
            old_price: courseForm.compare_price ? parseInt(courseForm.compare_price) : null,
            cover_image: courseForm.cover_image.trim(),
            is_published: courseForm.is_published,
            is_free: courseForm.is_free,
            features: Array.isArray(courseForm.bonuses) ? courseForm.bonuses.filter(b => b.trim()) : []
          })
          .eq('id', editingCourseId)

        if (pErr) throw pErr

        // 2. Update course
        const { error: cErr } = await supabase
          .from('courses')
          .update({
            level: courseForm.level,
            what_you_learn: Array.isArray(courseForm.what_you_learn) ? courseForm.what_you_learn.filter(x => x.trim()) : []
          })
          .eq('id', editingCourseId)

        if (cErr) throw cErr

        setShowModal(false)
        loadCourses()
      } else {
        // 1. Create product record
        const { data: prod, error: pErr } = await supabase
          .from('products')
          .insert({
            title: courseForm.title.trim(),
            slug: courseForm.slug.trim(),
            type: 'course',
            price: courseForm.is_free ? 0 : (parseInt(courseForm.price) || 0),
            old_price: courseForm.compare_price ? parseInt(courseForm.compare_price) : null,
            cover_image: courseForm.cover_image.trim() || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
            is_published: false,
            is_free: courseForm.is_free || false,
            features: Array.isArray(courseForm.bonuses) ? courseForm.bonuses.filter(b => b.trim()) : []
          })
          .select('id')
          .single()

        if (pErr) throw pErr

        // 2. Create course record
        const { error: cErr } = await supabase
          .from('courses')
          .insert({
            id: prod.id,
            level: courseForm.level,
            what_you_learn: Array.isArray(courseForm.what_you_learn) ? courseForm.what_you_learn.filter(x => x.trim()) : []
          })

        if (cErr) throw cErr

        localStorage.removeItem('draft_newCourse')
        setShowModal(false)
        loadCourses()
        navigate(`/admin/courses/${prod.id}`)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── BULK SYLLABUS SYNC LOGIC ──────────────────────────────────────────────

  const handleOpenBulkSyllabus = async (courseId) => {
    setBulkEditCourseId(courseId)
    setBulkSaving(false)
    setBulkSyllabusText('Loading current syllabus...')
    setShowBulkEditModal(true)

    try {
      const { data: dbModules, error } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (error) throw error

      if (!dbModules || dbModules.length === 0) {
        setBulkSyllabusText(
          `Module: Getting Started\nLesson 1: Introduction to Web Design | video | https://fast.wistia.net/embed/iframe/xxxxxx | 10m\nLesson 2: Choosing Your Domain | article | Here is standard article text... | 15m\n`
        )
        return
      }

      let text = '';
      dbModules.forEach(mod => {
        text += `Module: ${mod.title}\n`;
        const sortedLessons = (mod.lessons || []).sort((a, b) => a.order_index - b.order_index);
        sortedLessons.forEach(les => {
          const typeStr = les.type || 'video';
          const contentOrUrl = typeStr === 'video' ? (les.video_url || '') : (les.content || '');
          const durationStr = formatSecondsToDuration(les.video_duration);
          const previewStr = les.is_free_preview ? ' | free' : '';
          text += `Lesson: ${les.title} | ${typeStr} | ${contentOrUrl} | ${durationStr}${previewStr}\n`;
        });
        text += `\n`;
      });
      setBulkSyllabusText(text.trim());
    } catch (err) {
      alert('Error fetching syllabus: ' + err.message);
      setShowBulkEditModal(false);
    }
  }

  const handleSaveBulkSyllabus = async (e) => {
    e.preventDefault()
    if (!bulkEditCourseId || bulkSaving) return
    setBulkSaving(true)

    try {
      const parsedSyllabus = parseSyllabusText(bulkSyllabusText)

      // Fetch current modules and lessons to merge intelligently
      const { data: dbModules, error: fetchErr } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', bulkEditCourseId)

      if (fetchErr) throw fetchErr

      const existingModules = dbModules || []
      const keptModuleIds = []
      const keptLessonIds = []

      let modIndex = 0
      for (const parsedMod of parsedSyllabus) {
        // Try to match module by case-insensitive title
        let dbMod = existingModules.find(m => m.title.toLowerCase() === parsedMod.title.toLowerCase())
        let moduleId

        if (dbMod) {
          moduleId = dbMod.id
          keptModuleIds.push(moduleId)
          await supabase
            .from('modules')
            .update({ order_index: modIndex })
            .eq('id', moduleId)
        } else {
          const { data: newMod, error: modErr } = await supabase
            .from('modules')
            .insert({
              course_id: bulkEditCourseId,
              title: parsedMod.title,
              order_index: modIndex
            })
            .select('id')
            .single()
          
          if (modErr) throw modErr
          moduleId = newMod.id
          keptModuleIds.push(moduleId)
        }

        let lesIndex = 0
        for (const parsedLes of parsedMod.lessons) {
          // Try to match lesson inside this course by title
          let dbLes = null
          for (const m of existingModules) {
            const found = m.lessons.find(l => l.title.toLowerCase() === parsedLes.title.toLowerCase())
            if (found) {
              dbLes = found
              break
            }
          }

          const durationSeconds = parseDurationToSeconds(parsedLes.video_duration)
          const record = {
            module_id: moduleId,
            title: parsedLes.title,
            type: parsedLes.type,
            video_url: parsedLes.video_url,
            content: parsedLes.content,
            video_duration: durationSeconds,
            is_free_preview: parsedLes.is_free_preview,
            order_index: lesIndex
          }

          if (dbLes) {
            keptLessonIds.push(dbLes.id)
            await supabase
              .from('lessons')
              .update(record)
              .eq('id', dbLes.id)
          } else {
            const { data: newLes, error: lesErr } = await supabase
              .from('lessons')
              .insert(record)
              .select('id')
              .single()

            if (lesErr) throw lesErr
            keptLessonIds.push(newLes.id)
          }
          lesIndex++
        }
        modIndex++
      }

      // Cleanup deleted modules and lessons safely to protect indices
      const allDbLessonIds = existingModules.flatMap(m => m.lessons.map(l => l.id))
      const deletedLessonIds = allDbLessonIds.filter(id => !keptLessonIds.includes(id))
      if (deletedLessonIds.length > 0) {
        await supabase.from('lessons').delete().in('id', deletedLessonIds)
      }

      const allDbModuleIds = existingModules.map(m => m.id)
      const deletedModuleIds = allDbModuleIds.filter(id => !keptModuleIds.includes(id))
      if (deletedModuleIds.length > 0) {
        await supabase.from('modules').delete().in('id', deletedModuleIds)
      }

      setShowBulkEditModal(false)
      loadCourses()
      alert('Syllabus synchronized successfully! All lesson matching preserved progress and discussions.')
    } catch (err) {
      alert('Sync failed: ' + err.message)
    } finally {
      setBulkSaving(false)
    }
  }

  const isMobile = windowWidth < 768

  return (
    <div style={{ fontFamily: 'var(--font), sans-serif', color: '#1e293b' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Courses & Syllabuses</h2>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: 14, lineHeight: '1.5' }}>Create courses, build learning syllabuses, and track complexity.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          style={{ 
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
            color: '#fff', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: 8, 
            fontWeight: 600, 
            fontSize: 14,
            cursor: 'pointer', 
            boxShadow: '0 4px 10px rgba(37,99,235,0.2)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(37,99,235,0.2)' }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: 'translateY(-0.5px)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Create Course
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontSize: 15, fontWeight: 500 }}>
          <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: 10, verticalAlign: 'middle' }} />
          Loading course list...
        </div>
      ) : isMobile ? (
        /* Mobile Premium List Layout */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#64748b' }}>No courses found.</div>
          ) : (
            courses.map(c => {
              const p = c.products || {}
              return (
                <div key={c.id} style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6, lineHeight: '1.4' }}>{p.title || 'Untitled Course'}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', background: '#f1f5f9', color: '#475569', borderRadius: 6, fontWeight: 600, textTransform: 'capitalize' }}>
                        {c.level} Level
                      </span>
                      <span style={{ fontSize: 11, padding: '3px 8px', background: p.is_published ? '#dcfce7' : '#f1f5f9', color: p.is_published ? '#15803d' : '#64748b', borderRadius: 6, fontWeight: 600 }}>
                        {p.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span style={{ fontSize: 11, padding: '3px 8px', background: p.is_free ? '#fef9c3' : '#dbeafe', color: p.is_free ? '#a16207' : '#1e40af', borderRadius: 6, fontWeight: 600 }}>
                        {p.is_free ? 'FREE' : 'PAID'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Price:</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>₦{(p.price || 0).toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <Link 
                      to={`/admin/courses/${c.id}`}
                      style={{ flex: '1 1 40%', textAlign: 'center', background: '#2563eb', color: '#fff', padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none', boxShadow: '0 2px 4px rgba(37,99,235,0.1)' }}
                    >
                      Builder
                    </Link>
                    <Link 
                      to={`/course/${c.id}`}
                      target="_blank"
                      style={{ flex: '1 1 40%', textAlign: 'center', background: '#f59e0b', color: '#fff', padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none', boxShadow: '0 2px 4px rgba(245,158,11,0.1)' }}
                    >
                      View Course
                    </Link>
                    <button 
                      onClick={() => handleOpenBulkSyllabus(c.id)}
                      style={{ flex: '1 1 40%', background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.1)' }}
                    >
                      Bulk Syllabus
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(c)}
                      style={{ flex: '1 1 40%', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Desktop Premium Table Layout */
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div className="admin-table-container">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Course Title</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Level</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Price</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14 }}>No courses found. Create one above to get started!</td></tr>
                ) : (
                  courses.map(c => {
                    const p = c.products || {}
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '18px 24px', fontWeight: 600, color: '#0f172a', fontSize: 15 }}>{p.title || 'Untitled Course'}</td>
                        <td style={{ padding: '18px 24px', textTransform: 'capitalize', color: '#475569', fontSize: 14, fontWeight: 500 }}>
                          <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>{c.level}</span>
                        </td>
                        <td style={{ padding: '18px 24px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                          ₦{(p.price || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ padding: '3px 8px', background: p.is_published ? '#dcfce7' : '#f1f5f9', color: p.is_published ? '#15803d' : '#475569', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                              {p.is_published ? 'Published' : 'Draft'}
                            </span>
                            <span style={{ padding: '3px 8px', background: p.is_free ? '#fef9c3' : '#eff6ff', color: p.is_free ? '#a16207' : '#1d4ed8', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                              {p.is_free ? 'FREE' : 'PAID'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                            <Link 
                              to={`/course/${c.id}`} 
                              target="_blank"
                              style={{
                                display: 'inline-block',
                                background: '#f59e0b',
                                color: '#fff',
                                padding: '8px 14px',
                                borderRadius: 6,
                                fontWeight: 600,
                                textDecoration: 'none',
                                fontSize: 13,
                                boxShadow: '0 2px 4px rgba(245,158,11,0.08)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#d97706'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = '#f59e0b'}
                            >
                              View Course
                            </Link>

                            <Link 
                              to={`/admin/courses/${c.id}`} 
                              style={{
                                display: 'inline-block',
                                background: '#2563eb',
                                color: '#fff',
                                padding: '8px 14px',
                                borderRadius: 6,
                                fontWeight: 600,
                                textDecoration: 'none',
                                fontSize: 13,
                                boxShadow: '0 2px 4px rgba(37,99,235,0.08)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                            >
                              Syllabus Builder
                            </Link>
                            
                            <button 
                              onClick={() => handleOpenBulkSyllabus(c.id)}
                              style={{
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: 6,
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(16,185,129,0.08)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#059669'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = '#10b981'}
                            >
                              Bulk Syllabus
                            </button>

                            <button 
                              onClick={() => handleOpenEdit(c)}
                              style={{
                                background: '#fff',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                padding: '7px 14px',
                                borderRadius: 6,
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#1e293b' }}
                              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569' }}
                            >
                              Edit Settings
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Creation & Settings Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="no-scrollbar" style={{ 
            background: '#fff', 
            padding: isMobile ? '28px 20px' : '32px 32px', 
            borderRadius: 16, 
            width: '100%', 
            maxWidth: 520, 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 24,
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
                {editingCourseId ? 'Edit Course Settings' : 'Create Educational Course'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#475569' }}>Course Title *</label>
                <input 
                  type="text" 
                  value={courseForm.title} 
                  onChange={e => {
                    const title = e.target.value
                    setCourseForm({ ...courseForm, title, slug: generateSlug(title) })
                  }} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} 
                  onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none' }}
                  required 
                  placeholder="e.g. Freelance Web Design Blueprint"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#475569' }}>Slug URL Segment *</label>
                <input 
                  type="text" 
                  value={courseForm.slug} 
                  onChange={e => setCourseForm({ ...courseForm, slug: generateSlug(e.target.value) })} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} 
                  onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none' }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#475569' }}>Price (NGN) *</label>
                  <input 
                    type="number" 
                    value={courseForm.price} 
                    onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} 
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#475569' }}>Level *</label>
                  <select 
                    value={courseForm.level} 
                    onChange={e => setCourseForm({ ...courseForm, level: e.target.value })} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#475569' }}>Compare Price (NGN) (Optional)</label>
                  <input 
                    type="number" 
                    value={courseForm.compare_price} 
                    onChange={e => setCourseForm({ ...courseForm, compare_price: e.target.value })} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} 
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 6, gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={courseForm.is_published} 
                      onChange={e => setCourseForm({ ...courseForm, is_published: e.target.checked })} 
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563eb' }}
                    />
                    Published
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, color: courseForm.is_free ? '#16a34a' : '#334155', cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}>
                    <input 
                      type="checkbox" 
                      checked={courseForm.is_free || false} 
                      onChange={e => setCourseForm({ ...courseForm, is_free: e.target.checked, price: e.target.checked ? '0' : courseForm.price })} 
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }}
                    />
                    Free Course
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#475569' }}>Cover Image URL (Optional)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input 
                    type="url" 
                    value={courseForm.cover_image} 
                    onChange={e => setCourseForm({ ...courseForm, cover_image: e.target.value })} 
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} 
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none' }}
                    placeholder="https://..."
                  />
                  <label style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #cbd5e1', 
                    padding: '10px 16px', 
                    borderRadius: 8, 
                    cursor: 'pointer', 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: '#475569', 
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                  >
                    Upload File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {uploadingImage && <span style={{ fontSize: 12, color: '#2563eb', marginTop: 6, display: 'block', fontWeight: 500 }}>Uploading image...</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#475569' }}>Syllabus Highlights</label>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10, marginTop: 0 }}>Add key highlights of what students will learn inside the syllabus.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                  {(courseForm.what_you_learn || []).map((highlight, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={highlight}
                        placeholder={`Highlight ${idx + 1}`}
                        onChange={e => {
                          const updated = [...(courseForm.what_you_learn || [])]
                          updated[idx] = e.target.value
                          setCourseForm({ ...courseForm, what_you_learn: updated })
                        }}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (courseForm.what_you_learn || []).filter((_, i) => i !== idx)
                          setCourseForm({ ...courseForm, what_you_learn: updated })
                        }}
                        style={{ 
                          width: 38, 
                          height: 38, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fef2f2', 
                          color: '#dc2626', 
                          border: '1px solid #fecaca', 
                          borderRadius: 8, 
                          cursor: 'pointer', 
                          fontWeight: 700, 
                          fontSize: 16,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      >✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCourseForm({ ...courseForm, what_you_learn: [...(courseForm.what_you_learn || []), ''] })}
                    style={{ alignSelf: 'flex-start', padding: '8px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                    onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                  >
                    + Add Syllabus Highlight
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#475569' }}>Checkout Bonuses</label>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10, marginTop: 0 }}>Add bonuses included with this course. Appears in checkout summary.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  {(courseForm.bonuses || []).map((bonus, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={bonus}
                        placeholder={`Bonus ${idx + 1}`}
                        onChange={e => {
                          const updated = [...(courseForm.bonuses || [])]
                          updated[idx] = e.target.value
                          setCourseForm({ ...courseForm, bonuses: updated })
                        }}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (courseForm.bonuses || []).filter((_, i) => i !== idx)
                          setCourseForm({ ...courseForm, bonuses: updated })
                        }}
                        style={{ 
                          width: 38, 
                          height: 38, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fef2f2', 
                          color: '#dc2626', 
                          border: '1px solid #fecaca', 
                          borderRadius: 8, 
                          cursor: 'pointer', 
                          fontWeight: 700, 
                          fontSize: 16,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      >✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCourseForm({ ...courseForm, bonuses: [...(courseForm.bonuses || []), ''] })}
                    style={{ alignSelf: 'flex-start', padding: '8px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                    onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                  >
                    + Add Bonus
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  style={{ 
                    flex: 1.2, 
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '12px', 
                    borderRadius: 8, 
                    fontWeight: 600, 
                    fontSize: 14,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 10px rgba(37,99,235,0.15)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { if(!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,0.2)' } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(37,99,235,0.15)' }}
                >
                  {submitting ? 'Saving...' : (editingCourseId ? 'Save Changes' : 'Create Course')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={{ 
                    flex: 0.8, 
                    background: '#f8fafc', 
                    color: '#475569', 
                    border: '1px solid #cbd5e1', 
                    padding: '12px', 
                    borderRadius: 8, 
                    fontWeight: 600, 
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Syllabus Edit */}
      {showBulkEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: isMobile ? '24px 16px' : '32px 28px', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>Bulk Syllabus Sync Editor</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Add modules, bulk edit, and reorder lessons cleanly with standard plaintext parameters.</p>
            </div>
            
            <form onSubmit={handleSaveBulkSyllabus} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <textarea 
                  value={bulkSyllabusText} 
                  onChange={e => setBulkSyllabusText(e.target.value)} 
                  style={{ width: '100%', height: '100%', minHeight: 280, padding: '12px 16px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, fontFamily: 'monospace', resize: 'none', background: '#f8fafc', color: '#0f172a', outline: 'none' }} 
                />
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                <strong>Quick Plaintext Syntax:</strong><br />
                • Write <code style={{ background: '#dbeafe', padding: '1px 3px', borderRadius: 2 }}>Module: [Module Title]</code> to define a module.<br />
                • Write <code style={{ background: '#dbeafe', padding: '1px 3px', borderRadius: 2 }}>Lesson: [Title] | [type (video/article)] | [wistia_url_or_markdown] | [duration] | [free/paid]</code> to define a lesson.<br />
                • Existing lessons will match on Title to <strong>fully preserve student progress, notes, and discussions</strong>.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={bulkSaving} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontWeight: 600, cursor: bulkSaving ? 'not-allowed' : 'pointer' }}>
                  {bulkSaving ? 'Synchronizing Database...' : 'Save Syllabus Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowBulkEditModal(false)} 
                  style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '12px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .table-row-hover:hover {
          background-color: #f8fafc !important;
        }
      `}} />
    </div>
  )
}
