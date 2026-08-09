import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

export type RecipeType = "Main" | "Light" | "Snack" | "Side" | "Dessert" | "Baking";

export const RECIPE_TYPE_ORDER: RecipeType[] = ["Main", "Light", "Snack", "Side", "Dessert", "Baking"];

export interface SavedRecipe {
  id: string;
  title: string;
  serves: string;
  type: RecipeType;
  ingredients: string[];
  method: string;
  sourceUrl: string;
  savedAt: number;
}

export function useRecipeCollection() {
  const { householdId } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setSavedRecipes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "recipes"),
      where("householdId", "==", householdId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: SavedRecipe[] = [];
      snapshot.forEach((d) => {
        data.push({ id: d.id, ...d.data() } as SavedRecipe);
      });
      // Sort by type order then alphabetically by title within each type
      data.sort((a, b) => {
        const typeSort = RECIPE_TYPE_ORDER.indexOf(a.type) - RECIPE_TYPE_ORDER.indexOf(b.type);
        if (typeSort !== 0) return typeSort;
        return a.title.localeCompare(b.title);
      });
      setSavedRecipes(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching recipes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [householdId]);

  const saveRecipe = async (recipe: Omit<SavedRecipe, "id" | "savedAt">) => {
    if (!householdId) return;
    await addDoc(collection(db, "recipes"), {
      ...recipe,
      householdId,
      savedAt: Date.now(),
    });
  };

  const updateRecipe = async (id: string, data: Partial<Omit<SavedRecipe, "id">>) => {
    if (!householdId) return;
    const docRef = doc(db, "recipes", id);
    await updateDoc(docRef, data);
  };

  const deleteRecipe = async (id: string) => {
    await deleteDoc(doc(db, "recipes", id));
  };

  return { savedRecipes, loading, saveRecipe, updateRecipe, deleteRecipe };
}
