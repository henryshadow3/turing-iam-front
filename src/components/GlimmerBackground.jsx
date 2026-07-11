import React, { useEffect, useState } from 'react'

const COLORS = [
  '#D4AF37', // gold
  '#F0D060', // gold bright
  '#C0C0C0', // silver
  '#E8E8E8', // silver light
  '#a855f7', // violet accent
  '#ffffff',
]

export default function GlimmerBackground() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const newParticles = Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      top:      `${(i * 13 + 7) % 100}%`,
      left:     `${(i * 17 + 3) % 100}%`,
      size:     (i % 4 === 0) ? 2.5 : (i % 4 === 1) ? 2 : (i % 4 === 2) ? 1.5 : 1,
      delay:    `${(i * 0.11) % 8}s`,
      duration: `${4 + (i * 0.09) % 5}s`,
      color:    COLORS[i % COLORS.length],
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-sparkle"
          style={{
            top:             p.top,
            left:            p.left,
            width:           `${p.size}px`,
            height:          `${p.size}px`,
            backgroundColor: p.color,
            animationDelay:    p.delay,
            animationDuration: p.duration,
            boxShadow: p.color === '#C0C0C0' || p.color === '#E8E8E8'
              ? `0 0 6px rgba(192,192,192,0.7)`
              : p.color === '#D4AF37' || p.color === '#F0D060'
              ? `0 0 6px rgba(212,175,55,0.7)`
              : `0 0 4px rgba(255,255,255,0.5)`,
          }}
        />
      ))}
    </div>
  )
}
