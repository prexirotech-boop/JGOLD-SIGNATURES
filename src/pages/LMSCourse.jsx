import { useState, useEffect } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/UserMenu'
import { supabase } from '../lib/supabase'

const isRawVideo = (url) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v');
};

const getEmbedUrlOrHtml = (videoInput) => {
  if (!videoInput) return '';
  const input = videoInput.trim();
  
  // Try to match Wistia ID anywhere in the input (URL, class name, script path, iframe src, etc.)
  const wistiaMatch = input.match(/wistia_async_([a-zA-Z0-9]+)/) ||
                      input.match(/embed\/medias\/([a-zA-Z0-9]+)/) ||
                      input.match(/wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/) ||
                      input.match(/fast\.wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9]+)/) ||
                      input.match(/media-id=["']([a-zA-Z0-9]+)["']/i);
  if (wistiaMatch) {
    return `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}?doNotTrack=true`;
  }

  // 1. If it's a plain URL
  if (input.startsWith('http') && !input.includes('<')) {
    return input;
  }
  
  // 2. If it's HTML (contains an iframe or other tags)
  if (input.includes('<')) {
    // If there is an iframe, try to extract its src (excluding script src's like .js or .jsonp)
    const iframeMatch = input.match(/<iframe[^>]*src=["']([^"']+)["']/i);
    if (iframeMatch) {
      let src = iframeMatch[1];
      if (src.startsWith('//')) src = 'https:' + src;
      return src;
    }
    
    // Fallback: return the HTML directly
    return input;
  }
  
  return input;
};

export default function LMSCourse() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  // Impersonation state
  const impersonatedStr = localStorage.getItem('impersonatedUser')
  const impersonatedUser = impersonatedStr ? JSON.parse(impersonatedStr) : null

  // Compute effective user context (uses student credentials if impersonation is active)
  const effectiveUser = impersonatedUser ? {
    id: impersonatedUser.id,
    email: impersonatedUser.email,
    user_metadata: { full_name: impersonatedUser.full_name }
  } : user

  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin'
  
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [savedProgress, setSavedProgress] = useState([])
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theaterMode, setTheaterMode] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview, resources
  const [expandedModules, setExpandedModules] = useState({})

  // Q&A tab state and details
  const [rightSidebarTab, setRightSidebarTab] = useState('lessons') // lessons, qna
  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [newAnswerText, setNewAnswerText] = useState({})
  const [submittingAnswer, setSubmittingAnswer] = useState({})

  // Interactive Quiz State
  const [selectedOptions, setSelectedOptions] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  // Course Completion & Rating State
  const [userReview, setUserReview] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasTriggeredReviewModal, setHasTriggeredReviewModal] = useState(false)

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const isMobile = windowWidth < 768

  // Reset quiz state when changing lesson and restore question draft
  useEffect(() => {
    setSelectedOptions({})
    setQuizSubmitted(false)
    setQuizScore(0)
    
    if (lessonId) {
      const saved = localStorage.getItem(`draft_student_qna_question_${lessonId}`)
      setNewQuestionText(saved || '')
    } else {
      setNewQuestionText('')
    }
  }, [lessonId])



  // Sync review drafts when course changes
  useEffect(() => {
    if (courseId) {
      const savedText = localStorage.getItem(`draft_review_text_${courseId}`)
      setReviewText(savedText || '')
      const savedRating = localStorage.getItem(`draft_review_rating_${courseId}`)
      setReviewRating(savedRating ? parseInt(savedRating) : 5)
    }
  }, [courseId])

  // Restore inline answer drafts when questions load
  useEffect(() => {
    if (questions && questions.length > 0) {
      const updated = { ...newAnswerText }
      let changed = false
      questions.forEach(q => {
        if (!updated[q.id]) {
          const saved = localStorage.getItem(`draft_student_qna_answer_${q.id}`)
          if (saved) {
            updated[q.id] = saved
            changed = true
          }
        }
      })
      if (changed) {
        setNewAnswerText(updated)
      }
    }
  }, [questions])

  const handleNewQuestionTextChange = (val) => {
    setNewQuestionText(val)
    if (lessonId) {
      localStorage.setItem(`draft_student_qna_question_${lessonId}`, val)
    }
  }

  const handleNewAnswerTextChange = (questionId, val) => {
    setNewAnswerText(prev => ({ ...prev, [questionId]: val }))
    localStorage.setItem(`draft_student_qna_answer_${questionId}`, val)
  }

  const handleReviewRatingChange = (val) => {
    setReviewRating(val)
    if (courseId) {
      localStorage.setItem(`draft_review_rating_${courseId}`, String(val))
    }
  }

  const handleReviewTextChange = (val) => {
    setReviewText(val)
    if (courseId) {
      localStorage.setItem(`draft_review_text_${courseId}`, val)
    }
  }

  // Q&A fetcher
  const fetchQuestions = async () => {
    if (!lessonId) return
    setQuestionsLoading(true)
    try {
      const { data, error } = await supabase
        .from('qna_questions')
        .select(`
          *,
          profiles(full_name),
          qna_answers (
            *,
            profiles(full_name)
          )
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
      if (!error && data) {
        const sorted = data.map(q => {
          if (q.qna_answers) {
            q.qna_answers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          }
          return q
        })
        setQuestions(sorted)
      }
    } catch (err) {
      console.error('Error fetching QnA questions:', err)
    } finally {
      setQuestionsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [lessonId])

  const handleAskQuestion = async (e) => {
    e.preventDefault()
    if (!newQuestionText.trim() || !effectiveUser) return
    setSubmittingQuestion(true)
    try {
      const { error } = await supabase
        .from('qna_questions')
        .insert({
          user_id: effectiveUser.id,
          course_id: courseId,
          lesson_id: lessonId,
          question: newQuestionText.trim()
        })
      if (!error) {
        localStorage.removeItem(`draft_student_qna_question_${lessonId}`)
        setNewQuestionText('')
        await fetchQuestions()
      } else {
        alert(error.message)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingQuestion(false)
    }
  }

  const handlePostAnswer = async (e, questionId) => {
    e.preventDefault()
    const ansText = newAnswerText[questionId]
    if (!ansText || !ansText.trim() || !effectiveUser) return
    setSubmittingAnswer(prev => ({ ...prev, [questionId]: true }))
    try {
      const { error } = await supabase
        .from('qna_answers')
        .insert({
          question_id: questionId,
          author_id: effectiveUser.id,
          answer: ansText.trim()
        })
      if (!error) {
        localStorage.removeItem(`draft_student_qna_answer_${questionId}`)
        setNewAnswerText(prev => ({ ...prev, [questionId]: '' }))
        await fetchQuestions()
      } else {
        alert(error.message)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingAnswer(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!effectiveUser || !courseId) return
    setSubmittingReview(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: effectiveUser.id,
          course_id: courseId,
          rating: reviewRating,
          review_text: reviewText.trim()
        })
      if (!error) {
        localStorage.removeItem(`draft_review_text_${courseId}`)
        localStorage.removeItem(`draft_review_rating_${courseId}`)
        setUserReview({ rating: reviewRating, review_text: reviewText })
        setShowReviewModal(false)
        alert('Thank you for your feedback!')
      } else {
        alert(error.message)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleSelectOption = (qIdx, optIdx) => {
    if (quizSubmitted) return
    setSelectedOptions(prev => ({
      ...prev,
      [qIdx]: optIdx
    }))
  }

  const handleSubmitQuiz = () => {
    const quizQuestions = (lesson && lesson.type === 'quiz' && lesson.resources && Array.isArray(lesson.resources.questions)) ? lesson.resources.questions : []
    let correctCount = 0
    quizQuestions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct_index) {
        correctCount++
      }
    })
    setQuizScore(correctCount)
    setQuizSubmitted(true)
  }

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [lessonId])

  useEffect(() => {
    async function fetchData() {
      if (!effectiveUser || !courseId) return
      let enr = null
      try {
        // 1. Check enrollment — admins bypass this check
        if (isAdmin) {
          // Admin: fetch course info directly without enrollment
          const { data: courseData, error: courseErr } = await supabase
            .from('courses')
            .select('id, instructor')
            .eq('id', courseId)
            .single()
          
          if (courseErr || !courseData) { navigate('/admin/courses'); return }

          const { data: prodData } = await supabase
            .from('products')
            .select('title')
            .eq('id', courseId)
            .single()

          setCourse({
            id: courseData.id,
            title: prodData?.title || 'Course',
            instructor: courseData.instructor
          })
          setSavedProgress([])
        } else {
          const { data: enrData, error: enrError } = await supabase
            .from('enrollments')
            .select('progress, course_id')
            .eq('user_id', effectiveUser.id)
            .eq('course_id', courseId)
            .single()

          if (enrError || !enrData) {
             navigate('/dashboard')
             return
          }
          enr = enrData

          const { data: courseData } = await supabase
            .from('courses')
            .select('id, instructor')
            .eq('id', courseId)
            .single()

          const { data: prodData } = await supabase
            .from('products')
            .select('title')
            .eq('id', courseId)
            .single()
          
          setCourse({
            id: enr.course_id,
            title: prodData?.title || 'Course',
            instructor: courseData?.instructor || 'Instructor'
          })
          setSavedProgress(enr.progress || [])
        }

        // 2. Fetch Modules & Lessons
        const { data: mods, error: modsError } = await supabase
          .from('modules')
          .select('*, lessons(*)')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })
          
        if (modsError) throw modsError

        // Sort lessons inside modules
        mods.forEach(m => m.lessons.sort((a,b) => a.order_index - b.order_index))
        setModules(mods)

        // 3. Fetch existing review
        const { data: revData } = await supabase
          .from('reviews')
          .select('*')
          .eq('user_id', effectiveUser.id)
          .eq('course_id', courseId)
          .maybeSingle()
        if (revData) {
          setUserReview(revData)
        }

        // 4. Locked lesson progression enforcement
        const allL = mods.flatMap(m => m.lessons || [])
        const progressList = isAdmin ? [] : (enr?.progress || [])
        
        if (lessonId && !isAdmin) {
          const globalIdx = allL.findIndex(l => l.id === lessonId)
          if (globalIdx > 0) {
            const hasUncompletedPrev = allL.slice(0, globalIdx).some(l => !progressList.includes(l.id))
            if (hasUncompletedPrev) {
              const firstUncompleted = allL.find(l => !progressList.includes(l.id))
              if (firstUncompleted) {
                navigate(`/course/${courseId}/${firstUncompleted.id}`, { replace: true })
                return
              }
            }
          }
        }

        // Auto-expand current module
        if (lessonId) {
          const mod = mods.find(m => m.lessons.some(l => l.id === lessonId))
          if (mod) {
            setExpandedModules(prev => ({ ...prev, [mod.id]: true }))
          }
        } else {
          // No lessonId? Route to first lesson or first uncompleted
          const firstUncompleted = allL.find(l => !progressList.includes(l.id))
          const targetLesson = firstUncompleted || (allL[0])
          if (targetLesson) {
            navigate(`/course/${courseId}/${targetLesson.id}`, { replace: true })
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) fetchData()
  }, [effectiveUser, courseId, lessonId, authLoading, navigate])

  const markLessonComplete = async (targetId, andNavigateTo = null) => {
    if (!effectiveUser || isAdmin) {
      if (andNavigateTo) navigate(andNavigateTo)
      return
    }
    
    let newProgress = savedProgress
    if (!savedProgress.includes(targetId)) {
      newProgress = [...savedProgress, targetId]
      setSavedProgress(newProgress)
      
      try {
        await supabase
          .from('enrollments')
          .update({ progress: newProgress })
          .eq('user_id', effectiveUser.id)
          .eq('course_id', courseId)
      } catch (err) {
        console.error('Error saving progress:', err)
      }
    }
    
    if (andNavigateTo) {
      navigate(andNavigateTo)
    }
  }

  const toggleLessonCompletion = async (e, targetLessonId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!effectiveUser || isAdmin) return
    
    let newProgress
    if (savedProgress.includes(targetLessonId)) {
      newProgress = savedProgress.filter(id => id !== targetLessonId)
    } else {
      newProgress = [...savedProgress, targetLessonId]
    }
    
    setSavedProgress(newProgress)
    try {
      await supabase
        .from('enrollments')
        .update({ progress: newProgress })
        .eq('user_id', effectiveUser.id)
        .eq('course_id', courseId)
    } catch (err) {
      console.error('Error toggling progress:', err)
    }
  }

  const handlePrevClick = (e, prevId) => {
    e.preventDefault()
    navigate(`/course/${courseId}/${prevId}`)
  }

  const handleNextClick = (e, nextId) => {
    e.preventDefault()
    navigate(`/course/${courseId}/${nextId}`)
  }

  const handleFinishCourseClick = (e) => {
    e.preventDefault()
    const total = modules.reduce((a,c) => a + c.lessons.length, 0)
    if (total > 0 && savedProgress.length === total && !userReview) {
      setShowReviewModal(true)
    } else {
      navigate('/dashboard')
    }
  }

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }))
  }

  // Trigger course completion review modal
  useEffect(() => {
    if (loading || authLoading) return
    const total = modules.reduce((a,c) => a + c.lessons.length, 0)
    if (total > 0 && savedProgress.length === total && !userReview && !hasTriggeredReviewModal) {
      setShowReviewModal(true)
      setHasTriggeredReviewModal(true)
    }
  }, [savedProgress, modules, userReview, hasTriggeredReviewModal, loading, authLoading])

  if (authLoading || loading) return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#050b14', color: '#fff',
      fontFamily: "var(--font)", zIndex: 9999
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(24px)', animation: 'ambient-glow 3s ease-in-out infinite' }} />
        <img src="/logo.png" alt="Amplified Skills" style={{ height: 64, width: 'auto', maxWidth: 220, objectFit: 'contain', marginBottom: 36, filter: 'drop-shadow(0 0 10px rgba(37,99,235,0.15))', animation: 'logo-pulse 2.2s ease-in-out infinite' }} />
        <div className="premium-spinner" />
        <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '14px', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>Loading learning center...</p>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .premium-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.05);
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes logo-pulse {
          0%, 100% { transform: scale(0.97); opacity: 0.85; filter: drop-shadow(0 0 8px rgba(37,99,235,0.1)); }
          50% { transform: scale(1.03); opacity: 1; filter: drop-shadow(0 0 16px rgba(37,99,235,0.45)); }
        }
        @keyframes ambient-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  )
  if (!effectiveUser) return <Navigate to="/login" />
  
  const currentModule = modules.find(m => m.lessons.some(l => l.id === lessonId))
  const lesson = currentModule?.lessons.find(l => l.id === lessonId)

  if (!currentModule || !lesson) return (
    <div className="lms-not-found" style={{ textAlign: 'center', padding: '100px', background: '#f8fafc', height: '100vh', fontFamily: 'var(--font)' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', color: '#0b1329' }}>Lesson not found or course is empty.</h2>
      <Link to="/dashboard" style={{ color: '#2563eb', fontWeight: 'bold' }}>Back to Dashboard</Link>
    </div>
  )

  const allLessons = modules.flatMap(m => m.lessons || [])
  const currentLessonIndex = allLessons.findIndex(l => l.id === lessonId)
  const nextLesson = allLessons[currentLessonIndex + 1]
  const prevLesson = allLessons[currentLessonIndex - 1]
  
  const totalLessons = modules.reduce((a,c) => a + c.lessons.length, 0)
  const hasOverview = !!lesson.overview
  const hasResources = lesson.resources && lesson.resources.length > 0
  const shouldShowBottomPanel = hasOverview || hasResources

  return (
    <div className="lms-layout">
      {/* Impersonation Banner */}
      {impersonatedUser && (
        <div style={{ 
          background: 'linear-gradient(90deg, #2563eb 0%, #0b1329 100%)', 
          color: '#fff', 
          padding: '12px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          fontSize: 14, 
          fontWeight: 600, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 9999
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>Support POV: Viewing portal as student <strong>{impersonatedUser.full_name || 'Student'}</strong> ({impersonatedUser.email})</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('impersonatedUser')
              window.location.href = '/admin/users'
            }}
            style={{ 
              background: '#fff', 
              color: '#0b1329', 
              border: 'none', 
              padding: '6px 12px', 
              fontWeight: 700, 
              cursor: 'pointer',
              fontSize: 11,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            Exit POV Support
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="lms-nav" style={{ display: theaterMode ? 'none' : 'flex', background: '#0b1329', borderBottom: '1px solid #1e293b', height: 72, padding: '0 24px', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, position: 'relative' }}>
        <div className="lms-nav-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            type="button" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px 0',
              marginRight: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s',
              opacity: 0.85
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
            title="Toggle course syllabus"
          >
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              width: 20, height: 14, padding: 0, boxSizing: 'border-box',
              outline: 'none', position: 'relative'
            }}>
              <span style={{ width: 20, height: 2, background: 'currentColor', borderRadius: 10, transition: 'all 0.3s ease', transformOrigin: 'left center', transform: sidebarOpen ? 'rotate(45deg) translate(2px, -1px)' : 'none' }}></span>
              <span style={{ width: 20, height: 2, background: 'currentColor', borderRadius: 10, transition: 'all 0.3s ease', opacity: sidebarOpen ? 0 : 1, transform: sidebarOpen ? 'translateX(10px)' : 'none' }}></span>
              <span style={{ width: 20, height: 2, background: 'currentColor', borderRadius: 10, transition: 'all 0.3s ease', transformOrigin: 'left center', transform: sidebarOpen ? 'rotate(-45deg) translate(2px, 1px)' : 'none' }}></span>
            </div>
          </button>
          <Link to="/dashboard" className="lms-back-btn" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 26, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          </Link>
          <div className="lms-nav-divider" style={{ width: 1, height: 20, background: '#1e293b' }} />
          <h1 className="lms-course-title" style={{ fontSize: 15, color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 600, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 320 }}>
            {course?.title ? course.title.replace(/\s+slug$/i, '') : 'Course'}
          </h1>
        </div>
        
        <div className="lms-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="lms-progress-text" style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
            {savedProgress.length} / {totalLessons} completed
          </div>
          <UserMenu user={effectiveUser} />
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="lms-workspace" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Swapped Sidebar to the LEFT side of screen, collapsible on desktop and mobile */}
        {!theaterMode && (
          <div className={`lms-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <div className="lms-sidebar-header" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px 20px 0', borderBottom: '1px solid #1e293b', background: '#0b1329' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-heading)' }}>Course Index</h3>
                <button className="lms-close-sidebar" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', color: '#94a3b8', border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, padding: 0 }}>×</button>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', margin: '0 -20px' }}>
                <button 
                  type="button"
                  onClick={() => setRightSidebarTab('lessons')} 
                  style={{
                    flex: 1, padding: '12px', border: 'none', background: 'none', fontSize: 13, fontWeight: 700,
                    color: rightSidebarTab === 'lessons' ? '#3b82f6' : '#94a3b8',
                    borderBottom: rightSidebarTab === 'lessons' ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)'
                  }}
                >
                  Syllabus
                </button>
                <button 
                  type="button"
                  onClick={() => setRightSidebarTab('qna')} 
                  style={{
                    flex: 1, padding: '12px', border: 'none', background: 'none', fontSize: 13, fontWeight: 700,
                    color: rightSidebarTab === 'qna' ? '#3b82f6' : '#94a3b8',
                    borderBottom: rightSidebarTab === 'qna' ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)'
                  }}
                >
                  Discussions
                </button>
              </div>
            </div>
            
            {rightSidebarTab === 'lessons' ? (
              <div className="lms-accordion-list" style={{ background: '#0b1329', padding: '16px 12px' }}>
                {modules.map((mod, i) => {
                  const isExpanded = expandedModules[mod.id]
                  const completedInMod = mod.lessons.filter(l => savedProgress.includes(l.id)).length
                  
                  return (
                    <div key={mod.id} className="lms-accordion-section" style={{ background: '#fff', border: '1px solid #1e293b', borderRadius: '4px', marginBottom: 8, overflow: 'hidden' }}>
                      <button type="button" className="lms-accordion-header" onClick={() => toggleModule(mod.id)} style={{ background: '#f8fafc', padding: '14px 16px' }}>
                        <div className="lms-accordion-title">
                          <h4 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#0b1329', fontFamily: 'var(--font-heading)' }}>Section {i + 1}: {mod.title}</h4>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{completedInMod} / {mod.lessons.length} complete</span>
                        </div>
                        <svg className={`chevron ${isExpanded ? 'up' : 'down'}`} viewBox="0 0 24 24" fill="none" stroke="#0b1329" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      
                      {isExpanded && (
                        <div className="lms-accordion-body" style={{ borderTop: '1px solid #e2e8f0' }}>
                          {mod.lessons.map((les, j) => {
                            const isActive = les.id === lessonId
                            const isDone = savedProgress.includes(les.id)
                            
                            // Progression progression lock check
                            const globalIdx = allLessons.findIndex(l => l.id === les.id)
                            const isLocked = !isAdmin && globalIdx > 0 && !savedProgress.includes(allLessons[globalIdx - 1].id)
                            
                            if (isLocked) {
                              return (
                                <div key={les.id} className="lms-lesson-item locked" style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center', opacity: 0.6, cursor: 'not-allowed', background: '#fafafa' }}>
                                  <div className="lms-checkbox" style={{ width: 16, height: 16 }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ width: 14, height: 14 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span className="lms-lesson-title" style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{j + 1}. {les.title}</span>
                                    <span className="lms-lesson-time" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 2 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                      <span>{les.duration || 'Video'}</span>
                                      <span style={{ marginLeft: 6, color: '#fff', background: '#64748b', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>LOCKED</span>
                                    </span>
                                  </div>
                                </div>
                              )
                            }
                            
                            return (
                              <Link key={les.id} to={`/course/${courseId}/${les.id}`} className={`lms-lesson-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center' }}>
                                <div className="lms-checkbox" onClick={(e) => toggleLessonCompletion(e, les.id)} style={{ width: 16, height: 16, cursor: 'pointer' }}>
                                  {isDone ? (
                                    <svg viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="10"></circle><path stroke="#fff" strokeWidth="2" d="M8 12l3 3 5-5"></path></svg>
                                  ) : (
                                    <div className="empty-circle" style={{ width: 14, height: 14, border: '2px solid #cbd5e1', borderRadius: '50%' }}></div>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span className="lms-lesson-title" style={{ fontSize: 13, color: isActive ? '#1e3a8a' : '#334155', fontWeight: isActive ? 700 : 500, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{j + 1}. {les.title}</span>
                                  <span className="lms-lesson-time" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b', marginTop: 2 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 2 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    <span>{les.duration || 'Video'}</span>
                                  </span>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="lms-sidebar-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0b1329', padding: '16px 12px' }}>
                <style dangerouslySetInnerHTML={{__html: `
                  .lms-sidebar-scroll::-webkit-scrollbar { display: none; }
                  .lms-sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
                <h4 style={{ fontSize: 13, margin: '0 0 12px', color: '#fff', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Ask a Question</h4>
                <form onSubmit={handleAskQuestion} style={{ marginBottom: 20 }}>
                  <textarea 
                    value={newQuestionText}
                    onChange={e => handleNewQuestionTextChange(e.target.value)}
                    placeholder="Ask a question about this lesson..."
                    style={{ width: '100%', height: 72, padding: 10, border: '1px solid #1e293b', background: '#050b14', color: '#fff', borderRadius: 4, outline: 'none', resize: 'none', fontSize: 12, marginBottom: 8, fontFamily: 'inherit' }}
                  />
                  <button 
                    type="submit"
                    disabled={submittingQuestion || !newQuestionText.trim()}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: submittingQuestion ? 0.7 : 1, width: '100%' }}
                  >
                    {submittingQuestion ? 'Submitting...' : 'Post Question'}
                  </button>
                </form>

                <h4 style={{ fontSize: 13, margin: '0 0 12px', color: '#fff', fontWeight: 700, borderTop: '1px solid #1e293b', paddingTop: 16, fontFamily: 'var(--font-heading)' }}>Discussion Thread</h4>
                {questionsLoading ? (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No questions yet. Be the first to ask!</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {questions.map(q => (
                      <div key={q.id} style={{ background: '#fff', border: '1px solid #d1d7dc', borderRadius: 4, padding: 12, color: '#0b1329' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0b1329' }}>{q.profiles?.full_name || 'Student'}</span>
                          <span style={{ fontSize: 9, color: '#64748b' }}>{new Date(q.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#0b1329', whiteSpace: 'pre-wrap' }}>{q.question}</p>

                        {/* Answers List */}
                        {q.qna_answers && q.qna_answers.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '2px solid #2563eb', paddingLeft: 8, marginBottom: 8, marginLeft: 2 }}>
                            {q.qna_answers.map(ans => (
                              <div key={ans.id} style={{ fontSize: 11.5 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                  <strong style={{ color: '#0b1329' }}>{ans.profiles?.full_name || 'User'}</strong>
                                  <span style={{ fontSize: 8, color: '#64748b' }}>{new Date(ans.created_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ margin: 0, color: '#334155' }}>{ans.answer}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Reply Form */}
                        <form onSubmit={(e) => handlePostAnswer(e, q.id)} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input 
                            type="text"
                            value={newAnswerText[q.id] || ''}
                            onChange={e => handleNewAnswerTextChange(q.id, e.target.value)}
                            placeholder="Write a reply..."
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, outline: 'none', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              type="submit"
                              disabled={submittingAnswer[q.id] || !(newAnswerText[q.id] || '').trim()}
                              style={{ background: '#0b1329', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                            >
                              Reply
                            </button>
                          </div>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Right Side: Video & Content Player */}
        <div className="lms-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#f8fafc' }}>
          
          {/* Main Video Section */}
          <div className="lms-video-container" style={{ position: 'relative', background: '#000' }}>
            <div className="lms-video-wrapper">
              {lesson.type === 'quiz' ? (
                (() => {
                  const quizQuestions = (lesson.resources && Array.isArray(lesson.resources.questions)) ? lesson.resources.questions : []
                  return (
                    <div className="lms-quiz-player" style={{ width: '100%', minHeight: '480px', background: '#050b14', color: '#fff', padding: '40px 24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowY: 'auto' }}>
                      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
                          <div>
                            <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, letterSpacing: 1 }}>Assessment</span>
                            <h2 style={{ fontSize: 22, margin: '4px 0 0', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{lesson.title}</h2>
                          </div>
                          {quizSubmitted && (
                            <div style={{ background: quizScore / quizQuestions.length >= 0.5 ? '#10b981' : '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: 4, fontWeight: 700 }}>
                              Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                            </div>
                          )}
                        </div>

                        {quizQuestions.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                            <p style={{ margin: 0, fontSize: 16 }}>This quiz does not have any questions yet.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {quizQuestions.map((q, qIdx) => {
                              const userSelection = selectedOptions[qIdx]
                              
                              return (
                                <div key={qIdx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 20 }}>
                                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#f1f5f9', fontFamily: 'var(--font)' }}>
                                    {qIdx + 1}. {q.question}
                                  </h3>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                                    {q.options.map((opt, optIdx) => {
                                      if (!opt) return null
                                      const isSelected = userSelection === optIdx
                                      
                                      let optionBg = 'rgba(255,255,255,0.01)'
                                      let optionBorder = 'rgba(255,255,255,0.08)'
                                      let optionColor = '#cbd5e1'
                                      
                                      if (quizSubmitted) {
                                        if (optIdx === q.correct_index) {
                                          optionBg = 'rgba(16, 185, 129, 0.15)'
                                          optionBorder = '#10b981'
                                          optionColor = '#34d399'
                                        } else if (isSelected) {
                                          optionBg = 'rgba(239, 68, 68, 0.15)'
                                          optionBorder = '#ef4444'
                                          optionColor = '#f87171'
                                        }
                                      } else if (isSelected) {
                                        optionBg = 'rgba(37, 99, 235, 0.15)'
                                        optionBorder = '#2563eb'
                                        optionColor = '#60a5fa'
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={quizSubmitted}
                                          onClick={() => handleSelectOption(qIdx, optIdx)}
                                          style={{
                                            textAlign: 'left', padding: '12px 16px', borderRadius: 4,
                                            background: optionBg, border: `1px solid ${optionBorder}`,
                                            color: optionColor, cursor: quizSubmitted ? 'default' : 'pointer',
                                            fontSize: 14, fontWeight: isSelected ? 600 : 500,
                                            transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 10,
                                            width: '100%', fontFamily: 'var(--font)'
                                          }}
                                        >
                                          <span style={{
                                            width: 20, height: 20, borderRadius: '50%', display: 'inline-flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                                            background: isSelected ? 'currentColor' : 'rgba(255,255,255,0.08)',
                                            color: isSelected ? '#050b14' : '#cbd5e1', flexShrink: 0
                                          }}>
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          {opt}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}

                            {!quizSubmitted && (
                              <button
                                type="button"
                                onClick={handleSubmitQuiz}
                                disabled={Object.keys(selectedOptions).length < quizQuestions.length}
                                style={{
                                  background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4,
                                  padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                  alignSelf: 'flex-start', marginTop: 8, transition: 'all 0.2s',
                                  opacity: Object.keys(selectedOptions).length < quizQuestions.length ? 0.5 : 1,
                                  fontFamily: 'var(--font)'
                                }}
                              >
                                Submit Answers
                              </button>
                            )}
                            
                            {quizSubmitted && (
                              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOptions({})
                                    setQuizSubmitted(false)
                                    setQuizScore(0)
                                  }}
                                  style={{
                                    background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 4, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'var(--font)'
                                  }}
                                >
                                  Retake Quiz
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()
              ) : lesson.video_url ? (
                (() => {
                  const resolved = getEmbedUrlOrHtml(lesson.video_url)
                  if (resolved.trim().startsWith('<')) {
                    return (
                      <div
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}
                        dangerouslySetInnerHTML={{ __html: resolved.replace(/<iframe /g, '<iframe style="width:100%;height:100%;border:0;" ') }}
                      />
                    )
                  } else {
                    let finalUrl = resolved;
                    const iframeMatch = finalUrl.match(/<iframe.*?src=["'](.*?)["']/i);
                    if (iframeMatch && iframeMatch[1]) {
                      finalUrl = iframeMatch[1];
                    }

                    if (finalUrl.match(/\.(mp4|webm|ogg)$/i) || finalUrl.startsWith('blob:')) {
                      return (
                        <video 
                          controls 
                          src={finalUrl} 
                          style={{ width: '100%', height: '100%', background: '#000' }}
                        />
                      )
                    } else {
                      return (
                        <iframe 
                          src={finalUrl} 
                          frameBorder="0" 
                          allow="autoplay; fullscreen; picture-in-picture" 
                          allowFullScreen 
                          style={{ width: '100%', height: '100%' }}
                        ></iframe>
                      )
                    }
                  }
                })()
              ) : (
                <div className="lms-video-placeholder" style={{ fontFamily: 'var(--font)' }}>
                  <div className="play-icon" style={{ width: 64, height: 64, background: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, cursor: 'pointer' }}>▶</div>
                  <p style={{ fontWeight: 700 }}>{lesson.title}</p>
                  <span style={{ color: '#64748b', fontSize: 12 }}>(No video URL provided)</span>
                </div>
              )}
            </div>

            {/* Immersive/Theater Mode Toggle Hidden */}
          </div>

          {/* Bottom Tabs Panel */}
          {(!theaterMode && shouldShowBottomPanel) && (
            <div style={{ width: '100%' }}>
              {/* Header Title/Buttons (White background) */}
              <div style={{ background: '#fff', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', width: '100%' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', padding: '32px 24px 24px', fontFamily: 'var(--font)' }}>
                  <div className="lms-content-header" style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    alignItems: isMobile ? 'stretch' : 'center', 
                    justifyContent: 'space-between', 
                    gap: 16 
                  }}>
                    <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#0b1329', fontFamily: 'var(--font-heading)', margin: 0 }}>{lesson.title}</h2>
                    <div className="lms-lesson-controls" style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
                      {prevLesson && <button onClick={(e) => handlePrevClick(e, prevLesson.id)} className="lms-btn" style={{ flex: isMobile ? 1 : 'none', background: '#f1f5f9', color: '#0b1329', border: '1px solid #d1d7dc', padding: '10px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>Prev</button>}
                      {(() => {
                        const isCurrentDone = savedProgress.includes(lessonId);
                        if (!isCurrentDone && !isAdmin) {
                          return (
                            <button 
                              onClick={(e) => markLessonComplete(lessonId)} 
                              className="lms-btn mark-complete-btn" 
                              style={{ 
                                flex: isMobile ? 1 : 'none', 
                                background: '#10b981', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '10px 18px', 
                                borderRadius: 6, 
                                fontWeight: 700, 
                                fontSize: 13, 
                                cursor: 'pointer', 
                                textAlign: 'center' 
                              }}
                            >
                              ✓ Mark as Completed
                            </button>
                          )
                        }
                        if (nextLesson) {
                          return (
                            <button 
                              onClick={(e) => handleNextClick(e, nextLesson.id)} 
                              className="lms-btn next-lesson-btn" 
                              style={{ 
                                flex: isMobile ? 1 : 'none', 
                                background: '#2563eb', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '10px 18px', 
                                borderRadius: 6, 
                                fontWeight: 700, 
                                fontSize: 13, 
                                cursor: 'pointer', 
                                textAlign: 'center' 
                              }}
                            >
                              Next Lesson →
                            </button>
                          )
                        }
                        return (
                          <button 
                            onClick={handleFinishCourseClick} 
                            className="lms-btn finish-course-btn" 
                            style={{ 
                              flex: isMobile ? 1 : 'none', 
                              background: '#10b981', 
                              color: '#fff', 
                              border: 'none', 
                              padding: '10px 18px', 
                              borderRadius: 6, 
                              fontWeight: 700, 
                              fontSize: 13, 
                              cursor: 'pointer', 
                              textAlign: 'center' 
                            }}
                          >
                            Finish Course
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs / Content Section (Off-white background) */}
              <div style={{ background: '#f8fafc', width: '100%' }}>
                <div className="lms-content-footer" style={{ maxWidth: 1000, margin: '0 auto', width: '100%', padding: '24px 24px 32px', fontFamily: 'var(--font)' }}>
                  <div className="lms-tabs" style={{ display: 'flex', gap: 24, borderBottom: '1px solid #cbd5e1', marginBottom: 24 }}>
                    {hasOverview && (
                      <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')} style={{ paddingBottom: 10, fontSize: 14, fontWeight: 700, color: activeTab === 'overview' ? '#2563eb' : '#64748b', borderBottom: activeTab === 'overview' ? '3px solid #2563eb' : '3px solid transparent' }}>Overview</button>
                    )}
                    {hasResources && (
                      <button className={activeTab === 'resources' ? 'active' : ''} onClick={() => setActiveTab('resources')} style={{ paddingBottom: 10, fontSize: 14, fontWeight: 700, color: activeTab === 'resources' ? '#2563eb' : '#64748b', borderBottom: activeTab === 'resources' ? '3px solid #2563eb' : '3px solid transparent' }}>Resources</button>
                    )}
                  </div>

                  <div className="lms-tab-content">
                    {activeTab === 'overview' && hasOverview && (
                      <div className="lms-overview" style={{ fontSize: 15, lineHeight: 1.7, color: '#334155' }} dangerouslySetInnerHTML={{ __html: lesson.overview }} />
                    )}
                    {activeTab === 'resources' && hasResources && (
                      <div className="lms-resources" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {lesson.resources.map((res, i) => (
                          <div key={i} className="lms-resource-item" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', maxWidth: 600 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#0b1329' }}>{res.title}</h4>
                              <span style={{ fontSize: 12, color: '#64748b' }}>{res.type || 'Resource'}</span>
                            </div>
                            <a href={res.url} target="_blank" rel="noreferrer" style={{ background: '#0b1329', color: '#fff', textDecoration: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>Download</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation when bottom panel is hidden */}
          {(!shouldShowBottomPanel && !theaterMode) && (
            <div style={{ background: '#fff', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', width: '100%' }}>
              <div style={{ 
                padding: '32px 24px', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                alignItems: isMobile ? 'stretch' : 'center', 
                justifyContent: 'space-between', 
                maxWidth: 1000, 
                margin: '0 auto', 
                width: '100%', 
                fontFamily: 'var(--font)',
                gap: 16
              }}>
                <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#0b1329', fontFamily: 'var(--font-heading)', margin: 0 }}>{lesson.title}</h2>
                <div className="lms-lesson-controls" style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
                  {prevLesson && <button onClick={(e) => handlePrevClick(e, prevLesson.id)} className="lms-btn" style={{ flex: isMobile ? 1 : 'none', background: '#f1f5f9', color: '#0b1329', border: '1px solid #d1d7dc', padding: '10px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>Prev</button>}
                  {(() => {
                    const isCurrentDone = savedProgress.includes(lessonId);
                    if (!isCurrentDone && !isAdmin) {
                      return (
                        <button 
                          onClick={(e) => markLessonComplete(lessonId)} 
                          className="lms-btn mark-complete-btn" 
                          style={{ 
                            flex: isMobile ? 1 : 'none', 
                            background: '#10b981', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '10px 18px', 
                            borderRadius: 6, 
                            fontWeight: 700, 
                            fontSize: 13, 
                            cursor: 'pointer', 
                            textAlign: 'center' 
                          }}
                        >
                          ✓ Mark as Completed
                        </button>
                      )
                    }
                    if (nextLesson) {
                      return (
                        <button 
                          onClick={(e) => handleNextClick(e, nextLesson.id)} 
                          className="lms-btn next-lesson-btn" 
                          style={{ 
                            flex: isMobile ? 1 : 'none', 
                            background: '#2563eb', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '10px 18px', 
                            borderRadius: 6, 
                            fontWeight: 700, 
                            fontSize: 13, 
                            cursor: 'pointer', 
                            textAlign: 'center' 
                          }}
                        >
                          Next Lesson →
                        </button>
                      )
                    }
                    return (
                      <button 
                        onClick={handleFinishCourseClick} 
                        className="lms-btn finish-course-btn" 
                        style={{ 
                          flex: isMobile ? 1 : 'none', 
                          background: '#10b981', 
                          color: '#fff', 
                          border: 'none', 
                          padding: '10px 18px', 
                          borderRadius: 6, 
                          fontWeight: 700, 
                          fontSize: 13, 
                          cursor: 'pointer', 
                          textAlign: 'center' 
                        }}
                      >
                        Finish Course
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating button to reopen sidebar on desktop and mobile when closed */}
      {!sidebarOpen && !theaterMode && (
        <button 
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed', left: 24, bottom: 24, background: '#0b1329', color: '#fff',
            border: '1px solid #1e3a8a', padding: '12px 24px', borderRadius: '50px',
            fontWeight: 600, cursor: 'pointer', zIndex: 99, display: 'flex',
            alignItems: 'center', gap: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            fontFamily: 'var(--font)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span>Course Syllabus</span>
        </button>
      )}

      {/* Course Completion Review Modal */}
      {showReviewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 11, 20, 0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 20, fontFamily: 'var(--font)'
        }}>
          <div style={{
            background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0',
            maxWidth: 500, width: '100%', padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowReviewModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', fontSize: 24, color: '#94a3b8', cursor: 'pointer' }}
            >
              ×
            </button>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" style={{ marginBottom: 12, display: 'inline-block' }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
              </svg>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0b1329', margin: '12px 0 8px', fontFamily: 'var(--font-heading)' }}>Congratulations!</h2>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>You have completed 100% of this course. Share your feedback with other students!</p>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0b1329', marginBottom: 8 }}>YOUR RATING</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleReviewRatingChange(star)}
                      style={{ background: 'none', border: 'none', fontSize: 32, cursor: 'pointer', color: star <= reviewRating ? '#f59e0b' : '#e2e8f0', padding: 0 }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0b1329', marginBottom: 8 }}>YOUR REVIEW</label>
                <textarea
                  value={reviewText}
                  onChange={e => handleReviewTextChange(e.target.value)}
                  placeholder="What did you think of the course? Any feedback helps us improve."
                  required
                  style={{ width: '100%', height: 96, padding: 12, borderRadius: 4, border: '1px solid #cbd5e1', outline: 'none', resize: 'none', fontSize: 13.5, fontFamily: 'inherit', color: '#0b1329' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                style={{
                  width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4,
                  padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Feedback & Claim Certificate'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Embedded CSS Style Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .lms-layout {
          min-height: 100vh;
          font-family: var(--font);
          background: #fff;
          color: #334155;
        }
        
        .lms-sidebar {
          width: 350px;
          min-width: 350px;
          background: #0b1329;
          color: #fff;
          border-right: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          z-index: 20;
          box-shadow: 4px 0 16px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        
        .lms-sidebar.closed {
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          border-right: none !important;
          display: none !important;
        }
        
        .lms-accordion-list {
          flex: 1;
          overflow-y: auto;
        }
        
        .lms-accordion-section {
          border: 1px solid #1e293b;
          border-radius: 4px;
          background: #fff;
          margin-bottom: 10px;
          overflow: hidden;
          transition: all 0.2s;
        }
        
        .lms-accordion-header {
          width: 100%;
          padding: 14px 16px;
          background: #f8fafc;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          cursor: pointer;
        }
        
        .lms-accordion-title h4 {
          margin: 0 0 2px;
          font-size: 13.5px;
          font-weight: 700;
          color: #0b1329;
          font-family: var(--font-heading) !important;
        }
        
        .lms-lesson-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          text-decoration: none;
          color: #475569;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s, color 0.15s;
          background: #fff;
        }
        
        .lms-lesson-item:hover {
          background: #f8fafc;
        }
        
        .lms-lesson-item.active {
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          padding-left: 14px;
          color: #1e3a8a;
        }
        
        .lms-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .lms-lesson-item:hover .empty-circle {
          border-color: #2563eb !important;
          background: rgba(37, 99, 235, 0.05);
        }
        
        .lms-lesson-title {
          font-size: 13px;
          color: inherit;
        }
        
        @media (max-width: 768px) {
          .lms-course-title,
          .lms-nav-divider {
            display: none !important;
          }
          .lms-progress-text {
            font-size: 11px !important;
          }
        }
        @media (max-width: 1023px) {
          .lms-sidebar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            transform: translateX(-100%);
            z-index: 999;
          }
          .lms-sidebar.open {
            transform: translateX(0);
            box-shadow: 10px 0 25px rgba(0,0,0,0.15);
            width: 300px;
            min-width: 300px;
          }
        }
      `}} />
    </div>
  )
}
