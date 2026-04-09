import { useState, useEffect } from "react";
import { 
    User, Mail, LayoutTemplate, ShieldCheck, Key, Settings, 
    Database as DbIcon, HardDrive, Cpu, Clock, Activity, AlertCircle,
    BarChart3, LineChart as LineIcon, PieChart as PieIcon, ScatterChart as ScatterIcon, Search, Maximize2, X,
    LogOut, Save, Lock, CheckCircle, Edit3
} from "lucide-react";
import { 
    AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
    LineChart, Line, PieChart, Pie, ScatterChart, Scatter, ComposedChart, Cell, CartesianGrid, Legend
} from "recharts";

const API_BASE = "https://invixa-ai.onrender.com";

export default function Account({ user, setUser, onLogout }) {
    const [dbInfo, setDbInfo] = useState({ tables: 0, rows: 0, loading: true });
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [activeChart, setActiveChart] = useState(null);

    // Editing states
    const [editMode, setEditMode] = useState(false);
    const [editUsername, setEditUsername] = useState(user?.username || "");
    const [editRole, setEditRole] = useState(user?.role || "");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    // Change password states
    const [showPwdForm, setShowPwdForm] = useState(false);
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
    const [pwdSaving, setPwdSaving] = useState(false);

    // Chart Icon mapper
    const getChartIcon = (type) => {
        if (type === 'pie') return <PieIcon size={14} className="text-gray-400 group-hover:text-indigo-400 transition-colors"/>;
        if (type === 'scatter') return <ScatterIcon size={14} className="text-gray-400 group-hover:text-indigo-400 transition-colors"/>;
        if (type === 'line' || type === 'area') return <LineIcon size={14} className="text-gray-400 group-hover:text-indigo-400 transition-colors"/>;
        return <BarChart3 size={14} className="text-gray-400 group-hover:text-indigo-400 transition-colors"/>;
    };

    // Generic Chart Renderer
    const renderMiniChart = (chart, isModal = false) => {
        if (!chart.data || chart.data.length === 0) return <div className="flex h-full items-center justify-center text-xs text-gray-500">No data</div>;
        
        const { type, data, x_key, y_key, color } = chart;
        const mainColor = color || "#8b5cf6";

        switch (type) {
            case "bar":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            {isModal && <XAxis dataKey={x_key} stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <YAxis stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151'}} />}
                            <Bar dataKey={y_key} fill={mainColor} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case "line":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            {isModal && <XAxis dataKey={x_key} stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <YAxis stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151'}} />}
                            <Line type="monotone" dataKey={y_key} stroke={mainColor} strokeWidth={isModal ? 3 : 2} dot={isModal} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case "area":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`grad-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={mainColor} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={mainColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            {isModal && <XAxis dataKey={x_key} stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <YAxis stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151'}} />}
                            <Area type="monotone" dataKey={y_key} stroke={mainColor} strokeWidth={2} fill={`url(#grad-${chart.id})`} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case "pie":
                const PIE_COLORS = [mainColor, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {isModal && <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151'}} />}
                            {isModal && <Legend />}
                            <Pie data={data} dataKey={y_key} nameKey={x_key} cx="50%" cy="50%" innerRadius={isModal ? 60 : 0} outerRadius={isModal ? 100 : '90%'}>
                                {data.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                );
            case "scatter":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                            {isModal && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
                            {isModal && <XAxis type="number" dataKey={x_key} stroke="#9CA3AF" fontSize={12} />}
                            <YAxis type="number" dataKey={y_key} stroke="#9CA3AF" fontSize={12} hide={!isModal} />
                            {isModal && <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#111827', borderColor: '#374151'}} />}
                            <Scatter name="Data" data={data} fill={mainColor} isAnimationActive={false} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            case "composed":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data}>
                            {isModal && <XAxis dataKey={x_key} stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <YAxis stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151'}} />}
                            <Bar dataKey={y_key} barSize={20} fill={mainColor} isAnimationActive={false} />
                            <Line type="monotone" dataKey={y_key} stroke="#ff7300" isAnimationActive={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                );
            default:
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            {isModal && <XAxis dataKey={x_key} stroke="#9CA3AF" fontSize={12} />}
                            {isModal && <YAxis stroke="#9CA3AF" fontSize={12} />}
                            <Bar dataKey={y_key} fill={mainColor} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    // Fetch live DB stats for the "Database Information" card
    useEffect(() => {
        fetch(`${API_BASE}/db/tables`)
            .then(res => res.json())
            .then(data => {
                const totalTables = data.tables?.length || 0;
                const totalRows = data.tables?.reduce((sum, t) => sum + (t.row_count || 0), 0) || 0;
                setDbInfo({ tables: totalTables, rows: totalRows, loading: false });
            })
            .catch(() => setDbInfo({ tables: "?", rows: "?", loading: false }));

        fetch(`${API_BASE}/saved-graphs`)
            .then(res => res.json())
            .then(data => {
                setHistory(data.charts || []);
                setLoadingHistory(false);
            })
            .catch(() => setLoadingHistory(false));
    }, []);

    // Handle profile update
    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMsg("");
        try {
            const res = await fetch(`${API_BASE}/app/users/me/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: editUsername, role: editRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Update failed");
            // Sync user state and localStorage
            const updatedUser = data.user;
            setUser(updatedUser);
            localStorage.setItem("invixa_user", JSON.stringify(updatedUser));
            setSaveMsg("Profile updated!");
            setEditMode(false);
            setTimeout(() => setSaveMsg(""), 3000);
        } catch (err) {
            setSaveMsg("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handle password change
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdSaving(true);
        setPwdMsg({ type: "", text: "" });
        try {
            const res = await fetch(`${API_BASE}/app/users/me/${user.id}/password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Password change failed");
            setPwdMsg({ type: "success", text: "Password changed successfully!" });
            setCurrentPwd("");
            setNewPwd("");
            setTimeout(() => { setShowPwdForm(false); setPwdMsg({ type: "", text: "" }); }, 2000);
        } catch (err) {
            setPwdMsg({ type: "error", text: err.message });
        } finally {
            setPwdSaving(false);
        }
    };

    // Format join date
    const joinedDate = user?.joined_at
        ? new Date(user.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "Unknown";

    return (
        <div className="min-h-full bg-gray-950 text-white p-6 sm:p-10 font-sans">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

            <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col gap-8 animate-fade-in">
                
                {/* ── Page Header ── */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-1">
                            Account & Settings
                        </h1>
                        <p className="text-sm text-gray-500">Manage your profile, database connections, and AI workspace.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* ── LEFT COLUMN: User + Database Info ── */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        
                        {/* User Profile Card */}
                        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-900/20 mb-4 border-4 border-gray-950">
                                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                                </div>

                                {editMode ? (
                                    <input
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        className="text-xl font-bold text-white bg-gray-950 border border-gray-700 rounded-xl px-3 py-1.5 text-center focus:outline-none focus:border-indigo-500/60 w-full mb-2"
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold text-white">{user?.username || "User"}</h2>
                                )}

                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-mono mt-2 flex items-center gap-1.5 inline-flex">
                                    <ShieldCheck size={12} /> {user?.role || "user"}
                                </span>
                            </div>

                            <div className="mt-8 flex flex-col gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-indigo-400" />
                                    <span className="truncate">{user?.email || "—"}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-indigo-400" />
                                    <span>Joined {joinedDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Key size={16} className="text-indigo-400" />
                                    <span>API Access: <span className="text-emerald-400 font-mono">{user?.is_active ? "Active" : "Disabled"}</span></span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="mt-6 flex flex-col gap-2">
                                {editMode ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50"
                                        >
                                            {saving ? <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
                                        </button>
                                        <button
                                            onClick={() => { setEditMode(false); setEditUsername(user?.username || ""); }}
                                            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 text-gray-400 rounded-xl hover:bg-gray-800 transition-all text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-all text-sm font-medium"
                                    >
                                        <Edit3 size={14} /> Edit Profile
                                    </button>
                                )}

                                {saveMsg && (
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${saveMsg.startsWith("Error") ? "bg-red-500/8 border border-red-500/20 text-red-400" : "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"}`}>
                                        {saveMsg.startsWith("Error") ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                                        {saveMsg}
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowPwdForm(!showPwdForm)}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-all text-sm font-medium"
                                >
                                    <Lock size={14} /> Change Password
                                </button>

                                {/* Password change form */}
                                {showPwdForm && (
                                    <form onSubmit={handleChangePassword} className="flex flex-col gap-3 bg-gray-950 border border-gray-800/60 rounded-xl p-4 mt-1">
                                        <input
                                            type="password"
                                            placeholder="Current password"
                                            value={currentPwd}
                                            onChange={(e) => setCurrentPwd(e.target.value)}
                                            required
                                            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800/80 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60"
                                        />
                                        <input
                                            type="password"
                                            placeholder="New password (min 6 chars)"
                                            value={newPwd}
                                            onChange={(e) => setNewPwd(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800/80 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60"
                                        />
                                        {pwdMsg.text && (
                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${pwdMsg.type === "error" ? "bg-red-500/8 border border-red-500/20 text-red-400" : "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"}`}>
                                                {pwdMsg.type === "error" ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                                                {pwdMsg.text}
                                            </div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={pwdSaving}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50"
                                        >
                                            {pwdSaving ? <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" /> : "Update Password"}
                                        </button>
                                    </form>
                                )}

                                <button
                                    onClick={onLogout}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-red-500/8 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/15 transition-all text-sm font-medium mt-2"
                                >
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </div>

                        {/* Database Info Card */}
                        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/50">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <DbIcon size={16} className="text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Database Environment</h3>
                            </div>
                            
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Engine</span>
                                        <span className="text-sm font-mono text-gray-200 flex items-center gap-2"><Cpu size={14} className="text-indigo-400"/> SQLite 3</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</span>
                                        <span className="text-sm text-emerald-400 flex items-center justify-end gap-1.5"><Activity size={14}/> Online</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-950 border border-gray-800/60 rounded-xl">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Connection UI</span>
                                    <code className="text-xs text-indigo-300">sqlite:///sql_ai.db</code>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div className="bg-gray-800/30 border border-gray-700/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tables</span>
                                        {dbInfo.loading ? <span className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/> : <span className="text-xl font-mono text-white">{dbInfo.tables}</span>}
                                    </div>
                                    <div className="bg-gray-800/30 border border-gray-700/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rows</span>
                                        {dbInfo.loading ? <span className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"/> : <span className="text-xl font-mono text-emerald-400">{dbInfo.rows}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT COLUMN: Historical Charts ── */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-lg flex-1">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                        <LayoutTemplate size={16} className="text-violet-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">Recent AI Charts</h3>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">History from last 7 days</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loadingHistory ? (
                                    <div className="col-span-full h-40 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="col-span-full bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center text-gray-600 min-h-[160px]">
                                        <Search size={24} className="mb-2 opacity-50"/>
                                        <span className="text-xs">No chart history yet.<br/>Generate queries in the Analytics tab.</span>
                                    </div>
                                ) : history.map((chart) => (
                                    <div key={chart.id} className="group bg-gray-950 border border-gray-800/60 rounded-2xl p-5 hover:border-indigo-500/40 transition-all cursor-pointer shadow-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                {getChartIcon(chart.type)}
                                                <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate max-w-[140px]" title={chart.title}>{chart.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-600">
                                                    {new Date(chart.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <button onClick={() => setActiveChart(chart)} className="opacity-0 group-hover:opacity-100 p-1 bg-gray-800 hover:bg-gray-700 rounded transition-all text-gray-400 hover:text-white">
                                                    <Maximize2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Mini Render of the Chart */}
                                        <div className="h-28 w-full select-none cursor-pointer" onClick={() => setActiveChart(chart)}>
                                            {renderMiniChart(chart, false)}
                                        </div>
                                    </div>
                                ))}

                                {/* Empty Placeholders for aesthetics */}
                                <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center text-gray-600 h-full min-h-[160px]">
                                    <Search size={24} className="mb-2 opacity-50"/>
                                    <span className="text-xs">No more history available.<br/>Generate queries in the Analytics tab.</span>
                                </div>

                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* Modal for full view */}
            {activeChart && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">{activeChart.title}</h2>
                                <p className="text-xs text-gray-400 font-mono">Axes: {activeChart.x_key} / {activeChart.y_key}</p>
                            </div>
                            <button onClick={() => setActiveChart(null)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 h-[500px] w-full bg-gray-950">
                            {renderMiniChart(activeChart, true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}