import React, { useEffect, useState } from 'react'

export default function GlimmerBackground() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const newParticles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2.5 + 0.8,
      delay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 6 + 4}s`,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bg-white rounded-full animate-sparkle"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
          }}
        />
      ))}
    </div>
  )
}
