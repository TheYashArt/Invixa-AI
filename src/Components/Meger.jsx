import Header from "./Header";
import { useState } from "react";
import Profilemodel from "./Models/ProfileModel";
import HomePage from "./HomePage";
import Database from "./Database";
import Chat from "./Chat";
import Account from "./Account";
export default function Merger() {
    const states = ["Home", "Database", "Analytics", "Settings"]
    const [selected, setSelected] = useState("Home")
    const [profile, setProfile] = useState(false)

<<<<<<< Updated upstream
=======
    // Restore session from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("invixa_user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem("invixa_user");
            }
        }
        setAuthChecked(true);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem("invixa_user", JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("invixa_user");
        setSelected("Home");
        // Fire-and-forget logout call
        fetch("https://invixa-ai.onrender.com/app/auth/logout", { method: "POST" }).catch(() => {});
    };

    // Wait until we've checked localStorage before rendering
    if (!authChecked) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-gray-950">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Not logged in → show auth page
    if (!user) {
        return <AuthPage onLogin={handleLogin} />;
    }

    // Logged in → show main app
>>>>>>> Stashed changes
    return (
        <div className="flex flex-col h-screen w-screen bg-gray-950 overflow-hidden">
            <div className="shrink-0 z-50 relative">
                <Header selected={selected} setSelected={setSelected} profile={profile} setProfile={setProfile} />
            </div>
            {profile && <Profilemodel profile={profile} setProfile={setProfile} />}

            <div className="flex-1 min-h-0 relative overflow-y-auto">
                {selected === "Home" && <HomePage setSelected={setSelected} /> }
                {selected === "Database" && <Database/> }
                {selected === "Analytics" && <Chat/> }
                {selected === "Settings" && <Account/> }
            </div>
        </div>
    )
}