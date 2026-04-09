import { useState, useRef, useEffect } from "react";
import {
    Send, Loader2, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
    Terminal, ChevronDown, CheckCircle2, XCircle, Sparkles, Bot, User,
    AlertTriangle, Maximize2
} from "lucide-react";
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
    ScatterChart, Scatter, ComposedChart, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API_BASE = "https://invixa-ai.onrender.com";

// ───────────────────────── helpers ─────────────────────────

function SqlBadge({ sql }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-2">
            <button
                onClick={() => setOpen(p => !p)}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-mono"
            >
                <Terminal size={12} />
                {open ? "Hide Query" : "Show Query"}
                <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <pre className="mt-2 text-xs bg-black/40 border border-indigo-900/50 rounded-lg p-3 text-indigo-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    {sql}
                </pre>
            )}
        </div>
    );
}

// ───────────────────────── Dynamic Chart Renderer ─────────────────────────

function ChartRenderer({ spec }) {
    if (!spec || !spec.data || spec.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertTriangle size={32} className="mb-2 text-yellow-500/50" />
                <p className="text-sm">No data available for this chart</p>
                {spec?.warning && <p className="text-xs text-yellow-500/70 mt-1 max-w-sm text-center">{spec.warning}</p>}
            </div>
        );
    }

    const { chart_type, data, x_key, y_key, color, x_label, y_label } = spec;

    const commonTooltip = {
        contentStyle: { backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#F3F4F6' },
        itemStyle: { color: '#F3F4F6' }
    };

    const renderEmptyState = () => (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">Unsupported chart type: {chart_type}</div>
    );

    switch (chart_type) {
        case "bar":
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey={x_key} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <Tooltip {...commonTooltip} />
                        <Legend />
                        <Bar dataKey={y_key} name={y_label || y_key} fill={color || "#6366f1"} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        case "line":
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey={x_key} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <Tooltip {...commonTooltip} />
                        <Legend />
                        <Line type="monotone" dataKey={y_key} name={y_label || y_key} stroke={color || "#10b981"} strokeWidth={3} dot={{ r: 4, fill: '#1f2937' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            );
        case "area":
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color || "#8b5cf6"} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color || "#8b5cf6"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey={x_key} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <Tooltip {...commonTooltip} />
                        <Legend />
                        <Area type="monotone" dataKey={y_key} name={y_label || y_key} stroke={color || "#8b5cf6"} fillOpacity={1} fill="url(#colorArea)" />
                    </AreaChart>
                </ResponsiveContainer>
            );
        case "pie":
            // For pie, x_key is usually the name/category, y_key is the value
            const PIE_COLORS = [color || '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip {...commonTooltip} />
                        <Legend />
                        <Pie
                            data={data}
                            dataKey={y_key}
                            nameKey={x_key}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            );
        case "scatter":
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" dataKey={x_key} name={x_label || x_key} stroke="#9CA3AF" />
                        <YAxis type="number" dataKey={y_key} name={y_label || y_key} stroke="#9CA3AF" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} {...commonTooltip} />
                        <Legend />
                        <Scatter name={spec.title || "Data"} data={data} fill={color || "#f43f5e"} />
                    </ScatterChart>
                </ResponsiveContainer>
            );
        case "composed":
            // Fallback composed chart (bar + line overlay)
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey={x_key} stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip {...commonTooltip} />
                        <Legend />
                        <Bar dataKey={y_key} name={y_label || y_key} barSize={20} fill={color || "#413ea0"} />
                        <Line type="monotone" dataKey={y_key} stroke="#ff7300" />
                    </ComposedChart>
                </ResponsiveContainer>
            );
        default:
            return renderEmptyState();
    }
}

// ───────────────────────── Main Analytics Page ─────────────────────────

export default function Chat({ user }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "assistant",
            content: "Welcome to Data Analytics! Ask me to visualise any data from your database (e.g. 'Show me a bar chart of users by role' or 'Revenue over time').",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isChart: false,
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeChart, setActiveChart] = useState(null); // The chart currently shown on the right panel
    
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // User bubble
        const userMsg = { id: Date.now(), role: "user", content: trimmed, time: now };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const loadingId = Date.now() + 1;
        setMessages(prev => [...prev, { id: loadingId, role: "assistant", loading: true, content: "", time: now }]);

        try {
            const res = await fetch(`${API_BASE}/generate-graph`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: trimmed, user_id: user?.id }),
            });
            const data = await res.json();
            
            if (!res.ok) {
                // Remove loading bubble, add error
                setMessages(prev => {
                    const next = [...prev];
                    next.pop(); // remove loading
                    next.push({ id: Date.now(), role: "assistant", error: true, content: data.detail || "Generation failed" });
                    return next;
                });
                setLoading(false);
                return;
            }

            const chartSpec = data; // the whole JSON is the spec
            
            // Remove loading bubble, add chart response
            const finalMsg = {
                id: Date.now(),
                role: "assistant",
                content: chartSpec.description || `Here is the ${chartSpec.chart_type} chart you requested.`,
                isChart: true,
                spec: chartSpec,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setMessages(prev => {
                const next = [...prev];
                next.pop(); // remove loading bubble
                next.push(finalMsg);
                return next;
            });
            
            // Auto-focus the new chart on the right panel
            setActiveChart(chartSpec);

        } catch (e) {
            setMessages(prev => {
                const next = [...prev];
                next.pop();
                next.push({ id: Date.now(), role: "assistant", error: true, content: e.message });
                return next;
            });
        } finally {
            setLoading(false);
            textareaRef.current?.focus();
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestions = [
        "Show a bar chart of the top 5 tables by row count",
        "Plot a pie chart of...",
        "Show users over time as a line chart"
    ];

    return (
        <div className="flex h-full bg-gray-950 text-white overflow-hidden font-sans">

            {/* ── LEFT: Chat Panel ── */}
            <div className="flex flex-col w-[35%] min-w-[320px] max-w-[400px] border-r border-gray-800/80 bg-gray-950 z-10 relative shadow-2xl">
                
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800/80 bg-gray-900/50 backdrop-blur shrink-0">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
                            <BarChart3 size={17} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white tracking-wide">AI Analytics</h2>
                        <p className="text-xs text-gray-400">Database Visualisation</p>
                    </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
                    {messages.map(msg => {
                        const isUser = msg.role === "user";
                        return (
                            <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start animate-fade-in`}>
                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${isUser ? "bg-gradient-to-br from-indigo-400 to-violet-600 text-white" : "bg-gradient-to-br from-blue-500 to-indigo-700 text-white"}`}>
                                    {isUser ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={`max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                                        isUser ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm" 
                                        : msg.error ? "bg-red-900/40 border border-red-700/50 text-red-300 rounded-tl-sm"
                                        : "bg-gray-800 border border-gray-700/60 text-gray-200 rounded-tl-sm"
                                    }`}>
                                        {msg.loading ? (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Analyzing data…</span>
                                            </div>
                                        ) : msg.error ? (
                                            <div className="flex items-start gap-2">
                                                <XCircle size={14} className="mt-0.5 shrink-0" />
                                                <span>{msg.content}</span>
                                            </div>
                                        ) : (
                                            <div>{msg.content}</div>
                                        )}
                                    </div>
                                    
                                    {/* Chart Payload Preview (Clickable) */}
                                    {msg.isChart && msg.spec && (
                                        <div 
                                            onClick={() => setActiveChart(msg.spec)}
                                            className={`mt-2 p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all duration-200 w-full group ${
                                                activeChart === msg.spec 
                                                ? "bg-indigo-900/40 border-indigo-500" 
                                                : "bg-gray-900/50 border-gray-700/60 hover:border-indigo-500/50 hover:bg-gray-800/80"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                                                {msg.spec.chart_type === "pie" ? <PieChartIcon size={14}/> : msg.spec.chart_type === "line" ? <LineChartIcon size={14}/> : <BarChart3 size={14} />}
                                                <span>{msg.spec.title}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center justify-between">
                                                <span>{msg.spec.row_count} data points plotted</span>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${activeChart === msg.spec ? "text-indigo-400" : "text-gray-600 group-hover:text-indigo-400/70"}`}>
                                                    {activeChart === msg.spec ? "Viewing" : "Click to view"}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* SQL Query Toggle */}
                                    {msg.spec?.executed_sql && <div className="px-1 w-full mt-2"><SqlBadge sql={msg.spec.executed_sql} /></div>}

                                    <span className="text-gray-600 text-[10px] mt-1 px-1 select-none">{msg.time}</span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 shrink-0 bg-gray-950">
                    {messages.length === 1 && (
                        <div className="pb-3 flex flex-wrap gap-2">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => setInput(s)} className="text-xs bg-gray-800/70 hover:bg-gray-700/80 border border-gray-700/60 hover:border-indigo-500/40 text-gray-400 hover:text-indigo-300 px-3 py-1.5 rounded-full transition-all text-left">
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex items-end gap-2 bg-gray-900 border border-gray-700/60 hover:border-indigo-500/40 focus-within:border-indigo-500/60 rounded-2xl px-4 py-3 transition-colors shadow-xl">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Describe the graph you want to see…"
                            rows={2}
                            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500 resize-none overflow-y-auto leading-relaxed [scrollbar-width:none]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-900/30 hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Graph Render Panel ── */}
            <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

                {!activeChart ? (
                    <div className="flex flex-col items-center justify-center text-gray-600 z-10 animate-fade-in font-light">
                        <BarChart3 size={64} className="mb-6 opacity-20" strokeWidth={1} />
                        <h3 className="text-xl text-gray-400 mb-2 tracking-wide font-normal">Analytics Canvas</h3>
                        <p className="max-w-md text-center text-sm leading-relaxed text-gray-500">
                            Ask the AI to plot your data. The generated graph will be drawn here dynamically.
                        </p>
                    </div>
                ) : (
                    <div className="absolute inset-4 sm:inset-8 lg:inset-12 flex flex-col bg-gray-950/80 backdrop-blur-xl border border-gray-800/60 rounded-3xl shadow-2xl shadow-indigo-900/10 overflow-hidden animate-fade-in">
                        
                        {/* Chart Header Toolbar */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800/60 bg-gradient-to-r from-gray-900/80 to-transparent shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-1">
                                    {activeChart.title}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {activeChart.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono bg-gray-800 px-3 py-1.5 rounded-lg text-gray-400 border border-gray-700/50">
                                    {activeChart.chart_type.toUpperCase()}
                                </span>
                                <button className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors border border-gray-700/50 cursor-pointer group" title="Fullscreen (demo)">
                                    <Maximize2 size={16} className="group-hover:scale-110 transition-transform"/>
                                </button>
                            </div>
                        </div>

                        {/* Chart Render Area */}
                        <div className="flex-1 px-8 py-8 min-h-0 w-full">
                            <ChartRenderer spec={activeChart} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}