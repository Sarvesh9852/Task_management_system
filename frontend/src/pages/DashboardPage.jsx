import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { format, isValid, parseISO, formatDistanceToNow } from "date-fns";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calendar,
  Zap,
  FolderKanban,
  Users,
  Circle,
  Timer,
  CheckCircle2,
  XCircle,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const priorityConfig = {
  critical: { color: "#ef4444", label: "Critical", icon: Flame },
  high: { color: "#f97316", label: "High", icon: AlertTriangle },
  medium: { color: "#eab308", label: "Medium", icon: Timer },
  low: { color: "#22c55e", label: "Low", icon: Circle },
};

const statusConfig = {
  todo: { color: "#6b7280", label: "To Do", icon: Circle },
  "in-progress": { color: "#6366f1", label: "In Progress", icon: Timer },
  "in-review": { color: "#f59e0b", label: "In Review", icon: Clock },
  done: { color: "#22c55e", label: "Done", icon: CheckCircle2 },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl text-sm">
        <p className="text-gray-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ icon: Icon, label, value, sub, color = "brand", trend }) {
  const colors = {
    brand:
      "from-brand-500/20 to-brand-600/5 border-brand-500/20 text-brand-400",
    green:
      "from-green-500/20 to-green-600/5 border-green-500/20 text-green-400",
    orange:
      "from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400",
    red: "from-red-500/20 to-red-600/5 border-red-500/20 text-red-400",
    yellow:
      "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
  };
  return (
    <div
      className={`card bg-gradient-to-br ${colors[color]} border animate-fade-in`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg bg-current/10`}>
          <Icon size={20} className="current" />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-white mb-0.5">{value}</p>
      <p className="text-sm font-medium text-gray-300">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function TaskRow({ task, showProject = true }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const PriorityIcon = priority.icon;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-800/50 transition-colors group">
      <PriorityIcon
        size={14}
        style={{ color: priority.color }}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 font-medium truncate">
          {task.title}
        </p>
        {showProject && task.project && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.project.color || "#6366f1" }}
            />
            {task.project.name}
          </p>
        )}
      </div>
      {task.assignee && (
        <img
          src={task.assignee.avatar}
          alt={task.assignee.name}
          className="w-6 h-6 rounded-full flex-shrink-0"
          title={task.assignee.name}
        />
      )}
      {task.dueDate && (
        <span
          className={`text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full ${
            isOverdue
              ? "bg-red-500/15 text-red-400"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          {isOverdue ? "⚠ " : ""}
          {format(new Date(task.dueDate), "MMM d")}
        </span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/tasks/dashboard").then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const completionRate =
    total > 0 ? Math.round(((stats.done || 0) / total) * 100) : 0;

  const pieData = Object.entries(stats)
    .map(([key, val]) => ({
      name: statusConfig[key]?.label || key,
      value: val,
      color: statusConfig[key]?.color || "#6b7280",
    }))
    .filter((d) => d.value > 0);

  const projects = projectsData || [];
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 17
                ? "afternoon"
                : "evening"}
            , {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1">
            {format(new Date(), "EEEE, MMMM d")} · Here's what's on your plate
            today
          </p>
        </div>
        <Link to="/projects" className="btn-primary hidden sm:flex">
          <FolderKanban size={16} />
          New Project
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare}
          label="Total Tasks"
          value={total}
          sub={`${completionRate}% complete`}
          color="brand"
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={(stats["in-progress"] || 0) + (stats["in-review"] || 0)}
          sub="Active work"
          color="yellow"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.done || 0}
          sub="Tasks done"
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={data?.overdueTasks?.length || 0}
          sub="Needs attention"
          color={data?.overdueTasks?.length > 0 ? "red" : "green"}
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task status chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Task Overview</h3>
            <div className="flex items-center gap-1.5">
              {pieData.map((d) => (
                <span
                  key={d.name}
                  className="flex items-center gap-1 text-xs text-gray-400"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name}
                </span>
              ))}
            </div>
          </div>

          {total > 0 ? (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-3">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                  const count = stats[key] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const Icon = cfg.icon;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Icon size={13} style={{ color: cfg.color }} />
                          {cfg.label}
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cfg.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <CheckSquare size={40} className="mb-3 opacity-30" />
              <p className="text-sm">
                No tasks yet. Create your first project!
              </p>
            </div>
          )}
        </div>

        {/* Due soon */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Due This Week</h3>
            <span className="badge bg-yellow-500/10 text-yellow-400">
              {data?.dueSoon?.length || 0} tasks
            </span>
          </div>
          <div className="space-y-1">
            {data?.dueSoon?.length > 0 ? (
              data.dueSoon.map((task) => <TaskRow key={task._id} task={task} />)
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming deadlines 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">My Tasks</h3>
            <Link
              to="/tasks"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {data?.myTasks?.length > 0 ? (
              data.myTasks
                .slice(0, 6)
                .map((task) => <TaskRow key={task._id} task={task} />)
            ) : (
              <div className="text-center py-8 text-gray-600">
                <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tasks assigned to you</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue & Projects */}
        <div className="space-y-6">
          {/* Overdue */}
          {data?.overdueTasks?.length > 0 && (
            <div className="card border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="font-semibold text-white">Overdue Tasks</h3>
                <span className="badge bg-red-500/20 text-red-400 ml-auto">
                  {data.overdueTasks.length}
                </span>
              </div>
              <div className="space-y-1">
                {data.overdueTasks.map((task) => (
                  <TaskRow key={task._id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Recent projects */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Projects</h3>
              <Link
                to="/projects"
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                All projects <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                      style={{ backgroundColor: project.color || "#6366f1" }}
                    >
                      {project.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {project.taskCounts?.total || 0} tasks ·{" "}
                        {project.members?.length || 0} members
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-gray-300">
                        {project.taskCounts?.total > 0
                          ? Math.round(
                              (project.taskCounts.done /
                                project.taskCounts.total) *
                                100,
                            )
                          : 0}
                        %
                      </div>
                      <div className="w-16 h-1 bg-gray-700 rounded-full mt-1">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{
                            width: `${
                              project.taskCounts?.total > 0
                                ? Math.round(
                                    (project.taskCounts.done /
                                      project.taskCounts.total) *
                                      100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-gray-600">
                  <FolderKanban size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No projects yet</p>
                  <Link
                    to="/projects"
                    className="text-brand-400 text-xs hover:underline mt-1 block"
                  >
                    Create your first project →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-1">
          {data?.recentActivity?.length > 0 ? (
            data.recentActivity.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <img
                  src={task.createdBy?.avatar}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">
                      {task.createdBy?.name}
                    </span>{" "}
                    {task.status === "done" ? "completed" : "updated"}{" "}
                    <span className="text-brand-400">{task.title}</span>
                  </p>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: task.project?.color || "#6366f1",
                      }}
                    />
                    {task.project?.name} ·{" "}
                    {formatDistanceToNow(new Date(task.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span
                  className={`badge ${
                    task.status === "done"
                      ? "bg-green-500/10 text-green-400"
                      : task.status === "in-progress"
                        ? "bg-brand-500/10 text-brand-400"
                        : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {statusConfig[task.status]?.label || task.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 py-6 text-sm">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
