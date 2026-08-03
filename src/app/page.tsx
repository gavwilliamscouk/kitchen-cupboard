"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Search, ShoppingCart, Trash2, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { useInventory, InventoryItem } from "@/lib/hooks/useInventory";
import AddItemModal from "@/components/AddItemModal";
import { CategoryIcon } from "@/lib/constants/categories";
import { useCategories } from "@/lib/contexts/CategoriesContext";

function formatCategoryTitle(str: string): string {
  if (!str) return "Uncategorised";
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function InventoryScreen() {
  const { items, loading: inventoryLoading, isSeeding, addItem, updateItem, toggleShoppingList, deleteItem, seedAllCategories } = useInventory();
  const { getCategoryIndex, loading: categoriesLoading } = useCategories();
  const loading = inventoryLoading || categoriesLoading;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("category");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [deletedItem, setDeletedItem] = useState<InventoryItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDeleteItem = async (item: InventoryItem) => {
    setDeletedItem(item);
    setShowToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 5000);

    await deleteItem(item.id);
  };

  const handleUndoDelete = async () => {
    if (!deletedItem) return;
    const { id, ...itemToRestore } = deletedItem;
    await addItem(itemToRestore);
    setShowToast(false);
    setDeletedItem(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "alpha") return a.name.localeCompare(b.name);
      if (sortBy === "frequent") {
        const timeA = a.lastAddedToShoppingList || 0;
        const timeB = b.lastAddedToShoppingList || 0;
        if (timeA !== timeB) return timeB - timeA;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "category") {
        const idxA = getCategoryIndex(a.category);
        const idxB = getCategoryIndex(b.category);
        if (idxA !== idxB) return idxA - idxB;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  // Group items by Category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const categoryKey = item.category || "Uncategorised";
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Cupboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">{items.length} total items stored</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="btn bg-transparent hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 border border-yellow-500/80 rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-sm flex items-center gap-2" 
            onClick={handleOpenAddModal}
          >
            <Plus size={18} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-center w-full">
        <div className="relative flex-1 min-w-0">
          {!searchQuery && (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          )}
          <input 
            type="text" 
            className={`input py-2 rounded-xl shadow-sm text-sm w-full transition-all ${
              searchQuery ? "px-4" : "pl-11 pr-4"
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <select 
            className="input w-full rounded-xl shadow-sm text-xs sm:text-sm py-2 pl-3.5 pr-8 sm:pr-10 cursor-pointer truncate"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="category">Category Order</option>
            <option value="alpha">A - Z</option>
            <option value="frequent">Recent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel flex-1 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-slate-400 mb-6 text-lg">Your cupboard is currently empty.</p>
          <div>
            <button 
              onClick={handleOpenAddModal} 
              className="btn bg-transparent hover:bg-yellow-500/10 text-yellow-400 border border-yellow-500/80 rounded-xl px-5 py-2.5 font-semibold transition-all"
            >
              Add your first item
            </button>
          </div>
        </div>
      ) : sortBy !== "category" ? (
        /* Flat List View (A - Z or Recent) without Category Separation */
        <div className="pb-24">
          <ul className="space-y-0.5">
            {filteredItems.map((item) => (
              <li 
                key={item.id} 
                onClick={() => handleEditItem(item)}
                className="px-4 py-1.5 flex items-center justify-between hover:bg-slate-800/40 rounded-lg transition-colors bg-transparent cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <CategoryIcon category={item.category} size={16} />
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="font-semibold text-sm text-slate-100 group-hover:text-yellow-400 transition-colors">
                      {item.name}
                    </span>
                    {item.subInfo && (
                      <span className="font-normal text-sm text-slate-300/90 shrink-0">
                        {item.subInfo}
                      </span>
                    )}
                    {item.volumeQuantity && (
                      <span className="text-[13px] text-slate-400 shrink-0">
                        {item.volumeQuantity}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md shrink-0 hidden sm:inline-block">
                    {item.category}
                  </span>
                  {item.preferredSupermarket && item.preferredSupermarket !== "Any" && (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md shrink-0">
                      {item.preferredSupermarket}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleShoppingList(item.id, item.inShoppingList);
                    }}
                    className={`p-1.5 rounded-md transition-colors ${
                      item.inShoppingList 
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                        : "text-slate-400 hover:text-yellow-400 hover:bg-slate-800"
                    }`}
                    title={item.inShoppingList ? "On Shopping List" : "Add to Shopping List"}
                  >
                    <ShoppingCart size={17.5} />
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item);
                    }} 
                    className="p-1.5 rounded-md text-slate-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Grouped Category View (Category Order) */
        <div className="space-y-4 pb-24">
          {Object.entries(groupedItems)
            .sort(([catA], [catB]) => getCategoryIndex(catA) - getCategoryIndex(catB))
            .map(([category, categoryItems]) => {
            const isCollapsed = !!collapsedCategories[category];

            return (
              <div key={category} className="space-y-1">
                <div className="-mx-4 sm:-mx-8">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
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

                {/* Accordion Content without table lines */}
                {!isCollapsed && (
                  <ul className="py-1 space-y-0.5">
                    {categoryItems.map((item) => (
                      <li 
                        key={item.id} 
                        onClick={() => handleEditItem(item)}
                        className="px-4 py-1.5 flex items-center justify-between hover:bg-slate-800/40 rounded-lg transition-colors bg-transparent cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <div className="flex items-baseline gap-1.5 truncate">
                            <span className="font-semibold text-sm text-slate-100 group-hover:text-yellow-400 transition-colors">
                              {item.name}
                            </span>
                            {item.subInfo && (
                              <span className="font-normal text-sm text-slate-300/90 shrink-0">
                                {item.subInfo}
                              </span>
                            )}
                            {item.volumeQuantity && (
                              <span className="text-[13px] text-slate-400 shrink-0">
                                {item.volumeQuantity}
                              </span>
                            )}
                          </div>
                          {item.preferredSupermarket && item.preferredSupermarket !== "Any" && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md shrink-0">
                              {item.preferredSupermarket}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShoppingList(item.id, item.inShoppingList);
                            }}
                            className={`p-1.5 rounded-md transition-colors ${
                              item.inShoppingList 
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                                : "text-slate-400 hover:text-yellow-400 hover:bg-slate-800"
                            }`}
                            title={item.inShoppingList ? "On Shopping List" : "Add to Shopping List"}
                          >
                            <ShoppingCart size={17.5} />
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item);
                            }} 
                            className="p-1.5 rounded-md text-slate-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
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
      />

      {/* Product Deleted Toast Popup */}
      {showToast && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-800/95 border border-slate-700/80 text-slate-100 px-6 py-4 rounded-2xl shadow-xl shadow-black/50 flex items-center gap-3 text-base font-medium backdrop-blur-md">
            <span>Product Deleted</span>
            <span className="text-slate-500 font-normal">-</span>
            <button 
              onClick={handleUndoDelete}
              className="text-yellow-400 hover:text-yellow-300 underline underline-offset-2 font-semibold transition-colors focus:outline-none cursor-pointer"
            >
              undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
