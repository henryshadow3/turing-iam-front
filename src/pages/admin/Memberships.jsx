import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, Plus, Trash2, Loader2 } from 'lucide-react'
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

export default function MembershipsPage() {
  const { token } = useAuth()
  const [memberships, setMemberships] = useState([])
  const [users, setUsers] = useState([])
  const [tenants, setTenants] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ user_id: '', tenant_id: '', role_id: '' })
  const [saving, setSaving] = useState(false)

  async function fetchAll() {
    try {
      setLoading(true)
      const [mData, uData, tData, rData] = await Promise.all([
        callAction('iam.membership.list.in', {}, token),
        callAction('iam.user.list.in', {}, token),
        callAction('iam.tenant.list.in', {}, token),
        callAction('iam.role.list.in', {}, token),
      ])
      setMemberships(mData?.memberships || [])
      setUsers(uData?.users || [])
      setTenants(tData?.tenants || [])
      setRoles(rData?.roles || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [token])

  const filteredRoles = roles.filter(r => !form.tenant_id || r.tenant_id === form.tenant_id)

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true)
      await callAction('iam.membership.create.in', form, token)
      setShowForm(false)
      setForm({ user_id: '', tenant_id: '', role_id: '' })
      await fetchAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(membershipId) {
    if (!confirm('¿Eliminar esta membresía?')) return
    try {
      await callAction('iam.membership.delete.in', { membership_id: membershipId }, token)
      await fetchAll()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-medium/10 border border-gold-medium/20 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-gold-medium" />
          </div>
          <div>
            <h1 className="font-serif text-xl text-white">Membresías</h1>
            <p className="text-xs text-gray-500">{memberships.length} registradas</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Asignar membresía
        </button>
      </motion.div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <h2 className="text-sm font-medium text-gray-300">Nueva membresía</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Usuario</label>
              <select required value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50">
                <option value="">Seleccionar...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tenant</label>
              <select required value={form.tenant_id}
                onChange={e => setForm({ ...form, tenant_id: e.target.value, role_id: '' })}
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50">
                <option value="">Seleccionar...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rol</label>
              <select required value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}
                disabled={!form.tenant_id}
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50 disabled:opacity-40">
                <option value="">Seleccionar...</option>
                {filteredRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Asignar
            </button>
          </div>
        </motion.form>
      )}

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-gold-medium animate-spin" /></div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Usuario</th>
                <th className="px-5 py-3 text-left">Tenant</th>
                <th className="px-5 py-3 text-left">Rol</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => (
                <motion.tr key={m.id} variants={fadeInUp} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-gray-200">{m.full_name}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">{m.tenant_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet/10 text-violet-light border border-violet/20">{m.role_name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {m.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleDelete(m.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
