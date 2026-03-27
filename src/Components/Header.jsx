import { House, ChartArea, User, Database, Sparkles } from "lucide-react"

export default function Header({ selected, setSelected, profile, setProfile }) {
    
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
                <button 
                    className="w-10 h-10 rounded-full "
                >
                </button>
            </div>
        </header>
    );
}
