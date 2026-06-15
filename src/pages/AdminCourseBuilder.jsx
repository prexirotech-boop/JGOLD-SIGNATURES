import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableLesson = ({ lesson, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `lesson-${lesson.id}`, 
    data: { type: 'Lesson', lesson } 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex' }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '10px 8px 10px 4px', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const SortableModule = ({ mod, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `module-${mod.id}`, 
    data: { type: 'Module', mod } 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 2 : 1,
    position: 'relative',
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', paddingTop: 4, color: '#94a3b8' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};const parseDurationToSeconds = (durStr) => {
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

export default function AdminCourseBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('curriculum') // 'curriculum' | 'settings'
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

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

      setFormData(prev => ({ ...prev, cover_image: publicUrl }))
    } catch (err) {
      alert('Error uploading image: ' + err.message + '\n\nMake sure you have created a public bucket named "course-assets" in your Supabase storage dashboard.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Draft / Form memory state indicators
  const [showCourseDraftBanner, setShowCourseDraftBanner] = useState(false)
  const [showLessonDraftBanner, setShowLessonDraftBanner] = useState(false)

  // Course Details State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    level: 'beginner',
    is_published: false,
    preview_video: '',
    cover_image: '',
    what_you_learn: [],
    slug: '',
    meta_title: '',
    meta_desc: '',
    bonuses: [] // Array of bonus strings shown in checkout
  })

  // Curriculum State
  const [modules, setModules] = useState([])
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState('')
  const [showAddModuleModal, setShowAddModuleModal] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  // Lesson State
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [addingLessonToModule, setAddingLessonToModule] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video',
    video_url: '',
    duration: '10m',
    overview: '',
    is_free_preview: false,
    quiz_questions: [],
    attachments: []
  })

  // Local helper states for editing lists in modal
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionOptions, setNewQuestionOptions] = useState(['', '', '', ''])
  const [newQuestionCorrect, setNewQuestionCorrect] = useState(0)

  const [newAttachmentName, setNewAttachmentName] = useState('')
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('')

  // Bulk lesson import state
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkModuleId, setBulkModuleId] = useState(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)

  // Draft persistence helper methods
  const handleRestoreCourseDraft = () => {
    const savedDraft = localStorage.getItem(`draft_course_${id}`)
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft))
        setShowCourseDraftBanner(false)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleDiscardCourseDraft = () => {
    localStorage.removeItem(`draft_course_${id}`)
    setShowCourseDraftBanner(false)
  }

  const checkLessonDraft = (isEditMode, lessonId) => {
    const savedDraft = localStorage.getItem(`draft_lesson_${id}`)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        const targetMode = isEditMode ? lessonId : 'new'
        if (parsed.editingLessonId === targetMode) {
          setShowLessonDraftBanner(true)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleRestoreLessonDraft = () => {
    const savedDraft = localStorage.getItem(`draft_lesson_${id}`)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        const { editingLessonId, ...rest } = parsed
        setLessonForm(rest)
        setShowLessonDraftBanner(false)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleDiscardLessonDraft = () => {
    localStorage.removeItem(`draft_lesson_${id}`)
    setShowLessonDraftBanner(false)
  }

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'Module' && overType === 'Module') {
      const oldIndex = modules.findIndex(m => `module-${m.id}` === active.id);
      const newIndex = modules.findIndex(m => `module-${m.id}` === over.id);

      const newModules = arrayMove(modules, oldIndex, newIndex);
      setModules(newModules);

      try {
        await Promise.all(newModules.map((m, index) => 
          supabase.from('modules').update({ order_index: index }).eq('id', m.id)
        ));
      } catch (err) {
        console.error('Error updating module order:', err);
      }
    } else if (activeType === 'Lesson' && overType === 'Lesson') {
      const activeLesson = active.data.current?.lesson;
      const overLesson = over.data.current?.lesson;

      if (activeLesson.module_id === overLesson.module_id) {
        const modIndex = modules.findIndex(m => m.id === activeLesson.module_id);
        const mod = modules[modIndex];

        const oldIndex = mod.lessons.findIndex(l => `lesson-${l.id}` === active.id);
        const newIndex = mod.lessons.findIndex(l => `lesson-${l.id}` === over.id);

        const newLessons = arrayMove(mod.lessons, oldIndex, newIndex);
        
        const newModules = [...modules];
        newModules[modIndex] = { ...mod, lessons: newLessons };
        setModules(newModules);

        try {
          await Promise.all(newLessons.map((l, index) => 
            supabase.from('lessons').update({ order_index: index }).eq('id', l.id)
          ));
        } catch (err) {
          console.error('Error updating lesson order:', err);
        }
      }
    }
  };

  const loadCourse = async () => {
    setLoading(true)
    try {
      const { data: courseData, error: cErr } = await supabase
        .from('courses')
        .select('*, products(*)')
        .eq('id', id)
        .single()

      if (cErr) throw cErr

      if (courseData) {
        const dbData = {
          title: courseData.products?.title || '',
          description: courseData.products?.description || '',
          price: courseData.products?.price || 0,
          level: courseData.level || 'beginner',
          is_published: courseData.products?.is_published || false,
          preview_video: courseData.preview_video || '',
          cover_image: courseData.products?.cover_image || '',
          what_you_learn: Array.isArray(courseData.what_you_learn) ? courseData.what_you_learn : [],
          slug: courseData.products?.slug || '',
          meta_title: courseData.products?.meta_title || '',
          meta_desc: courseData.products?.meta_desc || '',
          bonuses: Array.isArray(courseData.products?.features) ? courseData.products.features : []
        }

        // Check if a different local storage draft settings exists
        const savedDraft = localStorage.getItem(`draft_course_${id}`)
        if (savedDraft) {
          try {
            const draftParsed = JSON.parse(savedDraft)
            const isDifferent = Object.keys(dbData).some(key => dbData[key] !== draftParsed[key])
            if (isDifferent) {
              setShowCourseDraftBanner(true)
            }
          } catch (e) {
            console.error(e)
          }
        }

        setFormData(dbData)
      }

      await reloadCurriculum()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const reloadCurriculum = async () => {
    const { data: mods } = await supabase
      .from('modules')
      .select('*, lessons(*)')
      .eq('course_id', id)
      .order('order_index', { ascending: true })

    if (mods) {
      mods.forEach(m => {
        m.lessons.sort((a, b) => a.order_index - b.order_index)
      })
      setModules(mods)
    }
  }

  useEffect(() => {
    loadCourse()
  }, [id])

  // Auto-save Course Settings draft when changed
  useEffect(() => {
    if (!loading && formData.title) {
      localStorage.setItem(`draft_course_${id}`, JSON.stringify(formData))
    }
  }, [formData, id, loading])

  // Auto-save Lesson draft when changed
  useEffect(() => {
    if (showLessonModal && lessonForm.title) {
      localStorage.setItem(`draft_lesson_${id}`, JSON.stringify({
        ...lessonForm,
        editingLessonId: editingLesson?.id || 'new'
      }))
    }
  }, [lessonForm, showLessonModal, id, editingLesson])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const { error: pErr } = await supabase
        .from('products')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: parseInt(formData.price) || 0,
          cover_image: formData.cover_image.trim(),
          is_published: formData.is_published,
          slug: formData.slug.trim(),
          meta_title: formData.meta_title.trim() || null,
          meta_desc: formData.meta_desc.trim() || null,
          features: Array.isArray(formData.bonuses) ? formData.bonuses.filter(b => b.trim()) : []
        })
        .eq('id', id)

      if (pErr) throw pErr

      const { error: cErr } = await supabase
        .from('courses')
        .update({
          level: formData.level,
          preview_video: formData.preview_video.trim(),
          what_you_learn: Array.isArray(formData.what_you_learn) ? formData.what_you_learn.filter(x => x.trim()) : []
        })
        .eq('id', id)

      localStorage.removeItem(`draft_course_${id}`)
      setShowCourseDraftBanner(false)
      setMessage('Course configurations updated!')
      setTimeout(() => setMessage(''), 3000)
      loadCourse()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddModule = async (e) => {
    e.preventDefault()
    if (!newModuleTitle.trim()) return

    try {
      const { error } = await supabase
        .from('modules')
        .insert({
          course_id: id,
          title: newModuleTitle.trim(),
          order_index: modules.length
        })

      if (error) throw error
      setNewModuleTitle('')
      setShowAddModuleModal(false)
      reloadCurriculum()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdateModule = async (moduleId) => {
    if (!editingModuleTitle.trim()) return
    try {
      const { error } = await supabase
        .from('modules')
        .update({ title: editingModuleTitle.trim() })
        .eq('id', moduleId)

      if (error) throw error
      setEditingModuleId(null)
      reloadCurriculum()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteModule = async (moduleId) => {
    if (!confirm("Are you sure you want to delete this module? All lessons within will be permanently removed.")) return
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error
      reloadCurriculum()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleOpenAddLesson = (moduleId) => {
    setAddingLessonToModule(moduleId)
    setEditingLesson(null)
    setLessonForm({
      title: '',
      type: 'video',
      video_url: '',
      duration: '10m',
      overview: '',
      is_free_preview: false,
      quiz_questions: [],
      attachments: []
    })
    setNewQuestionText('')
    setNewQuestionOptions(['', '', '', ''])
    setNewQuestionCorrect(0)
    setNewAttachmentName('')
    setNewAttachmentUrl('')
    setShowLessonDraftBanner(false)
    checkLessonDraft(false)
    setShowLessonModal(true)
  }

  const handleOpenEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setAddingLessonToModule(null)
    
    // Parse resources column for quiz questions and attachments
    const resData = lesson.resources || {}
    const questions = Array.isArray(resData.questions) ? resData.questions : []
    const files = Array.isArray(resData.attachments) ? resData.attachments : []

    setLessonForm({
      title: lesson.title || '',
      type: lesson.type || 'video',
      video_url: lesson.video_url || '',
      duration: lesson.duration || '10m',
      overview: lesson.overview || '',
      is_free_preview: lesson.is_free_preview || false,
      quiz_questions: questions,
      attachments: files
    })

    setNewQuestionText('')
    setNewQuestionOptions(['', '', '', ''])
    setNewQuestionCorrect(0)
    setNewAttachmentName('')
    setNewAttachmentUrl('')
    setShowLessonDraftBanner(false)
    checkLessonDraft(true, lesson.id)
    setShowLessonModal(true)
  }

  const handleSaveLesson = async (e) => {
    e.preventDefault()
    if (!lessonForm.title.trim()) return

    const payload = {
      title: lessonForm.title.trim(),
      type: lessonForm.type,
      video_url: lessonForm.type === 'video' ? lessonForm.video_url.trim() : '',
      duration: lessonForm.duration.trim(),
      overview: lessonForm.overview.trim(),
      is_free_preview: lessonForm.is_free_preview,
      resources: {
        questions: lessonForm.type === 'quiz' ? lessonForm.quiz_questions : [],
        attachments: lessonForm.attachments
      }
    }

    try {
      if (addingLessonToModule) {
        const mod = modules.find(m => m.id === addingLessonToModule)
        const orderIdx = mod?.lessons?.length || 0
        const { error } = await supabase
          .from('lessons')
          .insert({
            ...payload,
            module_id: addingLessonToModule,
            order_index: orderIdx
          })
        if (error) throw error
      } else if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(payload)
          .eq('id', editingLesson.id)
        if (error) throw error
      }

      localStorage.removeItem(`draft_lesson_${id}`)
      setShowLessonDraftBanner(false)
      setShowLessonModal(false)
      reloadCurriculum()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
      if (error) throw error
      reloadCurriculum()
    } catch (err) {
      alert(err.message)
    }
  }

  // Quiz helper handlers
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return
    const newQuestion = {
      question: newQuestionText.trim(),
      options: [...newQuestionOptions],
      correct_index: newQuestionCorrect
    }
    setLessonForm({
      ...lessonForm,
      quiz_questions: [...lessonForm.quiz_questions, newQuestion]
    })
    setNewQuestionText('')
    setNewQuestionOptions(['', '', '', ''])
    setNewQuestionCorrect(0)
  }

  const handleRemoveQuestion = (idx) => {
    setLessonForm({
      ...lessonForm,
      quiz_questions: lessonForm.quiz_questions.filter((_, i) => i !== idx)
    })
  }

  // Attachment helper handlers
  const handleAddAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return
    const newFile = {
      name: newAttachmentName.trim(),
      url: newAttachmentUrl.trim()
    }
    setLessonForm({
      ...lessonForm,
      attachments: [...lessonForm.attachments, newFile]
    })
    setNewAttachmentName('')
    setNewAttachmentUrl('')
  }

  const handleRemoveAttachment = (idx) => {
    setLessonForm({
      ...lessonForm,
      attachments: lessonForm.attachments.filter((_, i) => i !== idx)
    })
  }

  // Bulk import handler: parse lines like "Title | duration"
  const handleBulkImport = async (e) => {
    e.preventDefault()
    if (!bulkModuleId || !bulkText.trim()) return
    setBulkImporting(true)
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const mod = modules.find(m => m.id === bulkModuleId)
    let orderIdx = mod?.lessons?.length || 0
    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim())
      const title = parts[0]
      const duration = parts[1] || '10m'
      if (!title) continue
      await supabase.from('lessons').insert({
        module_id: bulkModuleId,
        title,
        type: 'video',
        duration,
        order_index: orderIdx++
      })
    }
    setBulkText('')
    setShowBulkModal(false)
    setBulkImporting(false)
    reloadCurriculum()
  }

  if (loading) return <div style={{ padding: 40, color: '#697386', fontSize: 13, textAlign: 'center' }}>Loading Curriculum Builder...</div>

  const isMobile = windowWidth < 768

  return (
    <div>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>{formData.title || 'Course Curriculum'}</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Add curriculum content, modules, dynamic quizzes, and download attachments.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/courses')}
          style={{ background: '#f7f8f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 500, fontSize: 13, color: '#4f566b' }}
        >
          ← Back
        </button>
      </div>

      {message && <div style={{ padding: 12, background: '#e3fcef', color: '#00875a', borderRadius: 4, marginBottom: 24, fontWeight: 500, fontSize: 13 }}>{message}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: 24, gap: 16 }}>
        <button 
          onClick={() => setActiveTab('curriculum')}
          style={{ 
            background: 'none', border: 'none', padding: '10px 4px', fontWeight: 500, fontSize: 14, cursor: 'pointer',
            color: activeTab === 'curriculum' ? '#2563eb' : '#697386',
            borderBottom: activeTab === 'curriculum' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -1
          }}
        >
          Curriculum Builder
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ 
            background: 'none', border: 'none', padding: '10px 4px', fontWeight: 500, fontSize: 14, cursor: 'pointer',
            color: activeTab === 'settings' ? '#2563eb' : '#697386',
            borderBottom: activeTab === 'settings' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -1
          }}
        >
          Course Settings
        </button>
      </div>

      {/* Tab Content: Curriculum */}
      {activeTab === 'curriculum' && (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Syllabus Outline</h3>
              <button 
                onClick={() => setShowAddModuleModal(true)}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                + Add Module
              </button>
            </div>

            {modules.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, color: '#697386', fontSize: 13 }}>
                No modules created yet. Add one to structure your lessons.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={modules.map(m => `module-${m.id}`)} strategy={verticalListSortingStrategy}>
                  {modules.map(mod => (
                    <SortableModule key={`module-${mod.id}`} mod={mod}>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 12, gap: isMobile ? 8 : 12 }}>
                    {editingModuleId === mod.id ? (
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, flex: 1, width: '100%' }}>
                        <input 
                          type="text" 
                          value={editingModuleTitle} 
                          onChange={e => setEditingModuleTitle(e.target.value)} 
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4, width: '100%' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleUpdateModule(mod.id)} style={{ background: '#00875a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Save</button>
                          <button onClick={() => setEditingModuleId(null)} style={{ background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1f36', wordBreak: 'break-all' }}>{mod.title}</h4>
                        <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                          <button 
                            onClick={() => { setEditingModuleId(mod.id); setEditingModuleTitle(mod.title) }}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Rename
                          </button>
                          <button 
                            onClick={() => handleDeleteModule(mod.id)}
                            style={{ background: 'none', border: 'none', color: '#ae2a19', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Lessons inside Module */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {mod.lessons?.length === 0 ? (
                      <div style={{ color: '#8792a2', fontSize: 12, fontStyle: 'italic', padding: '8px 0' }}>No lessons inside this module.</div>
                    ) : (
                      <SortableContext items={(mod.lessons || []).map(l => `lesson-${l.id}`)} strategy={verticalListSortingStrategy}>
                        {mod.lessons?.map(les => (
                          <SortableLesson key={`lesson-${les.id}`} lesson={les}>
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', background: '#f7f8f9', padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1', gap: isMobile ? 8 : 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <span style={{ fontSize: 11, background: les.type === 'video' ? '#e3fcef' : les.type === 'quiz' ? '#fff0b3' : '#e6e6fa', color: les.type === 'video' ? '#00875a' : les.type === 'quiz' ? '#976400' : '#4b0082', padding: '2px 6px', borderRadius: 3, fontWeight: 600, textTransform: 'uppercase' }}>
                                  {les.type}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: '#3c4257' }}>{les.title}</span>
                                {les.is_free_preview && (
                                  <span style={{ fontSize: 10, background: '#e3fcef', color: '#00875a', padding: '1px 4px', borderRadius: 3, fontWeight: 500 }}>
                                    Free Preview
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', alignItems: 'center', borderTop: isMobile ? '1px solid #e2e8f0' : 'none', paddingTop: isMobile ? 8 : 0, marginTop: isMobile ? 4 : 0 }}>
                                <span style={{ fontSize: 12, color: '#697386', fontWeight: 500 }}>{les.duration}</span>
                                <div style={{ display: 'flex', gap: 12 }}>
                                  <button 
                                    onClick={() => handleOpenEditLesson(les)}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLesson(les.id)}
                                    style={{ background: 'none', border: 'none', color: '#ae2a19', fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </SortableLesson>
                        ))}
                      </SortableContext>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleOpenAddLesson(mod.id)}
                      style={{ flex: 1, background: 'none', border: '1px dashed #2563eb', color: '#2563eb', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}
                    >
                      + Add Lesson
                    </button>
                    <button 
                      onClick={() => { setBulkModuleId(mod.id); setBulkText(''); setShowBulkModal(true) }}
                      title="Bulk import multiple lessons at once"
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      Bulk Import
                    </button>
                  </div>
                </SortableModule>
              ))}
              </SortableContext>
            </DndContext>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Settings */}
      {activeTab === 'settings' && (
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1f36', marginBottom: 20 }}>Configure Course Information</h3>
          {showCourseDraftBanner && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>You have an unsaved draft from a previous session.</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={handleRestoreCourseDraft} style={{ background: '#d97706', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, fontWeight: 500 }}>Restore Draft</button>
                <button type="button" onClick={handleDiscardCourseDraft} style={{ background: 'none', border: 'none', color: '#78350f', textDecoration: 'underline', cursor: 'pointer', fontSize: 11.5 }}>Discard</button>
              </div>
            </div>
          )}
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Course Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Custom Slug / URL Segment *</label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Enter course description. Use double line breaks to start new paragraphs."
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, minHeight: 220, lineHeight: 1.5, resize: 'vertical' }} 
              />
              <p style={{ fontSize: 11, color: '#697386', marginTop: 4 }}>
                💡 Tip: Press Enter twice to create paragraph breaks. This will be formatted automatically on the product details page.
              </p>
            </div>

            {/* Advanced Phase 2 SEO configurations */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>SEO Meta Title</label>
                <input 
                  type="text" 
                  value={formData.meta_title} 
                  onChange={e => setFormData({ ...formData, meta_title: e.target.value })} 
                  placeholder="e.g. Master React in 30 Days"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>SEO Meta Description</label>
                <input 
                  type="text" 
                  value={formData.meta_desc} 
                  onChange={e => setFormData({ ...formData, meta_desc: e.target.value })} 
                  placeholder="e.g. The definitive handbook detailing React workflows..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Price (NGN) *</label>
                <input 
                  type="number" 
                  value={formData.price} 
                  onChange={e => setFormData({ ...formData, price: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Target Audience Difficulty *</label>
                <select 
                  value={formData.level} 
                  onChange={e => setFormData({ ...formData, level: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Cover Image URL</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input 
                    type="url" 
                    value={formData.cover_image} 
                    onChange={e => setFormData({ ...formData, cover_image: e.target.value })} 
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  />
                  <label style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#334155', whiteSpace: 'nowrap' }}>
                    Upload File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {uploadingImage && <span style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>Uploading image...</span>}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Preview Video URL</label>
                <input 
                  type="url" 
                  value={formData.preview_video} 
                  onChange={e => setFormData({ ...formData, preview_video: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Syllabus Highlights</label>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Add key highlights of what students will learn inside the syllabus.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(formData.what_you_learn || []).map((highlight, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={highlight}
                      placeholder={`Highlight ${idx + 1}`}
                      onChange={e => {
                        const updated = [...(formData.what_you_learn || [])]
                        updated[idx] = e.target.value
                        setFormData({ ...formData, what_you_learn: updated })
                      }}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'var(--font)' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.what_you_learn || []).filter((_, i) => i !== idx)
                        setFormData({ ...formData, what_you_learn: updated })
                      }}
                      style={{ padding: '7px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                    >✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, what_you_learn: [...(formData.what_you_learn || []), ''] })}
                  style={{ alignSelf: 'flex-start', padding: '7px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                >
                  + Add Syllabus Highlight
                </button>
              </div>
            </div>

            {/* ── Checkout Bonuses ─────────────────────────────────── */}
            <div>
              <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4, color: '#3c4257' }}>Checkout Bonuses</label>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>These appear in the checkout order summary. Leave empty to hide the bonuses section.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(formData.bonuses || []).map((bonus, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={bonus}
                      placeholder={`Bonus ${idx + 1} (e.g. Lifetime Access)`}
                      onChange={e => {
                        const updated = [...(formData.bonuses || [])]
                        updated[idx] = e.target.value
                        setFormData({ ...formData, bonuses: updated })
                      }}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'var(--font)' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.bonuses || []).filter((_, i) => i !== idx)
                        setFormData({ ...formData, bonuses: updated })
                      }}
                      style={{ padding: '7px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                    >✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bonuses: [...(formData.bonuses || []), ''] })}
                  style={{ alignSelf: 'flex-start', padding: '7px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                >
                  + Add Bonus
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="checkbox" 
                id="is_published" 
                checked={formData.is_published} 
                onChange={e => setFormData({ ...formData, is_published: e.target.checked })} 
                style={{ width: 14, height: 14 }} 
              />
              <label htmlFor="is_published" style={{ fontWeight: 500, fontSize: 13, color: '#3c4257' }}>Publish Course</label>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 4, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13 }}
            >
              {saving ? 'Saving changes...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Add Module */}
      {showAddModuleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: '32px 28px', borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>Add Syllabus Module</h3>
            <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Module Title *</label>
                <input 
                  type="text" 
                  value={newModuleTitle} 
                  onChange={e => setNewModuleTitle(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                  placeholder="e.g. Introduction to HTML"
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '8px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Create Module</button>
                <button type="button" onClick={() => setShowAddModuleModal(false)} style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '8px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Lesson */}
      {showLessonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="no-scrollbar" style={{ background: '#fff', padding: isMobile ? '28px 20px' : '32px 28px', borderRadius: 12, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {editingLesson ? 'Edit Lesson Parameters' : 'Add Lesson to Module'}
            </h3>
            {showLessonDraftBanner && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 6, fontSize: 12.5, color: '#92400e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Restore unsaved lesson draft?</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={handleRestoreLessonDraft} style={{ background: '#d97706', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Restore</button>
                  <button type="button" onClick={handleDiscardLessonDraft} style={{ background: 'none', border: 'none', color: '#78350f', textDecoration: 'underline', cursor: 'pointer', fontSize: 11 }}>Discard</button>
                </div>
              </div>
            )}
            <form onSubmit={handleSaveLesson} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Lesson Title *</label>
                <input 
                  type="text" 
                  value={lessonForm.title} 
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Format *</label>
                  <select 
                    value={lessonForm.type} 
                    onChange={e => setLessonForm({ ...lessonForm, type: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }}
                  >
                    <option value="video">Video Lecture</option>
                    <option value="article">Article Document</option>
                    <option value="quiz">Interactive Quiz</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Duration (e.g. 15m) *</label>
                  <input 
                    type="text" 
                    value={lessonForm.duration} 
                    onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                    required 
                  />
                </div>
              </div>

              {lessonForm.type === 'video' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Video Embed Code or URL</label>
                  <textarea 
                    value={lessonForm.video_url} 
                    onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, minHeight: 80, fontFamily: 'monospace', resize: 'vertical' }} 
                    placeholder={`Paste Wistia embed code OR a video URL.\nExample embed: <iframe src=\"https://fast.wistia.net/embed/iframe/abc123\" ...></iframe>\nExample URL: https://fast.wistia.net/embed/iframe/abc123`}
                  />
                  <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>Wistia: Copy the "Embed Code" from your Wistia video. You can also paste a plain URL.</p>
                </div>
              )}

              {/* Advanced Phase 2 Interactive Quiz Builder */}
              {lessonForm.type === 'quiz' && (
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Quiz Questions Builder</h4>
                  
                  {/* Current questions list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {lessonForm.quiz_questions.map((q, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>Q{idx + 1}: {q.question}</div>
                          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                            Options: {q.options.filter(Boolean).join(', ')} &bull; Correct: Option {String.fromCharCode(65 + q.correct_index)}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add question subform */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', padding: 10, borderRadius: 4, border: '1px solid #cbd5e1' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#475569', marginBottom: 4 }}>New Question Text</label>
                      <input 
                        type="text"
                        value={newQuestionText}
                        onChange={e => setNewQuestionText(e.target.value)}
                        placeholder="e.g. Which keyword defines a React hook?"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {newQuestionOptions.map((opt, oIdx) => (
                        <div key={oIdx}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#475569', marginBottom: 2 }}>Option {String.fromCharCode(65 + oIdx)}</label>
                          <input 
                            type="text"
                            value={opt}
                            onChange={e => {
                              const opts = [...newQuestionOptions]
                              opts[oIdx] = e.target.value
                              setNewQuestionOptions(opts)
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div>
                        <label style={{ marginRight: 6, fontSize: 11.5, fontWeight: 500, color: '#475569' }}>Correct Answer:</label>
                        <select 
                          value={newQuestionCorrect}
                          onChange={e => setNewQuestionCorrect(parseInt(e.target.value))}
                          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                        >
                          <option value={0}>Option A</option>
                          <option value={1}>Option B</option>
                          <option value={2}>Option C</option>
                          <option value={3}>Option D</option>
                        </select>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddQuestion}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                      >
                        + Add Question
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Downloadable resource attachments */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#334155' }}>Downloadable Resources & Files</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {lessonForm.attachments?.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 12 }}>
                      <span style={{ color: '#334155', fontWeight: 500 }}>{file.name}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr auto', gap: 8, alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 2 }}>File Name</label>
                    <input 
                      type="text" 
                      value={newAttachmentName}
                      onChange={e => setNewAttachmentName(e.target.value)}
                      placeholder="e.g. React Cheatsheet"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 2 }}>Download URL</label>
                    <input 
                      type="url" 
                      value={newAttachmentUrl}
                      onChange={e => setNewAttachmentUrl(e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddAttachment}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Content Details / Overview</label>
                <textarea 
                  value={lessonForm.overview} 
                  onChange={e => setLessonForm({ ...lessonForm, overview: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 70 }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="checkbox" 
                  id="is_free_preview" 
                  checked={lessonForm.is_free_preview} 
                  onChange={e => setLessonForm({ ...lessonForm, is_free_preview: e.target.checked })} 
                  style={{ width: 14, height: 14 }} 
                />
                <label htmlFor="is_free_preview" style={{ fontWeight: 500, fontSize: 13, color: '#3c4257' }}>Enable Free Preview</label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Save Lesson</button>
                <button 
                  type="button" 
                  onClick={() => setShowLessonModal(false)} 
                  style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Bulk Lesson Import */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: '32px 28px', borderRadius: 12, width: '100%', maxWidth: 520, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>Bulk Import Lessons</h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Add one lesson per line. Format: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>Lesson Title | duration</code>
              </p>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#1e40af' }}>
              <strong>Example:</strong><br />
              Introduction to Web Design | 10m<br />
              HTML Fundamentals | 20m<br />
              CSS Grid and Flexbox | 25m<br />
              JavaScript Basics | 30m
            </div>
            <form onSubmit={handleBulkImport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={"Lesson Title | duration\nAnother Lesson | 15m\n..."}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 160, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={bulkImporting || !bulkText.trim()} style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: bulkImporting ? 'not-allowed' : 'pointer', fontSize: 13, opacity: (!bulkText.trim() || bulkImporting) ? 0.6 : 1 }}>
                  {bulkImporting ? 'Importing...' : `Import Lessons`}
                </button>
                <button type="button" onClick={() => setShowBulkModal(false)} style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '10px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
