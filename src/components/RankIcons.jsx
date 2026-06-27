/* ─────────────────────────────────────────────────────────────────────────────
   RankIcons.jsx  —  Sistema de rangos Turing IAM
   Incluye: iconos SVG por rango, datos de rangos, helper RankBadge
───────────────────────────────────────────────────────────────────────────── */

/* ── Iconos SVG inline ── */

export function IronShieldIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3L4 8v9c0 6.5 5.1 11.8 12 13 6.9-1.2 12-6.5 12-13V8L16 3z"
        fill="rgba(107,114,128,0.18)" stroke="#6B7280" strokeWidth="1.5"/>
      <line x1="16" y1="9" x2="16" y2="23" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10" y1="16" x2="22" y2="16" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

export function BronzeSwordIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="bsw" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CD7F32"/>
          <stop offset="50%" stopColor="#E8A857"/>
          <stop offset="100%" stopColor="#A0612A"/>
        </linearGradient>
      </defs>
      <path d="M16 2L13 22h6L16 2z" fill="url(#bsw)" opacity="0.9"/>
      <rect x="9" y="21" width="14" height="3" rx="1.5" fill="#CD7F32" opacity="0.85"/>
      <rect x="14.5" y="24" width="3" height="6" rx="1.5" fill="#8B5E1A"/>
      <circle cx="16" cy="30.5" r="1.8" fill="#CD7F32" opacity="0.9"/>
    </svg>
  )
}

export function SilverShieldIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="ssg" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8E8E8" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#8a8a8a" stopOpacity="0.1"/>
        </linearGradient>
        <linearGradient id="sstroke" x1="4" y1="3" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8E8E8"/>
          <stop offset="100%" stopColor="#9a9a9a"/>
        </linearGradient>
      </defs>
      <path d="M16 3L4 8v9c0 6.5 5.1 11.8 12 13 6.9-1.2 12-6.5 12-13V8L16 3z"
        fill="url(#ssg)" stroke="url(#sstroke)" strokeWidth="1.5"/>
      <path d="M16 9l1.5 4.5H22l-3.75 2.75 1.5 4.5L16 18 12.25 20.75l1.5-4.5L10 13.5h4.5z"
        fill="rgba(192,192,192,0.45)" stroke="rgba(232,232,232,0.5)" strokeWidth="0.5"/>
    </svg>
  )
}

export function GoldCrownIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gcg" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A67C1E"/>
          <stop offset="35%" stopColor="#D4AF37"/>
          <stop offset="60%" stopColor="#F0D060"/>
          <stop offset="100%" stopColor="#A67C1E"/>
        </linearGradient>
      </defs>
      <path d="M4 22h24v4H4z" fill="url(#gcg)"/>
      <path d="M4 22L4 10l6 8 6-12 6 12 6-8v12H4z" fill="url(#gcg)"/>
      <circle cx="16" cy="10" r="2.2" fill="#F0D060" stroke="#D4AF37" strokeWidth="0.5"/>
      <circle cx="7" cy="17" r="1.5" fill="#F0D060" stroke="#D4AF37" strokeWidth="0.5" opacity="0.85"/>
      <circle cx="25" cy="17" r="1.5" fill="#F0D060" stroke="#D4AF37" strokeWidth="0.5" opacity="0.85"/>
    </svg>
  )
}

export function PlatinumStarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="psg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0f0f0"/>
          <stop offset="50%" stopColor="#E5E4E2"/>
          <stop offset="100%" stopColor="#a8a8a6"/>
        </linearGradient>
      </defs>
      <path d="M16 2l2.5 8.5H27l-7 5 2.5 8.5L16 19l-6.5 5 2.5-8.5-7-5h8.5z" fill="url(#psg)"/>
      <line x1="16" y1="2" x2="16" y2="5" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

export function DiamondGemIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="dgo" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F8FF"/>
          <stop offset="50%" stopColor="#B9F2FF"/>
          <stop offset="100%" stopColor="#4EC4DC"/>
        </linearGradient>
      </defs>
      <path d="M16 3L5 13l11 16 11-16L16 3z" fill="url(#dgo)" stroke="rgba(185,242,255,0.5)" strokeWidth="0.5"/>
      <path d="M16 3L5 13h22L16 3z" fill="rgba(255,255,255,0.2)"/>
    </svg>
  )
}

export function MasterSwordsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="msl" x1="0" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="msr" x1="32" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e879f9"/>
          <stop offset="100%" stopColor="#a855f7"/>
        </linearGradient>
      </defs>
      <path d="M12 2L9 20h6L12 2z" fill="url(#msl)"/>
      <rect x="7" y="19" width="10" height="2.5" rx="1.25" fill="#7c3aed" opacity="0.9"/>
      <rect x="10.5" y="21.5" width="3" height="5" rx="1.5" fill="#581c87"/>
      <circle cx="12" cy="27" r="1.6" fill="#a855f7"/>
      <path d="M20 2L17 20h6L20 2z" fill="url(#msr)"/>
      <rect x="15" y="19" width="10" height="2.5" rx="1.25" fill="#9333ea" opacity="0.9"/>
      <rect x="18.5" y="21.5" width="3" height="5" rx="1.5" fill="#581c87"/>
      <circle cx="20" cy="27" r="1.6" fill="#c084fc"/>
    </svg>
  )
}

export function LegendCrownIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="lcg" x1="2" y1="6" x2="34" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A67C1E"/>
          <stop offset="30%" stopColor="#D4AF37"/>
          <stop offset="55%" stopColor="#F0D060"/>
          <stop offset="80%" stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#A67C1E"/>
        </linearGradient>
        <linearGradient id="lcwings" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(212,175,55,0.7)"/>
          <stop offset="50%" stopColor="rgba(240,208,96,0.3)"/>
          <stop offset="100%" stopColor="rgba(212,175,55,0.7)"/>
        </linearGradient>
        <radialGradient id="lcgem">
          <stop offset="0%" stopColor="#F0D060"/>
          <stop offset="60%" stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#A67C1E"/>
        </radialGradient>
      </defs>
      <path d="M2 20 Q4 14 7 16 Q5 20 6 23z" fill="url(#lcwings)" opacity="0.6"/>
      <path d="M34 20 Q32 14 29 16 Q31 20 30 23z" fill="url(#lcwings)" opacity="0.6"/>
      <path d="M6 26h24v4.5H6z" fill="url(#lcg)"/>
      <path d="M6 26V12l7 9 5-13 5 13 7-9v14H6z" fill="url(#lcg)"/>
      <path d="M6 26V16l5 7 5-11 5 11 5-7v10H6z" fill="rgba(168,85,247,0.25)"/>
      <circle cx="18" cy="12" r="3.2" fill="url(#lcgem)" stroke="rgba(255,220,100,0.5)" strokeWidth="0.7"/>
      <circle cx="18" cy="12" r="1.3" fill="rgba(255,255,200,0.8)"/>
      <circle cx="10" cy="20" r="2" fill="url(#lcgem)" opacity="0.85" stroke="rgba(212,175,55,0.5)" strokeWidth="0.5"/>
      <circle cx="26" cy="20" r="2" fill="url(#lcgem)" opacity="0.85" stroke="rgba(212,175,55,0.5)" strokeWidth="0.5"/>
      <path d="M18 5 L18.4 6.8 L20 6.5 L18.4 7.2 L18.8 9 L18 7.5 L17.2 9 L17.6 7.2 L16 6.5 L17.6 6.8z"
        fill="rgba(255,255,200,0.9)"/>
    </svg>
  )
}

/* ── Datos de rangos ── */
export const RANKS = [
  {
    key:        'iron',
    label:      'Hierro',
    Icon:       IronShieldIcon,
    color:      '#9CA3AF',
    glow:       'rgba(107,114,128,0.35)',
    badgeCls:   'rank-iron',
    xpRange:    '0 – 999 XP',
  },
  {
    key:        'bronze',
    label:      'Bronce',
    Icon:       BronzeSwordIcon,
    color:      '#CD7F32',
    glow:       'rgba(205,127,50,0.4)',
    badgeCls:   'rank-bronze',
    xpRange:    '1k – 4.9k XP',
  },
  {
    key:        'silver',
    label:      'Plata',
    Icon:       SilverShieldIcon,
    color:      '#C0C0C0',
    glow:       'rgba(192,192,192,0.45)',
    badgeCls:   'rank-silver',
    xpRange:    '5k – 14.9k XP',
  },
  {
    key:        'gold',
    label:      'Oro',
    Icon:       GoldCrownIcon,
    color:      '#D4AF37',
    glow:       'rgba(212,175,55,0.5)',
    badgeCls:   'rank-gold',
    xpRange:    '15k – 49.9k XP',
  },
  {
    key:        'platinum',
    label:      'Platino',
    Icon:       PlatinumStarIcon,
    color:      '#E5E4E2',
    glow:       'rgba(229,228,226,0.45)',
    badgeCls:   'rank-platinum',
    xpRange:    '50k – 99.9k XP',
  },
  {
    key:        'diamond',
    label:      'Diamante',
    Icon:       DiamondGemIcon,
    color:      '#B9F2FF',
    glow:       'rgba(185,242,255,0.45)',
    badgeCls:   'rank-diamond',
    xpRange:    '100k – 249.9k XP',
  },
  {
    key:        'master',
    label:      'Maestro',
    Icon:       MasterSwordsIcon,
    color:      '#c084fc',
    glow:       'rgba(168,85,247,0.5)',
    badgeCls:   'rank-master',
    xpRange:    '250k – 999.9k XP',
  },
  {
    key:        'legend',
    label:      'Leyenda',
    Icon:       LegendCrownIcon,
    color:      '#F0D060',
    glow:       'rgba(212,175,55,0.6)',
    badgeCls:   'rank-legend',
    xpRange:    '1M+ XP',
  },
]

/* ── Helper: asigna rango por index o role ── */
export function getRankByRole(role, index) {
  // Si existe una lógica por nombre de rol
  const byName = {
    admin:       RANKS[3], // oro
    terapeuta:   RANKS[2], // plata
    padre:       RANKS[1], // bronce
    alumno:      RANKS[0], // hierro
    administrador: RANKS[3],
  }
  if (role && byName[role?.toLowerCase()]) return byName[role.toLowerCase()]
  // fallback por índice (para demos/listas)
  return RANKS[index % RANKS.length]
}

/* ── Componente badge ── */
export function RankBadge({ rankKey, showLabel = true, size = 14 }) {
  const rank = RANKS.find(r => r.key === rankKey) ?? RANKS[0]
  return (
    <span className={`rank-badge ${rank.badgeCls}`} style={{ '--glow': rank.glow }}>
      <rank.Icon size={size} />
      {showLabel && rank.label}
    </span>
  )
}

/* ── Avatar con rango (reemplaza el avatar genérico) ── */
export function RankedAvatar({ name, role, index, isActive = true, size = 'md' }) {
  const rank = getRankByRole(role, index ?? 0)
  const sizeClasses = {
    sm:  { outer: 'w-7 h-7',  text: 'text-[10px]', badge: 'w-4 h-4',  icon: 11 },
    md:  { outer: 'w-9 h-9',  text: 'text-xs',     badge: 'w-5 h-5',  icon: 13 },
    lg:  { outer: 'w-11 h-11', text: 'text-sm',    badge: 'w-6 h-6',  icon: 15 },
  }
  const s = sizeClasses[size] ?? sizeClasses.md
  const initial = name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="relative inline-flex shrink-0">
      {/* Circle */}
      <div
        className={`${s.outer} rounded-full flex items-center justify-center font-semibold transition-all duration-300`}
        style={isActive
          ? { background: `${rank.color}18`, border: `1px solid ${rank.color}40`, color: rank.color, boxShadow: `0 0 10px ${rank.glow}` }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }
        }
      >
        <span className={s.text}>{initial}</span>
      </div>
      {/* Rank pip */}
      {isActive && (
        <div
          className={`absolute -bottom-1 -right-1 ${s.badge} rounded-full flex items-center justify-center`}
          style={{ background: '#050505', border: `1px solid ${rank.color}40`, boxShadow: `0 0 6px ${rank.glow}` }}
        >
          <rank.Icon size={s.icon} />
        </div>
      )}
    </div>
  )
}
