import { useState, useRef, useEffect } from "react";
import { X, Loader2, ChevronDown, Check } from "lucide-react";
import { InventoryItem } from "@/lib/hooks/useInventory";
import { useCategories } from "@/lib/contexts/CategoriesContext";
import { useSupermarkets } from "@/lib/contexts/SupermarketsContext";


function capitalizeWords(str: string): string {
  if (!str) return str;
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => Promise<void>;
  itemToEdit?: any;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  defaultInShoppingList?: boolean;
}

export default function AddItemModal({ isOpen, onClose, onAdd, itemToEdit, onUpdate, defaultInShoppingList = false }: AddItemModalProps) {
  const [name, setName] = useState("");
  const [subInfo, setSubInfo] = useState("");
  const [category, setCategory] = useState("");
  const [volumeQuantity, setVolumeQuantity] = useState("");
  const [preferredSupermarket, setPreferredSupermarket] = useState("Any");
  const { categories, getCategoryEmoji } = useCategories();
  const { supermarkets } = useSupermarkets();
  const [inShoppingList, setInShoppingList] = useState(defaultInShoppingList);
  
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || "");
      setSubInfo(itemToEdit.subInfo || "");
      setCategory(itemToEdit.category === "Uncategorised" ? "" : (itemToEdit.category || ""));
      setVolumeQuantity(itemToEdit.volumeQuantity || "");
      setPreferredSupermarket(itemToEdit.preferredSupermarket || "Any");
    } else {
      setName("");
      setSubInfo("");
      setCategory("");
      setVolumeQuantity("");
      setPreferredSupermarket("Any");
      setInShoppingList(defaultInShoppingList);
    }
  }, [itemToEdit, isOpen, defaultInShoppingList]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredDepartments = categories.map(c => c.name).filter(dept => 
    dept.toLowerCase().includes(category.toLowerCase())
  );

  const handleNameBlur = async () => {
    if (!name.trim() || category !== "" || itemToEdit) return;
    
    setIsCategorizing(true);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: name, validCategories: categories.map(c => c.name) }),
      });
      if (res.ok) {
        const data = await res.json();
        const returnedCategory = capitalizeWords(data.category);
        setCategory(returnedCategory === "Uncategorised" ? "" : returnedCategory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);

    if (itemToEdit && onUpdate) {
      await onUpdate(itemToEdit.id, {
        name: capitalizeWords(name.trim()),
        subInfo: capitalizeWords(subInfo.trim()),
        category: capitalizeWords(category.trim()) || "Uncategorised",
        volumeQuantity: volumeQuantity.trim(),
        preferredSupermarket: capitalizeWords(preferredSupermarket.trim()) || "Any",
      });
    } else {
      await onAdd({
        name: capitalizeWords(name.trim()),
        subInfo: capitalizeWords(subInfo.trim()),
        category: capitalizeWords(category.trim()) || "Uncategorised",
        volumeQuantity: volumeQuantity.trim(),
        preferredSupermarket: capitalizeWords(preferredSupermarket.trim()) || "Any",
        inShoppingList: inShoppingList,
        lastUsedDate: Date.now(),
      });
    }
    
    setIsSubmitting(false);
    setName("");
    setSubInfo("");
    setCategory("");
    setVolumeQuantity("");
    setPreferredSupermarket("Any");
    setInShoppingList(defaultInShoppingList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-md p-6 border border-slate-700/60 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            {itemToEdit ? "Edit Product" : "Add to Cupboard"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Product</label>
            <input 
              type="text" 
              required
              autoCapitalize="words"
              className="input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g. Eggs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Sub-Info</label>
            <input 
              type="text" 
              autoCapitalize="words"
              className="input" 
              value={subInfo}
              onChange={(e) => setSubInfo(e.target.value)}
              placeholder="e.g. Organic"
            />
          </div>
          
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-1">Category / Department</label>
            <div className="relative">
              <input 
                type="text" 
                autoCapitalize="words"
                className="input pr-10" 
                value={category}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Search or select category..."
              />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                {isCategorizing ? (
                  <div className="text-yellow-400 flex items-center gap-1 text-xs">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                ) : (
                  <ChevronDown size={18} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Custom Searchable Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto z-[110] bg-slate-800 rounded-xl shadow-xl border border-slate-700/80 py-1.5 scrollbar-thin">
                {filteredDepartments.length === 0 ? (
                  <div className="px-4 py-2.5 text-sm text-slate-400 italic">
                    Use custom category: &quot;{category}&quot;
                  </div>
                ) : (
                  filteredDepartments.map((dept) => {
                    const isSelected = category.toLowerCase() === dept.toLowerCase();
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setCategory(dept);
                          setIsDropdownOpen(false);
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-yellow-500/20 text-yellow-400 font-semibold"
                            : "hover:bg-slate-700/60 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl" role="img" aria-label={dept}>
                            {getCategoryEmoji(dept)}
                          </span>
                          <span>{dept}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-yellow-400 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-1">Quantity/Volume</label>
              <input 
                type="text" 
                className="input" 
                value={volumeQuantity}
                onChange={(e) => setVolumeQuantity(e.target.value)}
                placeholder="e.g. 500g, 12 pack"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-1">Supermarket</label>
              <select 
                className="input cursor-pointer" 
                value={preferredSupermarket}
                onChange={(e) => setPreferredSupermarket(e.target.value)}
              >
                <option value="Any">Any</option>
                {supermarkets.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </div>
          </div>
          
          {!itemToEdit && (
            <div className="flex items-center gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => setInShoppingList(!inShoppingList)} 
                className={`w-11 h-6 rounded-full transition-colors relative ${inShoppingList ? 'bg-yellow-400' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 bottom-1 w-4 rounded-full bg-white transition-all ${inShoppingList ? 'left-6' : 'left-1'}`} />
              </button>
              <label className="text-sm font-medium text-slate-300 cursor-pointer" onClick={() => setInShoppingList(!inShoppingList)}>
                Also add to shopping list
              </label>
            </div>
          )}
          
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-3 mt-4">
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : itemToEdit ? (
              "Save Changes"
            ) : (
              "Save Item"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
