"use client";

import { useAuth, HouseholdData } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { ArrowLeft, Users, Check, Plus, LogIn } from "lucide-react";
import { useState, useEffect } from "react";

function generateHouseholdCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function HouseholdSettingsScreen() {
  const { householdId, memberHouseholds, setHousehold, updateHouseholdName } = useAuth();
  
  const [householdNameInput, setHouseholdNameInput] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (householdId) {
      const current = memberHouseholds.find(h => h.id === householdId);
      if (current) {
        setHouseholdNameInput(current.name);
      }
    }
  }, [householdId, memberHouseholds]);

  const handleSaveName = async () => {
    if (!householdNameInput.trim()) return;
    setIsSaving(true);
    await updateHouseholdName(householdNameInput.trim());
    setIsSaving(false);
  };

  const handleCreateNew = async () => {
    const code = generateHouseholdCode();
    await setHousehold(code);
  };

  const handleJoin = async () => {
    if (!joinInput.trim()) return;
    await setHousehold(joinInput.trim());
    setJoinInput("");
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Household</h2>
      </div>

      {/* Current Household */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">Current Household</h3>
          <p className="text-sm text-slate-400 mb-4">Edit the name of your current household.</p>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={householdNameInput}
              onChange={(e) => setHouseholdNameInput(e.target.value)}
              className="input flex-1"
              placeholder="e.g. My Household"
            />
            <button 
              onClick={handleSaveName}
              disabled={isSaving || !householdNameInput.trim()}
              className="btn btn-primary px-5 rounded-xl whitespace-nowrap"
            >
              {isSaving ? "Saving..." : "Save Name"}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700/60">
          <h3 className="text-sm font-bold text-slate-300 mb-2">Invite Members</h3>
          <p className="text-sm text-slate-400 mb-4">
            Share this code with your family members so they can join your household.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 block p-3 bg-slate-900/80 border border-slate-700 rounded-xl font-mono text-sm text-yellow-400 overflow-x-auto whitespace-nowrap">
              {householdId}
            </code>
            <button 
              onClick={() => {
                if (householdId) {
                  navigator.clipboard.writeText(householdId);
                  alert("Household Code copied to clipboard!");
                }
              }}
              className="btn bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-xl whitespace-nowrap"
            >
              Copy Code
            </button>
          </div>
        </div>
      </div>

      {/* Switch Households */}
      <div className="glass-panel p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Your Households</h3>
        
        <div className="space-y-2 mb-8">
          {memberHouseholds.map(h => {
            const isActive = h.id === householdId;
            return (
              <div 
                key={h.id}
                onClick={() => !isActive && setHousehold(h.id)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isActive 
                    ? "bg-yellow-500/10 border-yellow-500/30 cursor-default" 
                    : "bg-slate-800/50 border-slate-700/60 hover:bg-slate-700/50 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700 text-slate-400"}`}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div className={`font-semibold ${isActive ? "text-yellow-400" : "text-slate-200"}`}>{h.name}</div>
                    <div className="text-xs font-mono text-slate-500">{h.id}</div>
                  </div>
                </div>
                {isActive && (
                  <div className="text-yellow-500 flex items-center gap-1 text-sm font-medium">
                    <Check size={16} /> Active
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add/Join */}
        <div className="pt-6 border-t border-slate-700/60 space-y-4">
          <h3 className="text-sm font-bold text-slate-300">Join or Create</h3>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Household Code" 
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              className="input flex-1"
            />
            <button 
              onClick={handleJoin}
              disabled={!joinInput.trim()}
              className="btn bg-slate-700 text-slate-200 hover:bg-slate-600 px-5 rounded-xl"
            >
              <LogIn size={18} className="mr-2" /> Join
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700/60"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-slate-500">or</span>
            <div className="flex-grow border-t border-slate-700/60"></div>
          </div>

          <button 
            onClick={handleCreateNew}
            className="btn bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 w-full py-3 rounded-xl"
          >
            <Plus size={18} className="mr-2" /> Create New Household
          </button>
        </div>
      </div>
    </div>
  );
}
