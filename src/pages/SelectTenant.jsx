import { motion } from 'framer-motion'
import { Building2, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import GlimmerBackground from '@/components/GlimmerBackground'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

export default function SelectTenant() {
  const { token, user } = useAuth()

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400 font-sans">Token inválido o expirado.</p>
      </div>
    )
  }

  const memberships = user.memberships || []

  function handleSelect(membership) {
    const userParam = encodeURIComponent(JSON.stringify({
      id: user.sub,
      email: user.email,
      full_name: user.full_name,
      role: membership.role_name,
    }))
    window.location.href = `${membership.redirect_url}?token=${token}&user=${userParam}`
  }

  return (
    <div className="relative min-h-screen bg-black text-gray-200 font-sans overflow-x-hidden flex items-center justify-center px-4">
      <GlimmerBackground />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-violet-dark/5 rounded-full blur-[160px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-teal-pool-dark/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-gold-medium" />
            <span className="font-serif text-sm text-gold-medium tracking-widest uppercase text-glow-gold">
              Turing IAM
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-3">
            Selecciona tu espacio
          </h1>
          <p className="text-gray-400 text-sm">
            Hola, <span className="text-gray-200">{user.email}</span>. Tienes acceso a los siguientes espacios de trabajo.
          </p>
        </motion.div>

        {/* Tenant cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-3"
        >
          {memberships.length === 0 ? (
            <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 text-center">
              <p className="text-gray-400 text-sm">No tienes espacios de trabajo asignados.</p>
              <p className="text-gray-500 text-xs mt-1">Contacta a tu administrador.</p>
            </motion.div>
          ) : (
            memberships.map((m) => (
              <motion.button
                key={m.tenant_id}
                variants={fadeInUp}
                onClick={() => handleSelect(m)}
                className="glass-card w-full rounded-xl p-5 text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold-medium/10 border border-gold-medium/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gold-medium" />
                    </div>
                    <div>
                      <p className="text-white font-medium font-sans">{m.tenant_name}</p>
                      <p className="text-xs text-gold-medium/70 mt-0.5 capitalize">{m.role_name}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gold-medium group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </motion.button>
            ))
          )}
        </motion.div>
      </div>
    </div>
  )
}
