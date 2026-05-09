import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Modal from "../components/ui/Modal";
import {
  Plus,
  ArrowLeft,
  Users,
  Trash2,
  Edit3,
  UserPlus,
  UserMinus,
  CheckSquare,
  Circle,
  Timer,
  Clock,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Calendar,
  Flag,
  X,
  Search,
  MessageSquare,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

const statusCols = [
  {
    id: "todo",
    label: "To Do",
    icon: Circle,
    color: "text-gray-400",
    border: "border-gray-700",
  },
  {
    id: "in-progress",
    label: "In Progress",
    icon: Timer,
    color: "text-brand-400",
    border: "border-brand-500/30",
  },
  {
    id: "in-review",
    label: "In Review",
    icon: Clock,
    color: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  {
    id: "done",
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-400",
    border: "border-green-500/30",
  },
];

const priorityConfig = {
  low: { color: "text-green-400", bg: "bg-green-500/10", icon: Circle },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Timer },
  high: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    icon: AlertTriangle,
  },
  critical: { color: "text-red-400", bg: "bg-red-500/10", icon: Flame },
};

function TaskCard({ task, members, onEdit, onDelete, projectColor }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
  const PIcon = pCfg.icon;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-xl p-3.5 cursor-pointer hover:border-gray-600 hover:bg-gray-750 transition-all group animate-fade-in"
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-200 leading-snug">
          {task.title}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="flex-shrink-0 p-0.5 text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity rounded"
        >
          <MoreVertical size={13} />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 w-32 overflow-hidden animate-slide-up">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(task);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-800 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${pCfg.bg} ${pCfg.color}`}
          >
            <PIcon size={10} />
            {task.priority}
          </span>
          {task.comments?.length > 0 && (
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <MessageSquare size={10} /> {task.comments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span
              className={`text-xs ${isOverdue ? "text-red-400" : "text-gray-500"}`}
            >
              {isOverdue ? "⚠ " : ""}
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.assignee ? (
            <img
              src={task.assignee.avatar}
              alt={task.assignee.name}
              title={task.assignee.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
              <Circle size={10} className="text-gray-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskFormModal({ task, projectId, members, onClose }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    assignee: task?.assignee?._id || task?.assignee || "",
    dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
    estimatedHours: task?.estimatedHours || "",
  });
  const [comment, setComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) =>
      task
        ? api.patch(`/tasks/${task._id}`, data)
        : api.post("/tasks", { ...data, project: projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(task ? "Task updated!" : "Task created!");
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task._id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task deleted");
      onClose();
    },
  });

  const commentMutation = useMutation({
    mutationFn: (text) => api.post(`/tasks/${task._id}/comments`, { text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      setComment("");
      setAddingComment(false);
    },
  });

  return (
    <Modal onClose={onClose} title={task ? "Edit Task" : "New Task"} size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Title *
          </label>
          <input
            className="input-field"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Add more details..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Status
            </label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Priority
            </label>
            <select
              className="input-field"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Assignee
            </label>
            <select
              className="input-field"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            >
              <option value="">Unassigned</option>
              {members?.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              className="input-field"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Estimated Hours
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 4"
            value={form.estimatedHours}
            onChange={(e) =>
              setForm({ ...form, estimatedHours: e.target.value })
            }
            min="0"
          />
        </div>

        {/* Comments (only for existing tasks) */}
        {task && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comments ({task.comments?.length || 0})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {task.comments?.map((c, i) => (
                <div key={i} className="flex gap-2.5 text-sm">
                  <img
                    src={c.user?.avatar}
                    className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                    alt=""
                  />
                  <div className="bg-gray-800 rounded-lg px-3 py-2 flex-1">
                    <span className="font-medium text-gray-300 text-xs">
                      {c.user?.name}
                    </span>
                    <p className="text-gray-400 text-xs mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-field flex-1 text-sm py-2"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  comment.trim() &&
                  commentMutation.mutate(comment.trim())
                }
              />
              <button
                onClick={() =>
                  comment.trim() && commentMutation.mutate(comment.trim())
                }
                disabled={!comment.trim() || commentMutation.isPending}
                className="btn-primary py-2 px-3"
              >
                Send
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {task && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-danger px-3"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.title.trim() || mutation.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            {task ? "Save" : "Create Task"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editTask, setEditTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [activeTab, setActiveTab] = useState("board");

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data.data),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () =>
      api.get(`/tasks?project=${id}&limit=200`).then((r) => r.data.data),
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      api.post(`/projects/${id}/members`, {
        email: memberEmail,
        role: memberRole,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Member added!");
      setMemberEmail("");
      setShowAddMember(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.delete(`/projects/${id}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Member removed");
    },
  });

  if (projectLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    );

  if (!project)
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">Project not found</p>
        <Link to="/projects" className="text-brand-400 text-sm mt-2 block">
          ← Back to projects
        </Link>
      </div>
    );

  const canManage =
    user?.role === "admin" ||
    project.members?.find((m) => (m.user?._id || m.user) === user?._id)
      ?.role === "admin" ||
    project.owner?._id === user?._id;

  const tasksByStatus = statusCols.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const progress =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.status === "done").length / tasks.length) *
            100,
        )
      : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-start gap-4 max-w-7xl mx-auto">
          <Link
            to="/projects"
            className="mt-1 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: project.color || "#6366f1" }}
          >
            {project.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {project.name}
            </h1>
            <p className="text-gray-400 text-sm">
              {project.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: project.color || "#6366f1",
                    }}
                  />
                </div>
                <span>{progress}%</span>
              </div>
              <span className="text-sm text-gray-500">
                {tasks.length} tasks
              </span>
              <span className="text-sm text-gray-500">
                {project.members?.length} members
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="btn-primary flex-shrink-0"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 max-w-7xl mx-auto">
          {["board", "members"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "board" ? "📋 Board" : "👥 Members"}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      {activeTab === "board" && (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 min-w-max h-full">
            {statusCols.map((col) => {
              const colTasks = tasksByStatus[col.id] || [];
              const Icon = col.icon;
              return (
                <div key={col.id} className={`w-72 flex flex-col`}>
                  <div
                    className={`flex items-center gap-2 mb-3 p-3 rounded-xl border ${col.border} bg-gray-900/50`}
                  >
                    <Icon size={15} className={col.color} />
                    <span className="text-sm font-semibold text-gray-300">
                      {col.label}
                    </span>
                    <span className="ml-auto text-xs font-medium bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                    {tasksLoading
                      ? [...Array(2)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-gray-800 rounded-xl p-3.5 animate-pulse h-24"
                          />
                        ))
                      : colTasks.map((task) => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            members={project.members}
                            onEdit={setEditTask}
                            onDelete={(t) => {
                              if (confirm("Delete this task?")) {
                                api.delete(`/tasks/${t._id}`).then(() => {
                                  qc.invalidateQueries({
                                    queryKey: ["tasks", id],
                                  });
                                  toast.success("Task deleted");
                                });
                              }
                            }}
                            projectColor={project.color}
                          />
                        ))}

                    <button
                      onClick={() => setShowCreateTask(true)}
                      className="w-full p-3 rounded-xl border border-dashed border-gray-700 text-gray-600 hover:border-gray-600 hover:text-gray-400 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members */}
      {activeTab === "members" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-3">
            {canManage && (
              <div className="card mb-4">
                <h3 className="font-semibold text-white mb-3">Add Member</h3>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Email address"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      memberEmail &&
                      addMemberMutation.mutate()
                    }
                  />
                  <select
                    className="input-field w-32"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => addMemberMutation.mutate()}
                    disabled={!memberEmail || addMemberMutation.isPending}
                    className="btn-primary"
                  >
                    {addMemberMutation.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    Add
                  </button>
                </div>
              </div>
            )}

            {project.members?.map((member) => (
              <div
                key={member.user?._id}
                className="flex items-center gap-3 p-4 card"
              >
                <img
                  src={member.user?.avatar}
                  alt={member.user?.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{member.user?.name}</p>
                  <p className="text-sm text-gray-500">{member.user?.email}</p>
                </div>
                <span
                  className={`badge ${
                    member.role === "admin"
                      ? "bg-brand-500/10 text-brand-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {member.role}
                </span>
                {canManage && member.user?._id !== project.owner?._id && (
                  <button
                    onClick={() =>
                      removeMemberMutation.mutate(member.user?._id)
                    }
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <UserMinus size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {(showCreateTask || editTask) && (
        <TaskFormModal
          task={editTask}
          projectId={id}
          members={project.members}
          onClose={() => {
            setShowCreateTask(false);
            setEditTask(null);
          }}
        />
      )}
    </div>
  );
}
