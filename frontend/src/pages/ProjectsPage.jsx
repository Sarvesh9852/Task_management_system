import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Search,
  FolderKanban,
  MoreVertical,
  Trash2,
  Edit3,
  Users,
  CheckSquare,
  Clock,
  X,
  Loader2,
  TrendingUp,
  Calendar,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import Modal from "../components/ui/Modal";

const statusColors = {
  planning: "bg-gray-500/10 text-gray-400",
  active: "bg-brand-500/10 text-brand-400",
  "on-hold": "bg-yellow-500/10 text-yellow-400",
  completed: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
};

const priorityColors = {
  low: "bg-green-500/10 text-green-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

const PROJECT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

function ProjectCard({ project, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const progress =
    project.taskCounts?.total > 0
      ? Math.round((project.taskCounts.done / project.taskCounts.total) * 100)
      : 0;

  const canManage =
    user?.role === "admin" ||
    project.members?.find(
      (m) => m.user?._id === user?._id || m.user === user?._id,
    )?.role === "admin";

  return (
    <div className="card hover:border-gray-700 transition-all duration-200 group animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: project.color || "#6366f1" }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500">
              {project.owner?.name === user?.name ? "You" : project.owner?.name}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 w-36 overflow-hidden animate-slide-up">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      onEdit(project);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      onDelete(project);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors border-t border-gray-700"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Link to={`/projects/${project._id}`} className="block">
        {project.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`badge ${statusColors[project.status]}`}>
            {project.status}
          </span>
          <span className={`badge ${priorityColors[project.priority]}`}>
            {project.priority}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Progress</span>
            <span className="font-semibold text-gray-300">{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                backgroundColor: project.color || "#6366f1",
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <CheckSquare size={12} />
            {project.taskCounts?.total || 0} tasks
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {project.members?.length || 0}
          </span>
          {project.endDate && (
            <span className="flex items-center gap-1.5 ml-auto">
              <Calendar size={12} />
              {format(new Date(project.endDate), "MMM d")}
            </span>
          )}
        </div>

        {/* Members */}
        {project.members?.length > 0 && (
          <div className="flex -space-x-2 mt-3">
            {project.members.slice(0, 5).map((member, i) => (
              <img
                key={i}
                src={member.user?.avatar}
                alt={member.user?.name}
                title={member.user?.name}
                className="w-7 h-7 rounded-full border-2 border-gray-900 object-cover"
                onError={(e) =>
                  (e.target.src = `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=64`)
                }
              />
            ))}
            {project.members.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-gray-400">
                +{project.members.length - 5}
              </div>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}

function ProjectFormModal({ project, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "planning",
    priority: project?.priority || "medium",
    color: project?.color || PROJECT_COLORS[0],
    startDate: project?.startDate ? project.startDate.split("T")[0] : "",
    endDate: project?.endDate ? project.endDate.split("T")[0] : "",
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      project
        ? api.patch(`/projects/${project._id}`, data)
        : api.post("/projects", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(project ? "Project updated!" : "Project created!");
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <Modal onClose={onClose} title={project ? "Edit Project" : "New Project"}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Project Name *
          </label>
          <input
            className="input-field"
            placeholder="e.g. Website Redesign"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="What's this project about?"
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
              {["planning", "active", "on-hold", "completed", "cancelled"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ),
              )}
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
              {["low", "medium", "high", "critical"].map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              className="input-field"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              className="input-field"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                  form.color === color
                    ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110"
                    : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name.trim() || mutation.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending && (
              <Loader2 size={15} className="animate-spin" />
            )}
            {project ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editProject, setEditProject] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      setDeleteTarget(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete"),
  });

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            {projects.length} projects total
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            className="input-field pl-9"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "planning", "active", "on-hold", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-brand-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-56">
              <div className="flex gap-3 mb-4">
                <div className="w-11 h-11 bg-gray-800 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={setEditProject}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <FolderKanban size={48} className="mb-4 opacity-30" />
          <h3 className="text-lg font-medium text-gray-400 mb-1">
            {search || statusFilter !== "all"
              ? "No projects found"
              : "No projects yet"}
          </h3>
          <p className="text-sm mb-6">
            {search
              ? "Try a different search term"
              : "Create your first project to get started"}
          </p>
          {!search && statusFilter === "all" && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {(showCreate || editProject) && (
        <ProjectFormModal
          project={editProject}
          onClose={() => {
            setShowCreate(false);
            setEditProject(null);
          }}
        />
      )}

      {deleteTarget && (
        <Modal
          onClose={() => setDeleteTarget(null)}
          title="Delete Project"
          size="sm"
        >
          <p className="text-gray-400 mb-2">
            Are you sure you want to delete{" "}
            <span className="text-white font-medium">
              "{deleteTarget.name}"
            </span>
            ?
          </p>
          <p className="text-sm text-red-400 mb-5">
            ⚠ This will also delete all tasks in this project.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteTarget._id)}
              disabled={deleteMutation.isPending}
              className="btn-danger flex-1 justify-center"
            >
              {deleteMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
