import { useState, useEffect, useRef, useCallback } from "react";
import {
    Send, Database as DatabaseIcon, Table2, RefreshCw, Terminal,
    ChevronRight, Loader2, CheckCircle2, XCircle, Sparkles,
    Bot, User, ChevronDown, LayoutGrid, Rows3, Hash, Eye
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
const API_BASE = "http://localhost:8000";

// ───────────────────────── helpers ─────────────────────────
function TypewriterText({ text, speed = 8 }) {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        setDisplayed("");
        if (!text) return;
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);
    return <span>{displayed}</span>;
}

function SqlBadge({ sql }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-2">
            <button
                onClick={() => setOpen(p => !p)}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono"
            >
                <Terminal size={12} />
                {open ? "Hide SQL" : "View SQL"}
                <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <pre className="mt-2 text-xs bg-black/40 border border-gray-700 rounded-lg p-3 text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                    {sql}
                </pre>
            )}
        </div>
    );
}

const MD_COMPONENTS = {
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full border-collapse text-xs text-gray-300">
                {children}
            </table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border border-gray-700 bg-gray-900 px-3 py-2 text-left font-semibold text-emerald-400 whitespace-nowrap">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border border-gray-800 px-3 py-1.5 text-gray-300">
            {children}
        </td>
    ),
    code: ({ inline, children }) => inline
        ? <code className="bg-black/40 text-green-400 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
        : <pre className="bg-black/40 border border-gray-700 rounded-lg p-3 text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap my-2">{children}</pre>,
    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
    li: ({ children }) => <li className="text-gray-300">{children}</li>,
    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
};

/** Renders markdown with an optional typewriter animation.
 *  Keeps the animated substring in state so ReactMarkdown always
 *  receives a plain string (never a React element). */
function MarkdownContent({ text, animate, speed = 8 }) {
    const [displayed, setDisplayed] = useState(animate ? "" : text);
    useEffect(() => {
        if (!animate) { setDisplayed(text); return; }
        setDisplayed("");
        if (!text) return;
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [text, animate, speed]);
    return (
        <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]} components={MD_COMPONENTS}>
            {displayed}
        </ReactMarkdown>
    );
}

// ───────────────────────── ChatMessage ─────────────────────────
function ChatMessage({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start mb-5 animate-fade-in`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${isUser ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-black" : "bg-gradient-to-br from-indigo-500 to-purple-700 text-white"}`}>
                {isUser ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${isUser
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm"
                    : msg.status === "error"
                        ? "bg-red-900/40 border border-red-700/50 text-red-300 rounded-tl-sm"
                        : "bg-gray-800 border border-gray-700/60 text-gray-200 rounded-tl-sm"
                    }`}>
                    {msg.loading ? (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Thinking…</span>
                        </div>
                    ) : msg.status === "error" ? (
                        <div className="flex items-start gap-2">
                            <XCircle size={14} className="mt-0.5 text-red-400 shrink-0" />
                            <MarkdownContent text={msg.content} animate={false} />
                        </div>
                    ) : (
                        <MarkdownContent text={msg.content} animate={msg.animate} />
                    )}
                </div>

                {/* SQL badge */}
                {msg.sql && <div className="px-1"><SqlBadge sql={msg.sql} /></div>}

                {/* Inline result rows preview */}
                {msg.rows && msg.rows.length > 0 && (
                    <div className="mt-2 w-full overflow-x-auto rounded-lg border border-gray-700 shadow">
                        <table className="text-xs text-gray-300 w-full">
                            <thead className="bg-gray-900/80">
                                <tr>
                                    {Object.keys(msg.rows[0]).map(k => (
                                        <th key={k} className="px-3 py-1.5 text-left text-emerald-400 font-mono border-b border-gray-700 whitespace-nowrap">
                                            {k}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {msg.rows.slice(0, 5).map((row, i) => (
                                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        {Object.values(row).map((v, j) => (
                                            <td key={j} className="px-3 py-1.5 font-mono whitespace-nowrap">{String(v ?? "NULL")}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {msg.rows.length > 5 && (
                            <div className="text-center text-xs text-gray-500 py-1">…and {msg.rows.length - 5} more rows</div>
                        )}
                    </div>
                )}

                {/* Status pill */}
                {msg.status === "success" && !msg.loading && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 px-1">
                        <CheckCircle2 size={11} /> Done
                    </div>
                )}

                <span className="text-gray-600 text-[10px] mt-1 px-1 select-none">
                    {msg.time}
                </span>
            </div>
        </div>
    );
}

// ───────────────────────── DatabasePreview ─────────────────────────
function DatabasePreview({ refreshTrigger }) {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableData, setTableData] = useState(null);
    const [loadingTables, setLoadingTables] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState(null);

    const fetchTables = useCallback(async () => {
        setLoadingTables(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/db/tables`);
            if (!res.ok) throw new Error("Failed to fetch tables");
            const data = await res.json();
            setTables(data.tables.filter(t=> t.name !== "saved_charts") || []);
            // Auto-select first table
            if (data.tables?.filter(t=>t.name!=="saved_charts").length > 0 && !selectedTable) {
                setSelectedTable(data.tables[0].name);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingTables(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    const fetchTableData = useCallback(async (tableName) => {
        if (!tableName) return;
        setLoadingData(true);
        try {
            const res = await fetch(`${API_BASE}/db/table/${tableName}`);
            if (!res.ok) throw new Error("Failed to fetch table data");
            const data = await res.json();
            setTableData(data);
        } catch (e) {
            setTableData({ error: e.message });
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);
    useEffect(() => { if (selectedTable) fetchTableData(selectedTable); }, [selectedTable, fetchTableData, refreshTrigger]);

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Tables Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/80 bg-gray-900/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <LayoutGrid size={15} className="text-emerald-400" />
                    Tables
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">
                        {tables.length}
                    </span>
                </div>
                <button
                    onClick={fetchTables}
                    disabled={loadingTables}
                    className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={13} className={loadingTables ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Table List */}
                <div className="w-44 flex-shrink-0 border-r border-gray-800/80 overflow-y-auto bg-gray-950/40">
                    {error ? (
                        <div className="p-3 text-xs text-red-400">{error}</div>
                    ) : loadingTables ? (
                        <div className="p-4 flex flex-col gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-8 bg-gray-800/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="p-4 text-center">
                            <DatabaseIcon size={24} className="text-gray-700 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">No tables yet</p>
                            <p className="text-[10px] text-gray-700 mt-1">Use the chatbot to create one</p>
                        </div>
                    ) : (
                        <div className="p-2 flex flex-col gap-1">
                            {tables.map(t => (
                                <button
                                    key={t.name}
                                    onClick={() => setSelectedTable(t.name)}
                                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 group ${selectedTable === t.name
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent"
                                        }`}
                                >
                                    <Table2 size={12} className={selectedTable === t.name ? "text-emerald-400" : "text-gray-600 group-hover:text-gray-400"} />
                                    <span className="truncate font-mono">{t.name}</span>
                                    {selectedTable === t.name && <ChevronRight size={10} className="ml-auto flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Table Data Panel */}
                <div className="flex-1 flex flex-col min-w-0">
                    {selectedTable ? (
                        <>
                            {/* Table Header */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/30 border-b border-gray-800/80 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Eye size={13} className="text-indigo-400" />
                                    <span className="text-sm font-mono font-semibold text-white">{selectedTable}</span>
                                    {tableData && !tableData.error && (
                                        <div className="flex items-center gap-3 ml-3">
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Rows3 size={10} /> {tableData.row_count ?? "?"} rows
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Hash size={10} /> {tableData.columns?.length ?? "?"} cols
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {loadingData && <Loader2 size={13} className="animate-spin text-gray-500" />}
                            </div>

                            {/* Data Table */}
                            <div className="flex-1 overflow-auto">
                                {loadingData ? (
                                    <div className="p-6 flex flex-col gap-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-7 bg-gray-800/50 rounded animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                                        ))}
                                    </div>
                                ) : tableData?.error ? (
                                    <div className="p-6 text-xs text-red-400">{tableData.error}</div>
                                ) : tableData?.rows?.length === 0 ? (
                                    <table className="w-full text-xs text-gray-300 border-collapse">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-gray-900/90 backdrop-blur">
                                                {tableData.columns.map(col => (
                                                    <th key={col} className="px-4 py-2.5 text-left text-emerald-400 font-mono font-semibold border-b border-gray-800 whitespace-nowrap">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan={tableData.columns.length} className="px-4 py-8 text-center text-gray-600">
                                                    <Rows3 size={22} className="mx-auto mb-2 opacity-40" />
                                                    <span className="block text-xs">No rows yet — use the chatbot to insert data</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                ) : tableData?.rows ? (
                                    <table className="w-full text-xs text-gray-300 border-collapse">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-gray-900/90 backdrop-blur">
                                                {tableData.columns.map(col => (
                                                    <th key={col} className="px-4 py-2.5 text-left text-emerald-400 font-mono font-semibold border-b border-gray-800 whitespace-nowrap">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.rows.map((row, i) => (
                                                <tr key={i} className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors group ${i % 2 === 0 ? "" : "bg-gray-900/20"}`}>
                                                    {tableData.columns.map(col => (
                                                        <td key={col} className="px-4 py-2 font-mono whitespace-nowrap text-gray-300 group-hover:text-gray-100">
                                                            {row[col] === null || row[col] === undefined
                                                                ? <span className="text-gray-600 italic">NULL</span>
                                                                : String(row[col])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-700">
                            <DatabaseIcon size={36} className="mb-3" />
                            <p className="text-sm">Select a table to preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ───────────────────────── Main Database Page ─────────────────────────
export default function Database({ user }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "assistant",
            content: "Hey! I'm your AI database assistant. Tell me what you'd like to do — create tables, insert data, query records, or anything else. I'll write and execute the SQL for you.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            animate: false,
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const addMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
    };

    const updateLastMessage = (updater) => {
        setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], ...updater };
            return next;
        });
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // User bubble
        addMessage({ id: Date.now(), role: "user", content: trimmed, time: now });
        setInput("");
        setLoading(true);

        // AI thinking bubble
        const loadingId = Date.now() + 1;
        setTimeout(() => {
            addMessage({ id: loadingId, role: "assistant", loading: true, content: "", time: now });
        }, 100);

        try {
            const res = await fetch(`${API_BASE}/generate-sql`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: trimmed, user_id: user?.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Request failed");

            // Replace loading bubble
            const isChatReply = data.status === "chat";
            updateLastMessage({
                loading: false,
                status: isChatReply ? "chat" : "success",
                content: data.explanation || "Done! The SQL was executed successfully.",
                sql: isChatReply ? null : data.executed_sql,
                rows: (!isChatReply && Array.isArray(data.content)) ? data.content : null,
                animate: true,
            });

            // Only refresh the DB preview when SQL was actually executed
            if (!isChatReply) {
                setRefreshKey(k => k + 1);
            }
        } catch (e) {
            updateLastMessage({
                loading: false,
                status: "error",
                content: `Error: ${e.message}`,
                animate: false,
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
        "Create a users table with name, email and age",
        "Insert 3 sample products into a products table",
        "Show all users",
        "Add a created_at column to users",
    ];

    return (
        <div className="flex h-full bg-gray-950 text-white overflow-hidden">

            {/* ── LEFT: Chat Panel ── */}
            <div className="flex flex-col w-[45%] min-w-[340px] border-r border-gray-800/80 bg-gray-950">

                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800/80 bg-gray-900/50 backdrop-blur flex-shrink-0">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
                            <Sparkles size={17} className="text-white" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-950" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white tracking-wide">SQL AI Assistant</h2>
                        <p className="text-xs text-gray-500">Powered by DeepSeek · SQLite</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
                    {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
                    <div ref={chatEndRef} />
                </div>

                {/* Suggestions (only when idle) */}
                {messages.length === 1 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(s)}
                                className="text-xs bg-gray-800/70 hover:bg-gray-700/80 border border-gray-700/60 hover:border-emerald-500/40 text-gray-400 hover:text-emerald-300 px-3 py-1.5 rounded-full transition-all duration-200"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Bar */}
                <div className="px-4 pb-4 flex-shrink-0">
                    <div className="flex items-end gap-2 bg-gray-900 border border-gray-700/60 hover:border-emerald-500/40 focus-within:border-emerald-500/60 rounded-2xl px-4 py-3 transition-colors shadow-xl shadow-black/20">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask me to create tables, insert data, query…"
                            rows={2}
                            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600 resize-none overflow-y-auto leading-relaxed [scrollbar-width:none]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/40 hover:scale-105 active:scale-95"
                        >
                            {loading
                                ? <Loader2 size={14} className="animate-spin text-white" />
                                : <Send size={14} className="text-white" />
                            }
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-700 mt-2">Shift+Enter for new line · Enter to send</p>
                </div>
            </div>

            {/* ── RIGHT: DB Preview Panel ── */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-950">

                {/* Preview Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800/80 bg-gray-900/50 backdrop-blur flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                        <DatabaseIcon size={17} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white tracking-wide">Database Preview</h2>
                        <p className="text-xs text-gray-500">Real-time · SQLite · Auto-refreshed</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                        {refreshKey > 0 ? `Refreshed` : "Live"}
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 min-h-0">
                    <DatabasePreview refreshTrigger={refreshKey} />
                </div>
            </div>
        </div>
    );
}