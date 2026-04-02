import { House, ChartArea, User, Database, Sparkles, LogOut } from "lucide-react"
import { useState } from "react"

export default function Header({ selected, setSelected, profile, setProfile, user, onLogout }) {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const navItems = [
        { id: "Home", icon: House, label: "Home" },
        { id: "Database", icon: Database, label: "Database" },
        { id: "Analytics", icon: ChartArea, label: "Analytics" },
        { id: "Settings", icon: User, label: "Account" }
    ];

    return (
        <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80 text-white px-6 py-3 shadow-sm">
            <div className="flex justify-between items-center max-w-[1600px] mx-auto">
                
                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelected("Home")}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transform translate-y-[1px]">
                        Invixa
                    </span>
                </div>

                {/* Navigation Pills */}
                <nav className="flex items-center gap-2 p-1 bg-gray-900/60 border border-gray-800/80 rounded-full shadow-inner">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = selected === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSelected(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                    isActive 
                                    ? "bg-gray-800 text-indigo-400 shadow-md border border-gray-700/50" 
                                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent"
                                }`}
                            >
                                <Icon size={16} />
                                <span className={isActive ? "block" : "hidden sm:block"}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Avatar + Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-900/20 border-2 border-gray-950 hover:border-indigo-500/40 transition-all cursor-pointer"
                        title={user?.username || "User"}
                    >
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <>
                            {/* Invisible backdrop to close on click outside */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in">
                                {/* User info */}
                                <div className="px-4 py-4 border-b border-gray-800/60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                            {user?.username?.charAt(0)?.toUpperCase() || "U"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{user?.username || "User"}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-mono uppercase tracking-wider">
                                            {user?.role || "user"}
                                        </span>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div className="p-2">
                                    <button
                                        onClick={() => { setSelected("Settings"); setShowUserMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                    >
                                        <User size={16} className="text-gray-500" />
                                        Account Settings
                                    </button>
                                    <button
                                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
