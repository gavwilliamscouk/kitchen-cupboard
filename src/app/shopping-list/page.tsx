"use client";

import { useInventory, InventoryItem } from "@/lib/hooks/useInventory";
import { CheckCircle2, Circle, Trash2, ChevronDown, Plus } from "lucide-react";
import AddItemModal from "@/components/AddItemModal";
import { useState, useEffect } from "react";
import { CategoryIcon } from "@/lib/constants/categories";
import { useCategories } from "@/lib/contexts/CategoriesContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

function formatCategoryTitle(str: string): string {
  if (!str) return "Uncategorised";
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStoreName(str: string): string {
  if (!str) return "";
  const norm = str.trim();
  if (norm.toLowerCase() === "co-op" || norm.toLowerCase() === "coop") return "Co-Op";
  return norm.charAt(0).toUpperCase() + norm.slice(1).toLowerCase();
}

function getCategoryStoreIndex(category: string, storeName: string, supermarketRoutes: Record<string, string[]>): number {
  const storeRoute = supermarketRoutes[storeName];
  if (storeRoute && Array.isArray(storeRoute)) {
    const normCat = category.toLowerCase().trim();
    const idx = storeRoute.findIndex(c => c.toLowerCase().trim() === normCat);
    if (idx !== -1) return idx;
  }
  return getCategoryIndex(category);
}

export default function ShoppingListScreen() {
  const { householdId } = useAuth();
  const { items, loading: inventoryLoading, updateItem, addItem } = useInventory();
  const { getCategoryIndex, loading: categoriesLoading } = useCategories();
  const loading = inventoryLoading || categoriesLoading;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sortBySupermarket, setSortBySupermarket] = useState(false);
  const [activeSupermarketFilter, setActiveSupermarketFilter] = useState("All");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [supermarketRoutes, setSupermarketRoutes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!householdId) return;
    const docRef = doc(db, "households", householdId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.supermarketRoutes && typeof data.supermarketRoutes === "object") {
          setSupermarketRoutes(data.supermarketRoutes);
        }
      }
    });
    return () => unsubscribe();
  }, [householdId]);

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const shoppingListItems = items.filter(item => item.inShoppingList);
  const selectedItems = shoppingListItems.filter(item => item.isChecked);
  
  const supermarkets = Array.from(new Set(shoppingListItems.map(item => item.preferredSupermarket))).filter(Boolean);

  const displayedItems = sortBySupermarket && activeSupermarketFilter !== "All"
    ? shoppingListItems.filter(item => item.preferredSupermarket === activeSupermarketFilter)
    : shoppingListItems;

  const handleClearSelected = async () => {
    await Promise.all(
      selectedItems.map(item => updateItem(item.id, { inShoppingList: false, isChecked: false }))
    );
  };

  // Grouping logic:
  // When sortBySupermarket is false: Record<categoryName, InventoryItem[]>
  // When sortBySupermarket is true: Record<supermarketName, Record<categoryName, InventoryItem[]>>
  let supermarketGroupedData: Record<string, Record<string, InventoryItem[]>> = {};
  let categoryGroupedData: Record<string, InventoryItem[]> = {};

  if (sortBySupermarket) {
    supermarketGroupedData = displayedItems.reduce((acc, item) => {
      const store = item.preferredSupermarket || "Any";
      const cat = item.category || "Uncategorised";
      if (!acc[store]) acc[store] = {};
      if (!acc[store][cat]) acc[store][cat] = [];
      acc[store][cat].push(item);
      return acc;
    }, {} as Record<string, Record<string, InventoryItem[]>>);
  } else {
    categoryGroupedData = displayedItems.reduce((acc, item) => {
      const cat = item.category || "Uncategorised";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);
  }

  const renderListItem = (item: InventoryItem, showStoreBadge: boolean) => {
    const isChecked = !!item.isChecked;
    return (
      <li 
        key={item.id} 
        className={`pl-2 pr-4 py-1.5 flex items-center justify-between hover:bg-slate-800/40 rounded-lg transition-all cursor-pointer bg-transparent ${
          isChecked ? "opacity-65" : "opacity-100"
        }`}
        onClick={(e) => {
          // If clicking on the item text, open edit modal
          // For now just toggle check like before if they click the li, but actually let's allow editing
          // To keep it simple, we can make clicking the text edit, and clicking check toggle check.
          // But since the whole `li` has an onClick for checking, let's keep it for checking.
          updateItem(item.id, { isChecked: !isChecked });
        }}
      >
        <div className="flex items-center gap-3.5">
          <button className="text-slate-400 hover:text-yellow-400 transition-colors">
            {isChecked ? (
              <CheckCircle2 size={22} className="text-yellow-400 fill-yellow-500/20" />
            ) : (
              <Circle size={22} strokeWidth={1.5} />
            )}
          </button>
          <div>
            <p className={`text-sm flex items-baseline gap-1.5 ${
              isChecked ? "line-through text-slate-300/90 font-normal" : "text-slate-100 font-semibold"
            }`}>
              <span>{item.name}</span>
              {item.subInfo && (
                <span className={`font-normal text-sm ${isChecked ? "text-slate-400/80 line-through" : "text-slate-300/90"}`}>
                  {item.subInfo}
                </span>
              )}
              {item.volumeQuantity && (
                <span className={`text-[13px] font-normal ${isChecked ? "line-through text-slate-400/80" : "text-slate-400"}`}>
                  {item.volumeQuantity}
                </span>
              )}
            </p>
          </div>
        </div>
        {showStoreBadge && (
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md ${
            isChecked ? "text-slate-400 bg-slate-800/60 border border-slate-700/40" : "text-slate-400 bg-slate-800 border border-slate-700/60"
          }`}>
            {item.preferredSupermarket}
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex flex-col space-y-4">
        {/* Header Top Row */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-100">Shopping List</h2>
            <p className="text-sm text-slate-400 mt-2.5">
              {shoppingListItems.length} {shoppingListItems.length === 1 ? "item" : "items"} • {shoppingListItems.length - selectedItems.length} remaining
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <button
                onClick={handleClearSelected}
                className="btn bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Trash2 size={16} />
                <span>Clear Selected</span>
              </button>
            )}
            <button 
              className="btn bg-transparent hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 border border-yellow-500/80 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0" 
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Sort by Supermarket on the left below title & subtitle */}
        {shoppingListItems.length > 0 && (
          <div className="flex justify-start pt-1">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-200 px-3.5 py-2 rounded-xl shadow-sm border border-slate-700/60 cursor-pointer transition-colors hover:bg-slate-700/80">
              <input 
                type="checkbox" 
                checked={sortBySupermarket}
                onChange={(e) => setSortBySupermarket(e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
              Sort by Supermarket
            </label>
          </div>
        )}
      </div>

      {sortBySupermarket && supermarkets.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          <button
            onClick={() => setActiveSupermarketFilter("All")}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all shadow-sm ${
              activeSupermarketFilter === "All" 
                ? "bg-yellow-500 text-slate-950 font-semibold shadow-md shadow-yellow-500/20" 
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50"
            }`}
          >
            All Stores
          </button>
          {supermarkets.map(store => (
            <button
              key={store}
              onClick={() => setActiveSupermarketFilter(store)}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all shadow-sm ${
                activeSupermarketFilter === store 
                  ? "bg-yellow-500 text-slate-950 font-semibold shadow-md shadow-yellow-500/20" 
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50"
              }`}
            >
              {store}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : shoppingListItems.length === 0 ? (
        <div className="glass-panel p-12 text-center min-h-[300px] flex flex-col justify-center items-center">
          <p className="text-slate-300 mb-2 text-lg font-medium">Your shopping list is empty.</p>
          <p className="text-sm text-slate-400">Add items from your cupboard to see them here.</p>
        </div>
      ) : !sortBySupermarket ? (
        /* Standard View: Grouped by Category */
        <div className="space-y-4 pb-20">
          {Object.entries(categoryGroupedData)
            .sort(([catA], [catB]) => getCategoryIndex(catA) - getCategoryIndex(catB))
            .map(([category, categoryItems]) => {
            const isCollapsed = !!collapsedGroups[category];

            return (
              <div key={category} className="space-y-1">
                <div className="-mx-4 sm:-mx-8">
                  <button
                    type="button"
                    onClick={() => toggleGroup(category)}
                    className="w-full bg-slate-800/80 hover:bg-slate-700/80 px-4 sm:px-8 py-2.5 border-y border-slate-700/60 flex justify-between items-center text-left transition-colors group cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon category={category} size={16} />
                      <h3 className="font-medium text-base tracking-tight text-slate-100">
                        {formatCategoryTitle(category)}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-md">
                        {categoryItems.length}
                      </span>
                      <ChevronDown 
                        size={18} 
                        className={`text-slate-400 group-hover:text-yellow-400 transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90 text-slate-500" : "rotate-0"
                        }`} 
                      />
                    </div>
                  </button>
                </div>

                {!isCollapsed && (
                  <ul className="py-1 space-y-0.5">
                    {categoryItems.map((item) => renderListItem(item, true))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Supermarket View: Grouped by Supermarket -> Category */
        <div className="space-y-6 pb-20">
          {Object.entries(supermarketGroupedData)
            .sort(([storeA], [storeB]) => storeA.localeCompare(storeB))
            .map(([storeName, categoriesMap]) => {
              const totalStoreItems = Object.values(categoriesMap).reduce((sum, list) => sum + list.length, 0);
              const isStoreCollapsed = !!collapsedGroups[storeName];

              return (
                <div key={storeName} className="space-y-0">
                  {/* Supermarket Main Title Header Accordion Button */}
                  <div className="-mx-4 sm:-mx-8">
                    <button
                      type="button"
                      onClick={() => toggleGroup(storeName)}
                      style={{ backgroundColor: "color-mix(in oklab, oklch(0.35 0.11 247.02) 90%, transparent)" }}
                      className="w-full px-4 sm:px-8 py-3 border-y border-slate-700/60 flex justify-between items-center text-left transition-colors group cursor-pointer focus:outline-none"
                    >
                      <h3 className="text-lg sm:text-xl font-normal tracking-wide text-slate-100">
                        {formatStoreName(storeName)}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-300 bg-slate-900/60 px-2.5 py-0.5 rounded-md border border-slate-700/60">
                          {totalStoreItems} {totalStoreItems === 1 ? "item" : "items"}
                        </span>
                        <ChevronDown 
                          size={18} 
                          className={`text-slate-300 group-hover:text-yellow-400 transition-transform duration-200 ${
                            isStoreCollapsed ? "-rotate-90 text-slate-400" : "rotate-0"
                          }`} 
                        />
                      </div>
                    </button>
                  </div>

                  {/* Categories within this Supermarket */}
                  {!isStoreCollapsed && (
                    <div className="space-y-0">
                      {Object.entries(categoriesMap)
                        .sort(([catA], [catB]) => getCategoryStoreIndex(catA, storeName, supermarketRoutes) - getCategoryStoreIndex(catB, storeName, supermarketRoutes))
                        .map(([category, categoryItems]) => {
                          const collapseKey = `${storeName}-${category}`;
                          const isCollapsed = !!collapsedGroups[collapseKey];

                          return (
                            <div key={collapseKey} className="space-y-1">
                              <div className="-mx-4 sm:-mx-8">
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(collapseKey)}
                                  className="w-full bg-slate-800/60 hover:bg-slate-700/60 px-4 sm:px-8 py-2.5 border-y border-slate-700/40 flex justify-between items-center text-left transition-colors group cursor-pointer focus:outline-none"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <CategoryIcon category={category} size={16} />
                                    <h4 className="font-medium text-sm tracking-tight text-slate-200">
                                      {formatCategoryTitle(category)}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-slate-400 bg-slate-700/40 px-2 py-0.5 rounded-md">
                                      {categoryItems.length}
                                    </span>
                                    <ChevronDown 
                                      size={16} 
                                      className={`text-slate-400 group-hover:text-yellow-400 transition-transform duration-200 ${
                                        isCollapsed ? "-rotate-90 text-slate-500" : "rotate-0"
                                      }`} 
                                    />
                                  </div>
                                </button>
                              </div>

                              {!isCollapsed && (
                                <ul className="py-1 space-y-0.5">
                                  {categoryItems.map((item) => renderListItem(item, false))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }} 
        onAdd={addItem} 
        itemToEdit={editingItem}
        onUpdate={updateItem}
        defaultInShoppingList={true}
      />
    </div>
  );
}
