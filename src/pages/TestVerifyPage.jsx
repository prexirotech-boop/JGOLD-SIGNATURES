import React from 'react'
import { Link } from 'react-router-dom'

export default function TestVerifyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '80px auto', padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2563eb', fontSize: 32, marginBottom: 16 }}>Auto Page Verification Successful!</h1>
      <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
        This page was created in <code>src/pages/TestVerifyPage.jsx</code> and was automatically discovered by the pages scanner.
        It has been registered under the route <code>/test-verify</code> and is listed under the admin's Frontend Pages list.
      </p>
      <Link to="/" style={{ background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600 }}>
        Go Back Home
      </Link>
    </div>
  )
}
