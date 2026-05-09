import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { User, Lock, Save, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState("profile");

  const [profileForm, setProfileForm] = useState({ name: user?.name || "" });
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const profileMutation = useMutation({
    mutationFn: (data) => api.patch("/auth/update-profile", data),
    onSuccess: ({ data }) => {
      updateUser(data.user);
      toast.success("Profile updated!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.patch("/auth/change-password", data),
    onSuccess: ({ data }) => {
      localStorage.setItem("token", data.token);
      toast.success("Password changed!");
      setPassForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const handlePasswordSubmit = () => {
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    passwordMutation.mutate({
      currentPassword: passForm.currentPassword,
      newPassword: passForm.newPassword,
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Profile Settings</h1>

      {/* User summary */}
      <div className="card mb-6 flex items-center gap-4">
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-16 h-16 rounded-2xl object-cover"
          onError={(e) =>
            (e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&size=128`)
          }
        />
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-gray-400">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`badge ${user?.role === "admin" ? "bg-brand-500/10 text-brand-400" : "bg-gray-700 text-gray-400"}`}
            >
              {user?.role === "admin" ? (
                <>
                  <Shield size={10} /> Admin
                </>
              ) : (
                "Member"
              )}
            </span>
            {user?.createdAt && (
              <span className="text-xs text-gray-600">
                Since {format(new Date(user.createdAt), "MMM yyyy")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "password", label: "Password", icon: Lock },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Display Name
            </label>
            <input
              className="input-field"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              className="input-field opacity-60 cursor-not-allowed"
              value={user?.email}
              disabled
            />
            <p className="text-xs text-gray-600 mt-1">
              Email cannot be changed
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Role
            </label>
            <input
              className="input-field opacity-60 cursor-not-allowed capitalize"
              value={user?.role}
              disabled
            />
          </div>
          <button
            onClick={() => profileMutation.mutate(profileForm)}
            disabled={!profileForm.name.trim() || profileMutation.isPending}
            className="btn-primary w-full justify-center"
          >
            {profileMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      )}

      {tab === "password" && (
        <div className="card space-y-4">
          {[
            {
              key: "currentPassword",
              label: "Current Password",
              show: showPass.current,
              toggle: () => setShowPass((p) => ({ ...p, current: !p.current })),
            },
            {
              key: "newPassword",
              label: "New Password",
              show: showPass.new,
              toggle: () => setShowPass((p) => ({ ...p, new: !p.new })),
            },
            {
              key: "confirmPassword",
              label: "Confirm New Password",
              show: showPass.confirm,
              toggle: () => setShowPass((p) => ({ ...p, confirm: !p.confirm })),
            },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={field.show ? "text" : "password"}
                  className="input-field pr-11"
                  value={passForm[field.key]}
                  onChange={(e) =>
                    setPassForm({ ...passForm, [field.key]: e.target.value })
                  }
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={field.toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {field.show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handlePasswordSubmit}
            disabled={
              !passForm.currentPassword ||
              !passForm.newPassword ||
              passwordMutation.isPending
            }
            className="btn-primary w-full justify-center mt-2"
          >
            {passwordMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Lock size={16} />
            )}
            Change Password
          </button>
        </div>
      )}
    </div>
  );
}
