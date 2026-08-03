"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { List, Map, ChevronRight, Store } from "lucide-react";

export default function SettingsScreen() {
  const { householdId, logout } = useAuth();

  return (
    <div className="flex flex-col h-full space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Settings</h2>
      </div>

      <div className="space-y-4">
        <Link href="/settings/categories" className="glass-panel p-5 h-[88px] flex items-center justify-between group hover:bg-slate-800/80 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
              <List size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-yellow-400 transition-colors">Manage Categories</h3>
              <p className="text-sm text-slate-400">Add, edit, or reorder your global categories.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-500 group-hover:text-yellow-400 transition-colors" />
        </Link>

        <Link href="/settings/supermarkets" className="glass-panel p-5 h-[88px] flex items-center justify-between group hover:bg-slate-800/80 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
              <Store size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-yellow-400 transition-colors">Manage Supermarkets</h3>
              <p className="text-sm text-slate-400">Manage and reorder your list of supermarkets.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-500 group-hover:text-yellow-400 transition-colors" />
        </Link>

        <Link href="/settings/routes" className="glass-panel p-5 h-[88px] flex items-center justify-between group hover:bg-slate-800/80 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
              <Map size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-yellow-400 transition-colors">Supermarket Routes</h3>
              <p className="text-sm text-slate-400">Customise your walking route through departments.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-500 group-hover:text-yellow-400 transition-colors" />
        </Link>
      </div>

      {/* Household Sharing */}
      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold tracking-tight mb-2 text-slate-100">Household Sharing</h3>
        <p className="text-sm text-slate-400 mb-4">
          Share this code with your family members so they can join your household and sync recipes and shopping lists.
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
            className="btn btn-primary px-4 py-3 rounded-xl whitespace-nowrap"
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="flex justify-center pt-2">
        <button 
          onClick={() => logout()}
          className="text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium underline underline-offset-4"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
