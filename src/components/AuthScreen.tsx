"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useState } from "react";
import { LogIn, Users } from "lucide-react";

export default function AuthScreen() {
  const { signInWithGoogle, user, setHousehold } = useAuth();
  const [householdInput, setHouseholdInput] = useState("");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">KitchenCupboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to manage your household food inventory and recipes.
          </p>
          <button onClick={signInWithGoogle} className="btn btn-primary w-full py-3 text-lg">
            <LogIn size={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center space-y-6">
        <h2 className="text-2xl font-bold">Welcome, {user.displayName}!</h2>
        <p className="text-gray-600 dark:text-gray-300">
          You are not currently part of a household. Create a new one or join an existing household.
        </p>
        
        <div className="space-y-4 pt-4">
          <button 
            onClick={() => setHousehold(crypto.randomUUID())} 
            className="btn btn-primary w-full py-3"
          >
            <Users size={20} />
            Create New Household
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Household ID" 
              className="input"
              value={householdInput}
              onChange={(e) => setHouseholdInput(e.target.value)}
            />
            <button 
              onClick={() => householdInput.trim() && setHousehold(householdInput.trim())}
              className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
