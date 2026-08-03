"use client";

import { useState } from "react";
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
import { GripVertical, Plus, X, Edit2, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";

const POPULAR_EMOJIS = [
  "🍎", "🍋", "🥕", "🌶️", "🥦", "🍄", "🥑", "🌿", "🍞", "🥐", 
  "🧀", "🥩", "🍗", "🍔", "🍕", "🌭", "🥪", "🌮", "🌯", "🥚", 
  "🍳", "🥗", "🍿", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", 
  "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🍡", "🥟", "🥠", "🥡",
  "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", 
  "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🍵", "🧃", "🥤",
  "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🧊", "🥢", "🍽️",
  "🐟", "🐙", "🦀", "🦞", "🦐", "🦑", "🔪", "🏺", "🥜", "🌰",
  "🫒", "🧂", "🧈", "🧄", "🧅", "🧇", "🥞", "🥣", "🧴", "🧼", 
  "🧽", "🧹", "🧺", "🧻", "🚽", "🐶", "🐱", "🐰", "❄️", "📦", 
  "👕", "👖", "🧦", "🛠️", "🚗", "👶", "💊", "🩹", "🩺", "🔋", 
  "💡", "🏷️"
];

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

export default function CategoriesSettingsScreen() {
  const { householdId } = useAuth();
  const { categories, setCategories, loading: categoriesLoading } = useCategories();
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    setIsEmojiPickerOpen(false);
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
      if (oldName !== newName && householdId) {
        const docRef = doc(db, "households", householdId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.supermarketRoutes && typeof data.supermarketRoutes === "object") {
            const newRoutes = { ...data.supermarketRoutes };
            for (const market in newRoutes) {
              if (newRoutes[market]) {
                 newRoutes[market] = newRoutes[market].map((n: string) => n === oldName ? newName : n);
              }
            }
            await setDoc(docRef, { supermarketRoutes: newRoutes }, { merge: true });
          }
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

  if (categoriesLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Manage Categories</h2>
      </div>

      <div className="glass-panel p-6 sm:p-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
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
            {/* Removed max-h and overflow-y-auto so the list extends fully */}
            <div className="w-full max-w-lg mx-auto space-y-2 rounded-xl">
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
              
              <div className="relative">
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Emoji Icon</label>
                <input 
                  type="text" 
                  value={catEmoji} 
                  onChange={(e) => setCatEmoji(e.target.value)}
                  onFocus={() => setIsEmojiPickerOpen(true)}
                  placeholder="e.g. 🎂" 
                  className="input w-full text-2xl py-2" 
                  maxLength={5}
                />
                
                {isEmojiPickerOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsEmojiPickerOpen(false)}
                    />
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700/80 rounded-xl shadow-2xl p-3 grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {POPULAR_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCatEmoji(emoji);
                            setIsEmojiPickerOpen(false);
                          }}
                          className="text-2xl p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
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
