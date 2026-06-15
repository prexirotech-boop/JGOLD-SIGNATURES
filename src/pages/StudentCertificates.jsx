import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StudentCertificates({ user }) {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCertificates() {
      if (!user) return
      try {
        const { data: certData, error: certError } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', user.id)

        if (certError) throw certError

        const courseIds = (certData || []).map(c => c.course_id).filter(Boolean)

        if (courseIds.length === 0) {
          setCertificates([])
          return
        }

        const [coursesRes, productsRes] = await Promise.all([
          supabase.from('courses').select('id, instructor').in('id', courseIds),
          supabase.from('products').select('id, title, cover_image').in('id', courseIds)
        ])

        const coursesData = coursesRes.data || []
        const productsData = productsRes.data || []

        const courseMap = {}
        coursesData.forEach(c => { courseMap[c.id] = c })

        const productMap = {}
        productsData.forEach(p => { productMap[p.id] = p })

        const assembled = (certData || []).map(cert => {
          const course = courseMap[cert.course_id] || { id: cert.course_id, instructor: 'Instructor' }
          const product = productMap[cert.course_id]

          return {
            ...cert,
            courses: {
              ...course,
              products: product || { title: 'Accredited Certification', cover_image: null }
            }
          }
        })

        setCertificates(assembled)
      } catch (err) {
        console.error('Error fetching student certificates:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCertificates()
  }, [user])

  const handleDownload = (cert) => {
    // Generate a beautiful certificate HTML print window
    const printWindow = window.open('', '_blank', 'width=900,height=650')
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Completion - ${cert.certificate_number}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #f1f5f9;
              font-family: 'Montserrat', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .certificate-container {
              width: 850px;
              height: 580px;
              padding: 40px;
              background-color: #fff;
              border: 16px double #1e3a8a;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              box-sizing: border-box;
              position: relative;
              text-align: center;
            }
            .certificate-border-accent {
              position: absolute;
              top: 10px;
              bottom: 10px;
              left: 10px;
              right: 10px;
              border: 2px solid #b45309;
              pointer-events: none;
            }
            .logo {
              font-family: 'Cinzel', serif;
              font-size: 24px;
              font-weight: 800;
              color: #1e3a8a;
              margin-top: 10px;
              letter-spacing: 2px;
            }
            .title {
              font-family: 'Cinzel', serif;
              font-size: 38px;
              font-weight: 800;
              color: #1e3a8a;
              margin-top: 20px;
              margin-bottom: 5px;
              letter-spacing: 3px;
            }
            .subtitle {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 4px;
              color: #b45309;
              font-weight: 600;
              margin-bottom: 25px;
            }
            .presented-to {
              font-size: 13px;
              font-style: italic;
              color: #64748b;
              margin-bottom: 5px;
            }
            .name {
              font-size: 32px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
              display: inline-block;
              padding-bottom: 5px;
              min-width: 300px;
            }
            .reason {
              font-size: 14px;
              color: #475569;
              line-height: 1.6;
              max-width: 550px;
              margin: 15px auto;
            }
            .course-title {
              font-weight: 700;
              color: #1e3a8a;
            }
            .footer-info {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding: 0 40px;
            }
            .signature-block {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .signature-line {
              width: 180px;
              border-top: 1px solid #94a3b8;
              margin-top: 40px;
              margin-bottom: 5px;
            }
            .signature-title {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748b;
            }
            .cert-id {
              position: absolute;
              bottom: 20px;
              left: 50px;
              font-size: 10px;
              color: #94a3b8;
              font-family: monospace;
            }
            .cert-date {
              position: absolute;
              bottom: 20px;
              right: 50px;
              font-size: 11px;
              color: #94a3b8;
            }
            @media print {
              body { background-color: #fff; }
              .certificate-container { box-shadow: none; border-color: #1e3a8a !important; }
              button { display: none; }
            }
            .print-btn-container {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 100;
            }
            .print-btn {
              background-color: #1e3a8a;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .print-btn:hover {
              background-color: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="print-btn-container">
            <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
          </div>
          <div class="certificate-container">
            <div class="certificate-border-accent"></div>
            <div class="logo">AMPLIFIED SKILLS</div>
            <div class="title">CERTIFICATE</div>
            <div class="subtitle">of completion</div>
            <div class="presented-to">This is proudly presented to</div>
            <div class="name">${user.user_metadata?.full_name || 'Alumnus'}</div>
            <div class="reason">
              for successfully completing the core training curriculum and executing the project blueprints for
              <br><span class="course-title">${cert.courses?.products?.title || 'Advanced Masterclass'}</span>
            </div>
            
            <div class="footer-info">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-title">${cert.courses?.instructor || 'Lead Instructor'}</div>
              </div>
              <div class="signature-block">
                <div style="font-family: 'Cinzel', serif; font-size: 18px; color: #1e3a8a; font-weight: 800;">APPROVED</div>
                <div class="signature-line" style="margin-top: 15px;"></div>
                <div class="signature-title">Amplified Skills Board</div>
              </div>
            </div>
            
            <div class="cert-id">Verification ID: ${cert.certificate_number}</div>
            <div class="cert-date">Date Issued: ${new Date(cert.issued_at).toLocaleDateString()}</div>
          </div>
        </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const handleShare = (cert) => {
    const url = `${window.location.origin}/verify-certificate?id=${cert.certificate_number}`
    navigator.clipboard.writeText(url)
    alert(`Verification link copied to clipboard: ${url}`)
  }

  if (loading) return <div style={{ padding: '40px 0', color: '#64748b' }}>Loading certificates...</div>

  if (certificates.length === 0) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <svg style={{ width: 64, height: 64, color: '#94a3b8', margin: '0 auto 16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>No Certificates Yet</h2>
        <p style={{ color: '#64748b', marginBottom: 8, fontSize: 15 }}>Certificates are awarded upon scoring over the threshold in final course lessons and modules.</p>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Complete curriculum modules at 100% to qualify for your accreditation.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
      {certificates.map((cert) => (
        <div key={cert.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: '#fef3c7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                🎓
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{cert.courses?.products?.title}</h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>Accredited Certification</span>
              </div>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Certificate No:</span>
                <span style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{cert.certificate_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Issued On:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{new Date(cert.issued_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => handleDownload(cert)}
              style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              📥 Download PDF
            </button>
            <button 
              onClick={() => handleShare(cert)}
              style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              title="Copy Verification Link"
            >
              🔗 Share
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
