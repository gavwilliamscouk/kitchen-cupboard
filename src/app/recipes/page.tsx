"use client";

import { useState } from "react";
import { Loader2, BookOpen, Circle, CheckCircle2, BookmarkPlus, ShoppingCart, X, ListPlus, ArrowLeft, Pencil, Plus } from "lucide-react";
import { useInventory } from "@/lib/hooks/useInventory";
import { useRecipeCollection, RECIPE_TYPE_ORDER } from "@/lib/hooks/useRecipeCollection";

// ── Save to Collection modal ─────────────────────────────────────────────────
function SaveRecipeModal({
  initialTitle,
  initialServes,
  onSave,
  onClose,
}: {
  initialTitle: string;
  initialServes: number;
  onSave: (title: string, serves: string, type: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [serves, setServes] = useState<number | string>(initialServes);
  const [type, setType] = useState("Main");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(title.trim(), String(serves).trim(), type);
    setSaving(false);
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center px-4 pt-4 pb-28 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 overflow-y-auto" style={{maxHeight: 'calc(100dvh - 8rem)'}}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-100">Save to Collection</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Recipe Name</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full rounded-xl" placeholder="Recipe name..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Servings</label>
            <input type="text" value={serves} onChange={(e) => setServes(e.target.value)} className="input w-full rounded-xl" placeholder="e.g. 4" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {RECIPE_TYPE_ORDER.map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    type === t ? "bg-yellow-500 text-slate-900 border-yellow-500 font-bold" : "bg-slate-800 text-slate-300 border-slate-700/60 hover:border-slate-500"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !title.trim()} className="btn btn-primary w-full py-3 rounded-xl">
          {saving ? <Loader2 className="animate-spin" size={18} /> : "Save Recipe"}
        </button>
      </div>
    </div>
  );
}

// ── Add Ingredients modal ────────────────────────────────────────────────────
function AddIngredientsModal({
  ingredients,
  onAddToCupboard,
  onAddToShoppingList,
  onClose,
}: {
  ingredients: string[];
  onAddToCupboard: (items: string[]) => Promise<void>;
  onAddToShoppingList: (items: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set(ingredients.map((_, i) => i)));
  const [loading, setLoading] = useState<"cupboard" | "list" | null>(null);

  const toggle = (i: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  const selectedIngredients = ingredients.filter((_, i) => selected.has(i));

  const handleCupboard = async () => {
    setLoading("cupboard");
    await onAddToCupboard(selectedIngredients);
    setLoading(null); onClose();
  };
  const handleList = async () => {
    setLoading("list");
    await onAddToShoppingList(selectedIngredients);
    setLoading(null); onClose();
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center px-4 pt-4 pb-28 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden" style={{maxHeight: 'calc(100dvh - 8rem)'}}>
        <div className="flex justify-between items-center p-6 pb-4 shrink-0">
          <h3 className="text-lg font-bold text-slate-100">Add Ingredients</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={20} /></button>
        </div>
        <ul className="overflow-y-auto px-6 space-y-1.5 flex-1">
          {ingredients.map((ing, i) => {
            const isSel = selected.has(i);
            return (
              <li key={i} onClick={() => toggle(i)} className="flex items-center gap-3 py-2 cursor-pointer group">
                <span className="shrink-0 text-slate-400 group-hover:text-yellow-400 transition-colors">
                  {isSel ? <CheckCircle2 size={22} className="text-yellow-400 fill-yellow-500/20" /> : <Circle size={22} strokeWidth={1.5} />}
                </span>
                <span className={`text-[15px] leading-snug ${isSel ? "text-slate-200" : "text-slate-400 line-through"}`}>{ing}</span>
              </li>
            );
          })}
        </ul>
        <div className="p-6 pt-4 flex gap-3 shrink-0 border-t border-slate-800 mt-2">
          <button onClick={handleCupboard} disabled={loading !== null || selectedIngredients.length === 0}
            className="btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex-1 py-3 rounded-xl border border-slate-700/60">
            {loading === "cupboard" ? <Loader2 className="animate-spin" size={18} /> : <BookmarkPlus size={18} />}
            Add to Cupboard
          </button>
          <button onClick={handleList} disabled={loading !== null || selectedIngredients.length === 0}
            className="btn btn-primary flex-1 py-3 rounded-xl">
            {loading === "list" ? <Loader2 className="animate-spin" size={18} /> : <ShoppingCart size={18} />}
            Add to List
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Recipe modal ────────────────────────────────────────────────────────
function EditRecipeModal({
  recipe,
  onSave,
  onClose,
}: {
  recipe: any;
  onSave: (updated: any) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(recipe.title || "");
  const [serves, setServes] = useState(recipe.serves || "");
  const [type, setType] = useState(recipe.type || "Main");
  const [ingredients, setIngredients] = useState(recipe.ingredients.join("\n"));
  const [method, setMethod] = useState(recipe.method || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      ...recipe,
      title: title.trim(),
      serves: String(serves).trim(),
      type: type,
      ingredients: ingredients.split("\n").map(i => i.trim()).filter(Boolean),
      method: method.trim(),
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center px-4 pt-4 pb-28 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 overflow-y-auto" style={{maxHeight: 'calc(100dvh - 8rem)'}}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-100">{recipe.id ? "Edit Recipe" : "Add Recipe"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Recipe Name</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full rounded-xl" placeholder="Recipe name..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Servings</label>
            <input type="text" value={serves} onChange={(e) => setServes(e.target.value)} className="input w-full rounded-xl" placeholder="e.g. 4" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {RECIPE_TYPE_ORDER.map((t) => (
                <button key={t} onClick={(e) => { e.preventDefault(); setType(t); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    type === t ? "bg-yellow-500 text-slate-900 border-yellow-500 font-bold" : "bg-slate-800 text-slate-300 border-slate-700/60 hover:border-slate-500"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ingredients (one per line)</label>
            <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="input w-full rounded-xl min-h-[120px]" placeholder="Ingredients..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Method</label>
            <textarea value={method} onChange={(e) => setMethod(e.target.value)} className="input w-full rounded-xl min-h-[160px]" placeholder="Method..." />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !title.trim()} className="btn btn-primary w-full py-3 rounded-xl">
          {saving ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RecipesScreen() {
  const { items, addItem, updateItem } = useInventory();
  const { savedRecipes, saveRecipe, updateRecipe } = useRecipeCollection();
  const [recipeUrl, setRecipeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!recipeUrl.trim()) return;
    setIsScraping(true);
    setCheckedIngredients(new Set());
    try {
      const res = await fetch("/api/scrape-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipeUrl }),
      });
      if (res.ok) { const data = await res.json(); setRecipe(data); setActiveTab("ingredients"); }
    } catch (err) { console.error(err); }
    finally { setIsScraping(false); }
  };

  const toggleIngredient = (i) => setCheckedIngredients((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });


  function capitalizeWords(str) {
    return str ? str.replace(/\b\w/g, (c) => c.toUpperCase()) : str;
  }

  const addIngredientsToCupboard = async (ings) => {
    for (const ing of ings) {
      const parts = ing.split(" ");
      const qty = /\d/.test(parts[0]) ? parts[0] : "";
      const rawName = /\d/.test(parts[0]) ? parts.slice(1).join(" ") : ing;
      const parsedName = capitalizeWords(rawName.trim());
      
      const existingItem = items.find(i => i.name.toLowerCase() === parsedName.toLowerCase());
      if (existingItem) continue;

      await addItem({ name: parsedName, category: "Uncategorised", volumeQuantity: qty, preferredSupermarket: "Any", inShoppingList: false, lastUsedDate: Date.now() });
    }
  };

  const addIngredientsToShoppingList = async (ings) => {
    for (const ing of ings) {
      const parts = ing.split(" ");
      const qty = /\d/.test(parts[0]) ? parts[0] : "";
      const rawName = /\d/.test(parts[0]) ? parts.slice(1).join(" ") : ing;
      const parsedName = capitalizeWords(rawName.trim());
      
      const existingItem = items.find(i => i.name.toLowerCase() === parsedName.toLowerCase());
      if (existingItem) {
        if (!existingItem.inShoppingList) {
          await updateItem(existingItem.id, { inShoppingList: true, lastAddedToShoppingList: Date.now() });
        }
      } else {
        await addItem({ name: parsedName, category: "Uncategorised", volumeQuantity: qty, preferredSupermarket: "Any", inShoppingList: true, lastUsedDate: Date.now() });
      }
    }
  };

  const handleSaveRecipe = async (title, serves, type) => {
    if (!recipe) return;
    await saveRecipe({ title, serves, type, ingredients: recipe.ingredients, method: recipe.method, sourceUrl: recipe.sourceUrl });
    setShowSaveModal(false);
  };

  const handleEditRecipe = async (updatedRecipe) => {
    if (updatedRecipe.id) {
      await updateRecipe(updatedRecipe.id, {
        title: updatedRecipe.title,
        serves: updatedRecipe.serves,
        type: updatedRecipe.type,
        ingredients: updatedRecipe.ingredients,
        method: updatedRecipe.method,
      });
    }
    setRecipe(updatedRecipe);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="flex flex-col h-full space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Recipes</h2>
          <button onClick={() => setShowCreateModal(true)}
            className="btn btn-primary rounded-full px-4 py-2 text-sm flex items-center gap-1.5 transition-all">
            <Plus size={16} />
            <span className="font-medium text-slate-900">Add Recipe</span>
          </button>
        </div>

        <div className="glass-panel p-4 rounded-full shadow-sm">
          <form onSubmit={handleImport} className="flex gap-2">
            <div className="relative flex-1">
              <input type="url" placeholder="Paste recipe URL here..." required
                className="input pl-4 rounded-full bg-transparent border-none shadow-none"
                value={recipeUrl} onChange={(e) => setRecipeUrl(e.target.value)} />
            </div>
            <button type="submit" disabled={isScraping} className="btn btn-primary rounded-full px-6 shadow-sm whitespace-nowrap">
              {isScraping ? <Loader2 className="animate-spin" size={20} /> : "Import"}
            </button>
          </form>
        </div>

        {!recipe ? (
          savedRecipes.length > 0 ? (
            <div className="glass-panel flex-1 flex flex-col overflow-hidden shadow-md">
              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="space-y-8">
                  {RECIPE_TYPE_ORDER.map(type => {
                    const recipesOfType = savedRecipes.filter(r => r.type === type);
                    if (recipesOfType.length === 0) return null;
                    return (
                      <div key={type}>
                        <h3 className="text-xl font-medium text-slate-300 mb-4">{type}</h3>
                        <ul className="space-y-2">
                          {recipesOfType.map(r => (
                            <li key={r.id} 
                                onClick={() => {
                                  setRecipe({
                                    id: r.id,
                                    title: r.title,
                                    serves: r.serves,
                                    ingredients: r.ingredients,
                                    method: r.method,
                                    sourceUrl: r.sourceUrl,
                                    type: r.type
                                  });
                                  setActiveTab("ingredients");
                                }}
                                className="flex items-center gap-3.5 py-3 px-4 rounded-xl cursor-pointer transition-all bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-600/60 group">
                              <BookOpen className="text-slate-400 group-hover:text-yellow-400 transition-colors shrink-0" size={20} />
                              <div className="flex-1">
                                <h4 className="text-[16px] font-medium text-slate-200">{r.title}</h4>
                                {r.serves && <p className="text-sm text-slate-400">Serves {r.serves}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel flex-1 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center mb-6 shadow-inner">
                <BookOpen className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-400 text-lg">Paste a URL above to import a recipe.</p>
            </div>
          )
        ) : (
          <div className="glass-panel flex-1 flex flex-col overflow-hidden shadow-md">
            <div className="p-6 sm:p-8 pb-6 flex justify-between items-start gap-4 shrink-0">
              <div>
                <h3 className="text-2xl font-bold mb-1 tracking-tight leading-tight text-slate-100">{recipe.title}</h3>
                {recipe.serves && <p className="text-sm font-medium text-slate-400 mb-2">Serves {recipe.serves}</p>}
                <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-normal text-yellow-400/60 hover:text-yellow-300/80 transition-colors">View original source &#8599;</a>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button onClick={() => { setRecipe(null); setCheckedIngredients(new Set()); }}
                  className="btn flex justify-center items-center gap-1.5 rounded-full px-4 py-2 text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60 transition-all w-full">
                  <ArrowLeft size={16} />
                  <span className="font-medium">Back</span>
                </button>
                <button onClick={() => setShowEditModal(true)}
                  className="btn flex justify-center items-center gap-1.5 rounded-full px-4 py-2 text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60 transition-all w-full">
                  <Pencil size={16} />
                  <span className="font-medium">Edit</span>
                </button>
              </div>
            </div>

            <div className="flex px-6 sm:px-8 border-b border-slate-800 shrink-0">
              <button onClick={() => setActiveTab("ingredients")}
                className={`pb-4 mr-8 font-medium text-lg transition-colors relative ${activeTab === "ingredients" ? "text-yellow-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}>
                Ingredients
                {activeTab === "ingredients" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 rounded-t-full" />}
              </button>
              <button onClick={() => setActiveTab("method")}
                className={`pb-4 font-medium text-lg transition-colors relative ${activeTab === "method" ? "text-yellow-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}>
                Method
                {activeTab === "method" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 rounded-t-full" />}
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              {activeTab === "ingredients" ? (
                <ul className="space-y-1">
                  {recipe.ingredients.map((ing, i) => {
                    const isChecked = checkedIngredients.has(i);
                    return (
                       <li key={i} onClick={() => toggleIngredient(i)}
                        className="flex items-center gap-3.5 py-2 px-2 rounded-xl cursor-pointer transition-all group">
                        <span className="shrink-0 text-slate-400 group-hover:text-yellow-400 transition-colors">
                          {isChecked
                            ? <CheckCircle2 size={22} className="text-yellow-400 fill-yellow-500/20" />
                            : <Circle size={22} strokeWidth={1.5} />}
                        </span>
                        <span className={`text-[16px] leading-snug transition-colors ${isChecked ? "text-yellow-400/50" : "text-slate-200"}`}>{ing}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="max-w-2xl">
                  <div className="text-[17px] leading-[1.7] text-slate-200 font-normal">
                    {recipe.method.split("\n\n").map((p, i) => <p key={i} className="mb-6">{p}</p>)}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-800 px-6 sm:px-8 py-4 flex flex-col gap-3">
              <button onClick={() => setShowAddModal(true)}
                className="btn bg-slate-800 text-slate-200 hover:bg-slate-700 w-full py-3 rounded-xl border border-slate-700/60 text-sm">
                <ListPlus size={17} />
                Add to Cupboard / Shopping List
              </button>
              <button onClick={() => setShowSaveModal(true)} className="btn btn-primary w-full py-3 rounded-xl text-sm">
                <BookmarkPlus size={17} />
                Save to Collection
              </button>
            </div>
          </div>
        )}
      </div>

      {showSaveModal && recipe && (
        <SaveRecipeModal
          initialTitle={recipe.title}
          initialServes={recipe.serves || ""}
          onSave={handleSaveRecipe}
          onClose={() => setShowSaveModal(false)}
        />
      )}
      {showAddModal && recipe && (
        <AddIngredientsModal
          ingredients={recipe.ingredients}
          onAddToCupboard={addIngredientsToCupboard}
          onAddToShoppingList={addIngredientsToShoppingList}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showEditModal && recipe && (
        <EditRecipeModal
          recipe={recipe}
          onSave={handleEditRecipe}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showCreateModal && (
        <EditRecipeModal
          recipe={{ title: "", serves: "", type: "Main", ingredients: [], method: "" }}
          onSave={async (newRecipe) => {
            await saveRecipe({
              title: newRecipe.title,
              serves: newRecipe.serves,
              type: newRecipe.type,
              ingredients: newRecipe.ingredients,
              method: newRecipe.method,
              sourceUrl: "",
            });
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
}