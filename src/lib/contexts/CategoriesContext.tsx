"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "./AuthContext";
import { DEPARTMENTS, CATEGORY_EMOJIS } from "../constants/categories";

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface CategoriesContextType {
  categories: Category[];
  setCategories: (categories: Category[]) => Promise<void>;
  loading: boolean;
  getCategoryEmoji: (name: string) => string;
  getCategoryIndex: (name: string) => number;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { householdId } = useAuth();
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      if (!householdId) {
        setCategoriesState([]);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "households", householdId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.categories && Array.isArray(data.categories)) {
            setCategoriesState(data.categories);
            setLoading(false);
            return;
          }
        }

        // If no categories exist, seed with defaults
        const defaultCategories = DEPARTMENTS.map(dept => ({
          id: dept.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: dept,
          emoji: CATEGORY_EMOJIS[dept] || "🏷️"
        }));

        await setDoc(docRef, { categories: defaultCategories }, { merge: true });
        setCategoriesState(defaultCategories);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [householdId]);

  const setCategories = async (newCategories: Category[]) => {
    if (!householdId) return;
    // Optimistic update
    setCategoriesState(newCategories);
    try {
      await setDoc(doc(db, "households", householdId), { categories: newCategories }, { merge: true });
    } catch (err) {
      console.error("Failed to update categories", err);
      // We could revert state here if needed
    }
  };

  const getCategoryEmoji = (categoryName: string): string => {
    if (!categoryName) return "🏷️";
    const cat = categories.find(c => c.name.toLowerCase() === categoryName.trim().toLowerCase());
    return cat ? cat.emoji : "🏷️";
  };

  const getCategoryIndex = (categoryName: string): number => {
    if (!categoryName) return 999;
    const index = categories.findIndex(c => c.name.toLowerCase() === categoryName.trim().toLowerCase());
    return index === -1 ? 999 : index;
  };

  return (
    <CategoriesContext.Provider value={{ categories, setCategories, loading, getCategoryEmoji, getCategoryIndex }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
}
