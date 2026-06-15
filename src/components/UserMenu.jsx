import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import UserAvatar from './UserAvatar'
import { useAuth } from '../context/AuthContext'

export default function UserMenu({ user }) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [ref])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="std-menu-trigger"
        aria-expanded={open}
      >
        <UserAvatar user={user} size={32} />
      </button>

      {open && (
        <div className="std-dropdown">
          <div className="std-dropdown-header">
            <div className="std-dropdown-avatar"><UserAvatar user={user} size={40} /></div>
            <div className="std-dropdown-info">
              <p className="std-dropdown-name">{user.user_metadata?.full_name || 'Student'}</p>
              <p className="std-dropdown-email">{user.email}</p>
            </div>
          </div>
          
          <div className="std-dropdown-body">
            {profile?.role === 'admin' && (
              <Link to="/admin" onClick={() => setOpen(false)} className="std-dropdown-item" style={{ color: '#2563eb' }}>
                Admin Console
              </Link>
            )}
            <Link to="/dashboard" onClick={() => setOpen(false)} className="std-dropdown-item">
              My learning
            </Link>
            <Link to="/account" onClick={() => setOpen(false)} className="std-dropdown-item">
              Account settings
            </Link>
          </div>

          <div className="std-dropdown-footer">
            <button onClick={handleSignOut} className="std-dropdown-item std-text-danger">
              Log out
            </button>
          </div>
        </div>
      )}
      
    </div>
  )
}
