import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Plus, ExternalLink, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export default function TenantsPage() {
  const { token } = useAuth()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ slug: '', name: '', redirect_url: '' })
  const [saving, setSaving] = useState(false)

  async function fetchTenants() {
    try {
      setLoading(true)
      const data = await callAction('iam.tenant.list.in', {}, token)
      setTenants(data?.tenants || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTenants() }, [token])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true)
      await callAction('iam.tenant.create.in', form, token)
      setShowForm(false)
      setForm({ slug: '', name: '', redirect_url: '' })
      await fetchTenants()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-medium/10 border border-gold-medium/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gold-medium" />
          </div>
          <div>
            <h1 className="font-serif text-xl text-white">Tenants</h1>
            <p className="text-xs text-gray-500">{tenants.length} registrados</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo tenant
        </button>
      </motion.div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <h2 className="text-sm font-medium text-gray-300">Nuevo tenant</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug</label>
              <input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="brilliant-therapy"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Brilliant Therapy"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL de redirección</label>
              <input required value={form.redirect_url} onChange={e => setForm({ ...form, redirect_url: e.target.value })}
                placeholder="http://localhost:3001/dashboard"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Crear
            </button>
          </div>
        </motion.form>
      )}

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-gold-medium animate-spin" /></div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-4">
          {tenants.map((t) => (
            <motion.div key={t.id} variants={fadeInUp} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold-medium/10 border border-gold-medium/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gold-medium" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">/{t.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={t.redirect_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-pool-light transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t.redirect_url}
                  </a>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {t.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
