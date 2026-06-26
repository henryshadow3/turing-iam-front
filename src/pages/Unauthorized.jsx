import { motion } from 'framer-motion'
import { ShieldOff } from 'lucide-react'
import GlimmerBackground from '@/components/GlimmerBackground'

export default function Unauthorized() {
  return (
    <div className="relative min-h-screen bg-black text-gray-200 font-sans flex items-center justify-center">
      <GlimmerBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="font-serif text-2xl text-white">Acceso denegado</h1>
        <p className="text-gray-400 text-sm">No tienes permiso para acceder a esta página.</p>
      </motion.div>
    </div>
  )
}
