"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      if (!navigator.onLine) {
        throw new Error("You are offline. Please connect to the internet to login.");
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push(`/match/${data.userId}`);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Network error");
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-fuchsia-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/60 p-7">

          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-fuchsia-500/30 mb-4">
              AI
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue your journey</p>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKey}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition"
            />

            {error && (
              <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 text-white text-sm font-semibold shadow-lg shadow-fuchsia-900/40 hover:brightness-110 hover:shadow-fuchsia-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="w-full py-3 rounded-xl border border-slate-700/80 bg-transparent text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition-all duration-200"
              >
                New here? Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
