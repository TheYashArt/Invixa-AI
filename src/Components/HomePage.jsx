import { Database, Send, Sparkle, TableProperties, Circle, ArrowRight, LayoutDashboard, Hash, Rows3, Eye } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage({ setSelected }) {
    const API_BASE = "https://invixa-ai.onrender.com";
    const [tables, setTables] = useState(0);
    const [rows, setRows] = useState(0);
    const [cols, setCols] = useState(0)
    const [engine, setEngine] = useState("SQLite");
    const [tablesData, setTablesData] = useState([])

    useEffect(() => {
        fetch(`${API_BASE}/db/tables`)
            .then(res => res.json())
            .then(data => {
                setTables(data.tables?.length-1 || 0);
                setRows(data.tables?.filter(t=>t.name!=="saved_charts").reduce((sum, t) => sum + (t.row_count || 0), 0) || 0)
                const newTables = data.tables.filter(t=>t.name!=="saved_charts" ).map(t => ({
                    name: t.name,
                    columns: t.col_count || 0,
                    rows: t.row_count || 0,
                    activity: "2 hours ago"
                }));

                // Set the entire array at once
                setTablesData(newTables);
            })
            .catch(() => {
                setTables("?");
                setRows("?");
            })
    }, [])

    return (
        <div className="flex flex-col min-h-full bg-gray-950 font-sans text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

            <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-12 z-10 flex flex-col gap-12">

                {/* ── Header Section ── */}
                <div className="flex flex-col items-center justify-center text-center mt-6 animate-fade-in">
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4 tracking-tight">
                        Good morning, Yash
                    </h1>
                    <p className="text-gray-400 max-w-lg text-sm sm:text-base leading-relaxed">
                        Your AI-powered database assistant is ready. Ask questions, generate graphs, or manipulate data via natural language.
                    </p>
                </div>

                {/* ── Main Prompt Input ── */}
                <div className="w-full max-w-3xl mx-auto -mt-4 mb-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
                    <div className="flex flex-col bg-gray-900 border border-gray-700/60 hover:border-indigo-500/40 focus-within:border-indigo-500/60 transition-all duration-300 rounded-3xl p-2 shadow-2xl shadow-indigo-900/10">
                        <textarea
                            rows={3}
                            placeholder="How much revenue did we make this week?"
                            className="bg-transparent text-white placeholder-gray-500 outline-none w-full resize-none p-4 text-sm sm:text-base leading-relaxed overflow-y-auto [scrollbar-width:none]"
                        />
                        <div className="flex justify-between items-center px-4 pb-2 pt-1 border-t border-gray-800/40">
                            <span className="text-xs font-mono text-gray-500 flex items-center gap-2">
                                <Sparkle size={12} className="text-indigo-400" />
                                Try asking for a chart or data summary
                            </span>
                            <button
                                onClick={() => setSelected?.("Analytics")}
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-900/30 transition-transform hover:scale-105 active:scale-95"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Dashboard Cards Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full animate-fade-in" style={{ animationDelay: "200ms" }}>

                    {/* Left Panel: AI Summary */}
                    <div className="lg:col-span-1 bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md flex flex-col shadow-lg">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/50">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Sparkle size={16} className="text-indigo-400" />
                            </div>
                            <h2 className="text-lg font-semibold tracking-wide text-white">Quick Insight</h2>
                        </div>
                        <div className="text-sm text-gray-400 leading-relaxed font-light flex-1">
                            <p className="mb-4">
                                The database has seen rapid growth today. Specifically, the <span className="text-indigo-300 font-mono">Users</span> and <span className="text-indigo-300 font-mono">Orders</span> tables have contributed to 85% of incoming rows over the last 24 hours.
                            </p>
                            <p>
                                Based on your last prompt, sales dipped around 4:00 PM yesterday. You might want to generate a <strong>Revenue Line Chart</strong> in the Analytics tab.
                            </p>
                        </div>
                        <button
                            onClick={() => setSelected?.("Analytics")}
                            className="mt-6 w-full py-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            Open Analytics <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* Right Panel: Database Overview */}
                    <div className="lg:col-span-2 bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md shadow-lg flex flex-col">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/50">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Database size={16} className="text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-semibold tracking-wide text-white flex-1">Database Overview</h2>
                            <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-1.5">
                                <Circle size={8} className="fill-emerald-400 animate-pulse" /> Live
                            </span>
                        </div>

                        {/* Top Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-gray-950/50 border border-gray-800/60 rounded-2xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total Tables</span>
                                <span className="text-3xl font-mono text-white">{tables}</span>
                            </div>
                            <div className="bg-gray-950/50 border border-gray-800/60 rounded-2xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total Rows</span>
                                <span className="text-3xl font-mono text-emerald-400">{rows.toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-950/50 border border-gray-800/60 rounded-2xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Active Engine</span>
                                <span className="text-xl font-mono text-indigo-300 mt-2">{engine}</span>
                            </div>
                        </div>

                        {/* Recent Tables Feed */}
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-400 mb-4 px-1">Recently Modified Tables</h3>
                            <div className="flex flex-col gap-2">
                                {tablesData.slice(0, 4).map((table, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/40 border border-transparent hover:border-gray-700/50 transition-all cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                                                <TableProperties size={14} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-mono text-gray-200">{table.name}</span>
                                                {/* <span className="text-[10px] text-gray-500">Updated {table.activity}</span> */}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-right">
                                            <div className="hidden sm:flex flex-col items-end">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Columns</span>
                                                <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5"><Hash size={10} /> {table.columns}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Rows</span>
                                                <span className="text-xs font-mono text-gray-300 flex items-center gap-1.5"><Rows3 size={10} /> {table.rows.toLocaleString()}</span>
                                            </div>
                                            <button
                                                onClick={() => setSelected?.("Database")}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                                                title="View Table"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}