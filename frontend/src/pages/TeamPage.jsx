import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import Modal from '../components/ui/Modal'
import {
  Users, Search, Shield, User, Trash2, Crown,
  Loader2, Mail, Calendar, ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'

export default function TeamPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  })

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Role updated')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed')
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deactivated')
      setConfirmDelete(null)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed')
  })

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const admins = filtered.filter(u => u.role === 'admin')
  const members = filtered.filter(u => u.role === 'member')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} members total</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-white">{users.length}</p>
          <p className="text-sm text-gray-400 mt-1">Total Members</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-brand-400">{admins.length}</p>
          <p className="text-sm text-gray-400 mt-1">Admins</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-green-400">{members.length}</p>
          <p className="text-sm text-gray-400 mt-1">Members</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input-field pl-9"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Crown size={14} className="text-brand-400" />
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Admins</h3>
              </div>
              <div className="space-y-2">
                {admins.map(u => (
                  <UserRow
                    key={u._id}
                    user={u}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    onRoleChange={(id, role) => roleChangeMutation.mutate({ id, role })}
                    onDelete={setConfirmDelete}
                    isChangingRole={roleChangeMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Members</h3>
              </div>
              <div className="space-y-2">
                {members.map(u => (
                  <UserRow
                    key={u._id}
                    user={u}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    onRoleChange={(id, role) => roleChangeMutation.mutate({ id, role })}
                    onDelete={setConfirmDelete}
                    isChangingRole={roleChangeMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm deactivate */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title="Deactivate User" size="sm">
          <p className="text-gray-400 mb-5">
            Deactivate <span className="text-white font-medium">{confirmDelete.name}</span>? They won't be able to log in.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button
              onClick={() => deactivateMutation.mutate(confirmDelete._id)}
              disabled={deactivateMutation.isPending}
              className="btn-danger flex-1 justify-center"
            >
              {deactivateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Deactivate
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UserRow({ user, currentUser, isAdmin, onRoleChange, onDelete, isChangingRole }) {
  const isSelf = user._id === currentUser?._id

  return (
    <div className="card flex items-center gap-4 py-3">
      <img
        src={user.avatar}
        alt={user.name}
        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-white truncate">{user.name}</p>
          {isSelf && <span className="text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full">You</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Mail size={10} /> {user.email}
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Calendar size={10} /> Joined {format(new Date(user.createdAt), 'MMM yyyy')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdmin && !isSelf ? (
          <select
            value={user.role}
            onChange={e => onRoleChange(user._id, e.target.value)}
            disabled={isChangingRole}
            className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-brand-500"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span className={`badge ${user.role === 'admin' ? 'bg-brand-500/10 text-brand-400' : 'bg-gray-700 text-gray-400'}`}>
            {user.role === 'admin' ? <><Crown size={10} /> admin</> : user.role}
          </span>
        )}

        {isAdmin && !isSelf && (
          <button
            onClick={() => onDelete(user)}
            className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Deactivate user"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}