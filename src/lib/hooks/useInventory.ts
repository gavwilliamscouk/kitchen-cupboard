import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { DEPARTMENTS, DUMMY_PRODUCTS_BY_CATEGORY } from "../constants/categories";

export interface InventoryItem {
  id: string;
  name: string;
  subInfo?: string;
  category: string;
  volumeQuantity: string;
  preferredSupermarket: string;
  inShoppingList: boolean;
  isChecked?: boolean;
  lastUsedDate: number;
  lastAddedToShoppingList?: number;
}

export function useInventory() {
  const { householdId } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "items"),
      where("householdId", "==", householdId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(inventoryData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [householdId]);

  const addItem = async (item: Omit<InventoryItem, "id">) => {
    if (!householdId) return;
    const now = Date.now();
    await addDoc(collection(db, "items"), {
      ...item,
      householdId,
      isChecked: false,
      ...(item.inShoppingList ? { lastAddedToShoppingList: now } : {}),
    });
  };

  const updateItem = async (id: string, data: Partial<InventoryItem>) => {
    const itemRef = doc(db, "items", id);
    await updateDoc(itemRef, data);
  };

  const deleteItem = async (id: string) => {
    const itemRef = doc(db, "items", id);
    await deleteDoc(itemRef);
  };

  const toggleShoppingList = async (id: string, currentState: boolean) => {
    const nextState = !currentState;
    const updateData: Partial<InventoryItem> = { inShoppingList: nextState, isChecked: false };
    if (nextState) {
      updateData.lastAddedToShoppingList = Date.now();
    }
    await updateItem(id, updateData);
  };

  const seedAllCategories = async () => {
    if (!householdId || isSeeding) return;
    setIsSeeding(true);
    try {
      const existingCategories = new Set(items.map((i) => i.category.trim().toLowerCase()));

      for (const dept of DEPARTMENTS) {
        if (!existingCategories.has(dept.toLowerCase())) {
          const dummy = DUMMY_PRODUCTS_BY_CATEGORY[dept] || {
            name: `${dept} Item`,
            volumeQuantity: "1 pack",
            preferredSupermarket: "Any",
          };
          await addDoc(collection(db, "items"), {
            name: dummy.name,
            subInfo: dummy.subInfo || "",
            category: dept,
            volumeQuantity: dummy.volumeQuantity,
            preferredSupermarket: dummy.preferredSupermarket,
            inShoppingList: false,
            lastUsedDate: Date.now(),
            householdId,
          });
        }
      }
    } catch (err) {
      console.error("Error seeding categories:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  return { items, loading, isSeeding, addItem, updateItem, deleteItem, toggleShoppingList, seedAllCategories };
}

