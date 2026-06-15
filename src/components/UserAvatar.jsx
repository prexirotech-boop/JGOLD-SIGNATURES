import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function UserAvatar({ user, size = 40 }) {
  const { profile } = useAuth()
  if (!user) return null

  // If user metadata full_name is not available, use the email part before @, and capitalize it.
  let nameStr = 'Student'
  if (user.user_metadata?.full_name) {
    nameStr = user.user_metadata.full_name
  } else if (user.email) {
    nameStr = user.email.split('@')[0]
  }
  
  const initials = nameStr.substring(0, 2).toUpperCase()
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url

  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={nameStr} 
        style={{ 
          width: size, 
          height: size, 
          minWidth: size, 
          minHeight: size, 
          borderRadius: '50%', 
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
        }} 
        title={nameStr}
      />
    )
  }

  // Generate a consistent but professional color based on the email string
  const colors = [
    '#2563eb', // brand blue
    '#059669', // emerald
    '#d97706', // amber
    '#1d4ed8', // dark blue
    '#0891b2', // cyan
    '#7c3aed'  // violet (kept for variety)
  ]
  const colorIndex = user.email ? user.email.charCodeAt(0) % colors.length : 0
  const bgColor = colors[colorIndex]

  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        minWidth: size, 
        minHeight: size,
        borderRadius: '50%', 
        backgroundColor: bgColor, 
        color: '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontWeight: 700, 
        fontSize: size * 0.4,
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
      }}
      title={nameStr}
    >
      {initials}
    </div>
  )
}
