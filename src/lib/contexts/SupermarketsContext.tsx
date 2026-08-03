"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "./AuthContext";

export const DEFAULT_SUPERMARKETS = ["Tesco", "Asda", "Sainsburys", "Lidl", "Aldi", "Co-Op", "Waitrose"];

interface SupermarketsContextType {
  supermarkets: string[];
  setSupermarkets: (supermarkets: string[]) => Promise<void>;
  loading: boolean;
}

const SupermarketsContext = createContext<SupermarketsContextType | undefined>(undefined);

export function SupermarketsProvider({ children }: { children: ReactNode }) {
  const { householdId } = useAuth();
  const [supermarkets, setSupermarketsState] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupermarkets() {
      if (!householdId) {
        setSupermarketsState([]);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "households", householdId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.supermarkets && Array.isArray(data.supermarkets)) {
            setSupermarketsState(data.supermarkets);
            setLoading(false);
            return;
          }
        }

        // If no supermarkets exist, seed with defaults
        await setDoc(docRef, { supermarkets: DEFAULT_SUPERMARKETS }, { merge: true });
        setSupermarketsState(DEFAULT_SUPERMARKETS);
      } catch (err) {
        console.error("Failed to load supermarkets", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSupermarkets();
  }, [householdId]);

  const setSupermarkets = async (newSupermarkets: string[]) => {
    if (!householdId) return;
    // Optimistic update
    setSupermarketsState(newSupermarkets);
    try {
      await setDoc(doc(db, "households", householdId), { supermarkets: newSupermarkets }, { merge: true });
    } catch (err) {
      console.error("Failed to update supermarkets", err);
    }
  };

  return (
    <SupermarketsContext.Provider value={{ supermarkets, setSupermarkets, loading }}>
      {children}
    </SupermarketsContext.Provider>
  );
}

export function useSupermarkets() {
  const context = useContext(SupermarketsContext);
  if (context === undefined) {
    throw new Error("useSupermarkets must be used within a SupermarketsProvider");
  }
  return context;
}
