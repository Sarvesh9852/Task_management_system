import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import {
  CheckSquare, Calendar, Flag, Filter, Search,
  AlertTriangle, Clock, CheckCircle2, Circle, Timer,
  ExternalLink, Loader2, Flame
} from 'lucide-react'
import { format } from 'date-fns'

const statusConfig = {
  'todo': { label: 'To Do', color: 'bg-gray-500/10 text-gray-400', icon: Circle },
  'in-progress': { label: 'In Progress', color: 'bg-brand-500/10 text-brand-400', icon: Timer },
  'in-review': { label: 'In Review', color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  'done': { label: 'Done', color: 'bg-green-500/10 text-green-400', icon: CheckCircle2 },
}

const priorityConfig = {
  low: { color: 'text-green-400', icon: Circle },
  medium: { color: 'text-yellow-400', icon: Timer },
  high: { color: 'text-orange-400', icon: AlertTriangle },
  critical: { color: 'text-red-400', icon: Flame },
}

export default function TasksPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [overdueOnly, setOverdueOnly] = useState(false)

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['all-tasks', statusFilter, priorityFilter, assigneeFilter, overdueOnly],
    queryFn: () => {
      const params = new URLSearchParams({ limit: 200 })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (assigneeFilter === 'me') params.set('assignee', 'me')
      if (overdueOnly) params.set('overdue', 'true')
      return api.get(`/tasks?${params}`).then(r => r.data.data)
    },
  })

  const tasks = tasksData || []

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.project?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce((acc, task) => {
    const status = task.status || 'todo'
    if (!acc[status]) acc[status] = []
    acc[status].push(task)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} tasks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-field pl-9"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="input-field w-auto text-sm py-2"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="done">Done</option>
          </select>

          <select
            className="input-field w-auto text-sm py-2"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            className="input-field w-auto text-sm py-2"
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
          >
            <option value="all">All Assignees</option>
            <option value="me">Assigned to Me</option>
          </select>

          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              overdueOnly ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <AlertTriangle size={13} />
            Overdue
          </button>
        </div>
      </div>

      {/* Tasks */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <CheckSquare size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No tasks found</p>
        </div>
      ) : statusFilter !== 'all' ? (
        // Flat list when filtering by status
        <div className="card">
          <div className="divide-y divide-gray-800">
            {filtered.map(task => <TaskRow key={task._id} task={task} />)}
          </div>
        </div>
      ) : (
        // Grouped by status
        <div className="space-y-6">
          {Object.entries(statusConfig).map(([status, cfg]) => {
            const group = grouped[status] || []
            if (group.length === 0) return null
            const Icon = cfg.icon
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={15} className={cfg.color.split(' ')[1]} />
                  <h3 className="font-semibold text-gray-300 text-sm">{cfg.label}</h3>
                  <span className="text-xs text-gray-600">({group.length})</span>
                </div>
                <div className="card p-0 overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {group.map(task => <TaskRow key={task._id} task={task} />)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task }) {
  const pCfg = priorityConfig[task.priority] || priorityConfig.medium
  const sCfg = statusConfig[task.status] || statusConfig.todo
  const PIcon = pCfg.icon
  const SIcon = sCfg.icon
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-800/50 transition-colors group">
      <SIcon size={14} className={sCfg.color.split(' ')[1]} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200">{task.title}</p>
        {task.project && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: task.project.color || '#6366f1' }}
            />
            <Link
              to={`/projects/${task.project._id}`}
              className="text-xs text-gray-500 hover:text-brand-400 transition-colors"
            >
              {task.project.name}
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <PIcon size={13} className={pCfg.color} title={task.priority} />

        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <img
              src={task.assignee.avatar}
              alt={task.assignee.name}
              className="w-6 h-6 rounded-full"
              title={task.assignee.name}
            />
          </div>
        )}

        {task.dueDate && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-gray-800 text-gray-500'
          }`}>
            {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}

        <span className={`badge text-xs ${sCfg.color}`}>
          {sCfg.label}
        </span>
      </div>
    </div>
  )
}