import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, UserX, Mail, Shield, Loader2 } from 'lucide-react'
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

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'terapeuta' })
  const [saving, setSaving] = useState(false)

  async function fetchUsers() {
    try {
      setLoading(true)
      const data = await callAction('iam.user.list.in', {}, token)
      setUsers(data?.users || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [token])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true)
      await callAction('iam.user.create.in', form, token)
      setShowForm(false)
      setForm({ email: '', full_name: '', password: '', role: 'terapeuta' })
      await fetchUsers()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisable(userId) {
    if (!confirm('¿Deshabilitar este usuario?')) return
    try {
      await callAction('iam.user.disable.in', { user_id: userId }, token)
      await fetchUsers()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-medium/10 border border-gold-medium/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-gold-medium" />
          </div>
          <div>
            <h1 className="font-serif text-xl text-white">Usuarios</h1>
            <p className="text-xs text-gray-500">{users.length} registrados</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </motion.div>

      {/* Create form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <h2 className="text-sm font-medium text-gray-300 mb-2">Nuevo usuario</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
              <input
                required
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                required type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
              <input
                required type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rol base</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50"
              >
                <option value="terapeuta">terapeuta</option>
                <option value="admin">admin</option>
                <option value="padre">padre</option>
                <option value="alumno">alumno</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Crear
            </button>
          </div>
        </motion.form>
      )}

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-gold-medium animate-spin" />
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Nombre</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Rol</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <motion.tr key={u.id} variants={fadeInUp} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5 text-gray-200">{u.full_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Mail className="w-3.5 h-3.5" />{u.email}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-violet-light">
                      <Shield className="w-3.5 h-3.5" />{u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.is_active && (
                      <button onClick={() => handleDisable(u.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
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
