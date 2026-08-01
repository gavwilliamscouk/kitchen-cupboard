"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCategories, Category } from "@/lib/contexts/CategoriesContext";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save, Loader2, RotateCcw, Store, Plus, X, Edit2, Trash2 } from "lucide-react";

const SUPERMARKETS = ["Tesco", "Asda", "Sainsburys", "Lidl", "Aldi", "Co-Op", "Waitrose"];

function SortableCategoryItem({ category, index, onClick }: { category: Category; index: number; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={onClick}
      className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-700/60 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 pointer-events-none">
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/50 text-xl border border-slate-700/50">
          {category.emoji}
        </span>
        <span className="font-medium text-[15px] text-slate-200">{category.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 size={16} />
        </div>
        <div 
          {...attributes} 
          {...listeners} 
          onClick={(e) => e.stopPropagation()} 
          className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <GripVertical size={18} />
        </div>
      </div>
    </div>
  );
}

function SortableRouteItem({ id, index }: { id: string; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold border border-yellow-500/30">
          {index + 1}
        </span>
        <span className="font-medium text-[15px] text-slate-200">{id}</span>
      </div>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
        <GripVertical size={18} />
      </div>
    </div>
  );
}

export default function SettingsScreen() {
  const { householdId } = useAuth();
  const { categories, setCategories, loading: categoriesLoading } = useCategories();
  
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>("Tesco");
  const [supermarketRoutes, setSupermarketRoutes] = useState<Record<string, string[]>>({});
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    async function loadSettings() {
      if (!householdId) return;
      const docRef = doc(db, "households", householdId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.supermarketRoutes && typeof data.supermarketRoutes === "object") {
          setSupermarketRoutes(data.supermarketRoutes);
        }
      }
      setIsLoadingRoutes(false);
    }
    loadSettings();
  }, [householdId]);

  const defaultRoute = categories.map(c => c.name);
  let currentRoute = supermarketRoutes[selectedSupermarket] || defaultRoute;
  
  // Ensure the route contains exactly the current valid categories
  currentRoute = currentRoute.filter(name => defaultRoute.includes(name));
  defaultRoute.forEach(name => {
    if (!currentRoute.includes(name)) currentRoute.push(name);
  });

  const handleRouteDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentRoute.indexOf(active.id as string);
      const newIndex = currentRoute.indexOf(over.id as string);
      const updatedList = arrayMove(currentRoute, oldIndex, newIndex);

      setSupermarketRoutes(prev => ({
        ...prev,
        [selectedSupermarket]: updatedList
      }));
    }
  };

  const handleResetRoute = () => {
    setSupermarketRoutes(prev => ({
      ...prev,
      [selectedSupermarket]: defaultRoute
    }));
  };

  const saveSupermarketRoute = async () => {
    if (!householdId) return;
    setIsSavingRoute(true);
    const docRef = doc(db, "households", householdId);
    await setDoc(docRef, { supermarketRoutes }, { merge: true });
    setIsSavingRoute(false);
  };

  // Categories Drag Handlers
  const handleCategoriesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      const updatedList = arrayMove(categories, oldIndex, newIndex);
      await setCategories(updatedList);
    }
  };

  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatEmoji(cat.emoji);
    } else {
      setEditingCategory(null);
      setCatName("");
      setCatEmoji("🏷️");
    }
    setIsCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    
    let updatedList = [...categories];
    if (editingCategory) {
      // Update existing
      updatedList = updatedList.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name: catName.trim(), emoji: catEmoji.trim() || "🏷️" } 
          : c
      );
      // We also need to update the supermarketRoutes so the name changes cascade
      const oldName = editingCategory.name;
      const newName = catName.trim();
      if (oldName !== newName) {
        const newRoutes = { ...supermarketRoutes };
        for (const market in newRoutes) {
          if (newRoutes[market]) {
             newRoutes[market] = newRoutes[market].map(n => n === oldName ? newName : n);
          }
        }
        setSupermarketRoutes(newRoutes);
        if (householdId) {
          await setDoc(doc(db, "households", householdId), { supermarketRoutes: newRoutes }, { merge: true });
        }
      }
    } else {
      // Add new
      const newId = catName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      updatedList.push({ id: newId, name: catName.trim(), emoji: catEmoji.trim() || "🏷️" });
    }
    await setCategories(updatedList);
    setIsCategoryModalOpen(false);
  };

  const deleteCategory = async () => {
    if (!editingCategory) return;
    const updatedList = categories.filter(c => c.id !== editingCategory.id);
    await setCategories(updatedList);
    setIsCategoryModalOpen(false);
  };

  if (categoriesLoading || isLoadingRoutes) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Settings</h2>
      </div>

      {/* Categories Management Panel */}
      <div className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-1 text-slate-100">Manage Categories</h3>
            <p className="text-sm text-slate-400">
              Add, edit, or drag to reorder your global categories.
            </p>
          </div>
          <button 
            onClick={() => openCategoryModal()} 
            className="btn btn-primary rounded-full px-5 py-2 text-sm self-end sm:self-auto"
          >
            <Plus size={16} />
            <span className="font-semibold">Add Category</span>
          </button>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoriesDragEnd}
        >
          <SortableContext 
            items={categories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="w-full max-w-lg mx-auto space-y-2 max-h-[400px] overflow-y-auto pr-2 rounded-xl">
              {categories.map((cat, index) => (
                <SortableCategoryItem 
                  key={cat.id} 
                  category={cat} 
                  index={index} 
                  onClick={() => openCategoryModal(cat)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Supermarket Selection Header */}
      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold tracking-tight mb-2 text-slate-100">Supermarket Routes</h3>
        <p className="text-sm text-slate-400 mb-6">
          Select a supermarket to customize your walking route through its departments.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {SUPERMARKETS.map((market) => {
            const isSelected = selectedSupermarket === market;
            return (
              <button
                key={market}
                onClick={() => setSelectedSupermarket(market)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border ${
                  isSelected
                    ? "bg-yellow-500 text-slate-950 font-bold border-yellow-500 shadow-md scale-[1.02] shadow-yellow-500/20"
                    : "bg-slate-800/80 text-slate-200 border-slate-700/60 hover:bg-slate-700/80"
                }`}
              >
                <Store size={22} className={`mb-1.5 ${isSelected ? "text-slate-950" : "text-yellow-400"}`} />
                <span className="font-semibold text-sm">{market}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Department Routing Editor */}
      <div className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-100">{selectedSupermarket}</span>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 font-medium px-2.5 py-1 rounded-full border border-yellow-500/30">
                {currentRoute.length} Departments
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Drag items to set the walking order for {selectedSupermarket}.
            </p>
          </div>

          <div className="flex gap-2 self-end sm:self-auto">
            <button
              onClick={handleResetRoute}
              className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60 rounded-full px-4 text-xs font-medium"
              title="Reset layout to default"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button 
              onClick={saveSupermarketRoute} 
              disabled={isSavingRoute}
              className="btn btn-primary rounded-full px-6 shadow-sm text-sm"
            >
              {isSavingRoute ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span className="font-semibold">Save {selectedSupermarket} Route</span>
            </button>
          </div>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRouteDragEnd}
        >
          <SortableContext 
            items={currentRoute}
            strategy={verticalListSortingStrategy}
          >
            <div className="w-full max-w-lg mx-auto space-y-2 max-h-[400px] overflow-y-auto pr-2 rounded-xl">
              {currentRoute.map((department, index) => (
                <SortableRouteItem key={department} id={department} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center px-4 pt-4 pb-28 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">{editingCategory ? "Edit Category" : "Add Category"}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Category Name</label>
                <input 
                  type="text" 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Baking" 
                  className="input w-full" 
                  autoFocus 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Emoji Icon</label>
                <input 
                  type="text" 
                  value={catEmoji} 
                  onChange={(e) => setCatEmoji(e.target.value)}
                  placeholder="e.g. 🎂" 
                  className="input w-full text-2xl py-2" 
                  maxLength={5}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {editingCategory ? (
                <button 
                  onClick={deleteCategory} 
                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 size={20} />
                </button>
              ) : <div></div>}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsCategoryModalOpen(false)} 
                  className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60 rounded-xl px-4 py-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveCategory}
                  disabled={!catName.trim()}
                  className="btn btn-primary rounded-xl px-6 py-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
