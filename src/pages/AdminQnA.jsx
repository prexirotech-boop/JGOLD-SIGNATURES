import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminQnA() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [newAnswer, setNewAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadQuestions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('qna_questions')
      .select('*, profiles(full_name, email), courses(products(title)), lessons(title)')
      .order('created_at', { ascending: false })

    if (data) setQuestions(data)
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const handleNewAnswerChange = (val) => {
    setNewAnswer(val)
    if (selectedQuestion) {
      localStorage.setItem(`draft_qna_reply_${selectedQuestion.id}`, val)
    }
  }

  const handleSelectQuestion = async (q) => {
    setSelectedQuestion(q)
    const saved = localStorage.getItem(`draft_qna_reply_${q.id}`)
    setNewAnswer(saved || '')

    const { data } = await supabase
      .from('qna_answers')
      .select('*, profiles(full_name, role)')
      .eq('question_id', q.id)
      .order('created_at', { ascending: true })

    if (data) setAnswers(data)
  }

  const handleAnswerSubmit = async (e) => {
    e.preventDefault()
    if (!newAnswer.trim() || !selectedQuestion) return
    setSubmittingAnswer(true)

    try {
      const { error } = await supabase
        .from('qna_answers')
        .insert({
          question_id: selectedQuestion.id,
          author_id: user.id,
          answer: newAnswer.trim()
        })

      if (error) throw error
      localStorage.removeItem(`draft_qna_reply_${selectedQuestion.id}`)
      setNewAnswer('')
      handleSelectQuestion(selectedQuestion)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmittingAnswer(false)
    }
  }

  const handleToggleResolve = async (q) => {
    try {
      const { error } = await supabase
        .from('qna_questions')
        .update({ is_resolved: !q.is_resolved })
        .eq('id', q.id)
      if (error) throw error
      
      const updated = { ...q, is_resolved: !q.is_resolved }
      setSelectedQuestion(updated)
      setQuestions(questions.map(item => item.id === q.id ? updated : item))
    } catch (err) {
      alert(err.message)
    }
  }

  const isMobile = windowWidth < 768

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Course Q&A Discussions</h2>
        <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Engage directly with registered students and answer course inquiries.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: 20, alignItems: 'flex-start' }}>
        
        {/* Left Column: Questions List */}
        <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1f36' }}>Student Inquiries</h3>
          
          {loading ? (
            <div style={{ color: '#697386', fontSize: 13 }}>Loading Q&A feed...</div>
          ) : questions.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8792a2', fontSize: 13 }}>No student questions recorded.</div>
          ) : (
            questions.map(q => (
              <div 
                key={q.id}
                onClick={() => handleSelectQuestion(q)}
                style={{ 
                  padding: 12, 
                  borderRadius: 6, 
                  border: selectedQuestion?.id === q.id ? '1.5px solid #2563eb' : '1px solid #e3e8ee',
                  cursor: 'pointer',
                  background: selectedQuestion?.id === q.id ? 'rgba(37,99,235,0.04)' : '#fff',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: q.is_resolved ? '#00875a' : '#976400', background: q.is_resolved ? '#e3fcef' : '#fff0b3', padding: '2px 5px', borderRadius: 4, fontWeight: 500 }}>
                    {q.is_resolved ? 'Resolved' : 'Pending Reply'}
                  </span>
                  <span style={{ fontSize: 11, color: '#8792a2' }}>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1f36', marginBottom: 4 }}>{q.question}</div>
                <div style={{ fontSize: 11, color: '#697386' }}>
                  By {q.profiles?.full_name || 'Student'} &bull; {q.courses?.products?.title}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Answers Section */}
        <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, padding: 20 }}>
          {selectedQuestion ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a1f36' }}>{selectedQuestion.question}</h4>
                  <span style={{ fontSize: 11.5, color: '#697386', marginTop: 4, display: 'inline-block' }}>
                    Asked by {selectedQuestion.profiles?.full_name || 'Student'} in lesson: {selectedQuestion.lessons?.title || 'Overview'}
                  </span>
                </div>
                <button 
                  onClick={() => handleToggleResolve(selectedQuestion)}
                  style={{ background: 'none', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, color: '#3c4257', cursor: 'pointer' }}
                >
                  {selectedQuestion.is_resolved ? 'Mark Pending' : 'Mark Resolved'}
                </button>
              </div>

              {/* Answers list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, maxHeight: 220, overflowY: 'auto' }}>
                {answers.length === 0 ? (
                  <div style={{ fontStyle: 'italic', fontSize: 13, color: '#8792a2', textAlign: 'center', padding: 12 }}>No answers submitted yet.</div>
                ) : (
                  answers.map(a => (
                    <div key={a.id} style={{ padding: 12, background: '#f7f8f9', borderRadius: 6, border: '1px solid #e3e8ee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: '#1a1f36' }}>
                          {a.profiles?.full_name || 'Anonymous'} {a.profiles?.role === 'admin' && <strong style={{ color: '#2563eb', marginLeft: 4 }}>(Instructor)</strong>}
                        </span>
                        <span style={{ fontSize: 10, color: '#8792a2' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#3c4257', lineHeight: 1.4 }}>{a.answer}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleAnswerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea 
                  value={newAnswer}
                  onChange={e => handleNewAnswerChange(e.target.value)}
                  placeholder="Write your explanation or feedback..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 70 }}
                  required
                />
                <button 
                  type="submit" 
                  disabled={submittingAnswer}
                  style={{ alignSelf: 'flex-end', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, fontWeight: 500, cursor: submittingAnswer ? 'not-allowed' : 'pointer', fontSize: 13 }}
                >
                  {submittingAnswer ? 'Posting...' : 'Post Reply'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#697386', fontSize: 13.5 }}>
              Select a question from the left sidebar to view discussion or post a response.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
