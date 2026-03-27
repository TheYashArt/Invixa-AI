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