import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

const API_BASE = "http://localhost:8000";

export default function AuthPage({ onLogin }) {
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (mode === "register") {
                const res = await fetch(`${API_BASE}/app/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Registration failed");
                setSuccess("Account created! Switching to login…");
                setTimeout(() => {
                    setMode("login");
                    setSuccess("");
                }, 1500);
            } else {
                const res = await fetch(`${API_BASE}/app/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Login failed");
                // Save to localStorage & callback
                localStorage.setItem("invixa_user", JSON.stringify(data.user));
                onLogin(data.user);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setMode(mode === "login" ? "register" : "login");
        setError("");
        setSuccess("");
    };

    return (
        <div className="min-h-screen w-screen bg-gray-950 flex items-center justify-center relative overflow-hidden font-sans">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/4 rounded-full blur-3xl" />
                {/* Dot grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-900/40 mb-4"
                    >
                        <Sparkles size={24} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Invixa AI
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {mode === "login" ? "Welcome back! Sign in to continue." : "Create your account to get started."}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-black/30">

                    {/* Mode toggle pills */}
                    <div className="flex items-center gap-1 p-1 bg-gray-950 border border-gray-800/60 rounded-full mb-8">
                        {["login", "register"].map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                                    mode === m
                                        ? "bg-gray-800 text-white shadow-md border border-gray-700/50"
                                        : "text-gray-500 hover:text-gray-300"
                                }`}
                            >
                                {m === "login" ? "Sign In" : "Sign Up"}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={mode}
                            initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-5"
                        >
                            {/* Username (register only) */}
                            {mode === "register" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative"
                                >
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        id="auth-username"
                                        type="text"
                                        placeholder="Full Name"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required={mode === "register"}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-950 border border-gray-800/80 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                    />
                                </motion.div>
                            )}

                            {/* Email */}
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    id="auth-email"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-950 border border-gray-800/80 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    id="auth-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-950 border border-gray-800/80 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-xs"
                                >
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* Success */}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 px-4 py-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs"
                                >
                                    <CheckCircle size={14} className="shrink-0" />
                                    <span>{success}</span>
                                </motion.div>
                            )}

                            {/* Submit */}
                            <button
                                id="auth-submit"
                                type="submit"
                                disabled={loading}
                                className="group flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-xl shadow-indigo-900/30 hover:shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {mode === "login" ? "Sign In" : "Create Account"}
                                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-600">
                            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={switchMode}
                                className="text-indigo-400 hover:text-indigo-300 font-medium ml-1 transition-colors"
                            >
                                {mode === "login" ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Bottom copyright */}
                <p className="text-center text-[10px] text-gray-700 mt-6">
                    © 2026 Invixa AI · All rights reserved
                </p>
            </motion.div>
        </div>
    );
}
