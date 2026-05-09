import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Zap, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "admin") {
      setForm({ email: "admin@demo.com", password: "demo123" });
    } else {
      setForm({ email: "member@demo.com", password: "demo123" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 p-12 border-r border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">ProjectFlow</span>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Ship faster.
            <br />
            <span className="text-gradient">Together.</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Manage projects, assign tasks, track progress — all in one place
            with role-based access control.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: "----", text: "Role-based access (Admin & Member)" },
              { icon: "----", text: "Kanban-style task management" },
              { icon: "----", text: "Real-time progress dashboards" },
              { icon: "----", text: "Team collaboration tools" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <span className="text-xl">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-sm">© 2024 ProjectFlow. Built with</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">ProjectFlow</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-gray-400 mb-8">
            Sign in to your account to continue
          </p>

          {/* Demo buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="flex-1 py-2 px-3 text-xs font-medium bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-lg hover:bg-brand-500/20 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("member")}
              className="flex-1 py-2 px-3 text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Member
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="input-field pr-11"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-brand-400 hover:text-brand-300 font-medium"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
