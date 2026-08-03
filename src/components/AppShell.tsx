"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import AuthScreen from "./AuthScreen";
import NavBar from "./NavBar";
import { CategoriesProvider } from "@/lib/contexts/CategoriesContext";
import { SupermarketsProvider } from "@/lib/contexts/SupermarketsContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, householdId, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user || !householdId) {
    return <AuthScreen />;
  }

  return (
    <SupermarketsProvider>
      <CategoriesProvider>
        <div className="flex flex-col h-full min-h-screen">
          {/* Desktop Header */}
          <header className="hidden sm:flex justify-between items-center py-6 px-8 bg-transparent">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">KitchenCupboard</h1>
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-slate-400">
                Household ID: {householdId.slice(0, 8)}...
              </span>
              <button onClick={logout} className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors">
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-8 pt-8 sm:pt-4 pb-32">
          {children}
        </main>
          
          <NavBar />
        </div>
      </CategoriesProvider>
    </SupermarketsProvider>
  );
}
