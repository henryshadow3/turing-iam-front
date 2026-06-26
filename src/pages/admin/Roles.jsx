import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export default function RolesPage() {
  const { token } = useAuth()
  const [roles, setRoles] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ tenant_id: '', name: '' })
  const [saving, setSaving] = useState(false)

  async function fetchAll() {
    try {
      setLoading(true)
      const [rolesData, tenantsData] = await Promise.all([
        callAction('iam.role.list.in', {}, token),
        callAction('iam.tenant.list.in', {}, token),
      ])
      setRoles(rolesData?.roles || [])
      setTenants(tenantsData?.tenants || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [token])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true)
      await callAction('iam.role.create.in', form, token)
      setShowForm(false)
      setForm({ tenant_id: '', name: '' })
      await fetchAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Group roles by tenant
  const grouped = roles.reduce((acc, r) => {
    const t = tenants.find(t => t.id === r.tenant_id)
    const key = t?.name || r.tenant_id
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-medium/10 border border-gold-medium/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gold-medium" />
          </div>
          <div>
            <h1 className="font-serif text-xl text-white">Roles</h1>
            <p className="text-xs text-gray-500">{roles.length} registrados</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo rol
        </button>
      </motion.div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <h2 className="text-sm font-medium text-gray-300">Nuevo rol</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tenant</label>
              <select required value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50">
                <option value="">Seleccionar...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre del rol</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="terapeuta"
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
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          {Object.entries(grouped).map(([tenantName, tenantRoles]) => (
            <motion.div key={tenantName} variants={fadeInUp} className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{tenantName}</p>
              </div>
              <div className="flex flex-wrap gap-2 p-5">
                {tenantRoles.map(r => (
                  <span key={r.id} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-violet/10 border border-violet/20 text-violet-light">
                    <Shield className="w-3.5 h-3.5" />
                    {r.name}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
