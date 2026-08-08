"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCategories } from "@/lib/contexts/CategoriesContext";
import { useSupermarkets } from "@/lib/contexts/SupermarketsContext";
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
import { GripVertical, Save, Loader2, RotateCcw, Store, ArrowLeft } from "lucide-react";
import Link from "next/link";



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

export default function RoutesSettingsScreen() {
  const { householdId } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const { supermarkets, loading: supermarketsLoading } = useSupermarkets();
  
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>("");
  const [supermarketRoutes, setSupermarketRoutes] = useState<Record<string, string[]>>({});
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);

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

  useEffect(() => {
    if (supermarkets.length > 0 && !selectedSupermarket) {
      setSelectedSupermarket(supermarkets[0]);
    }
  }, [supermarkets, selectedSupermarket]);

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

  if (categoriesLoading || isLoadingRoutes || supermarketsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (supermarkets.length === 0) {
    return (
      <div className="flex flex-col h-full space-y-6 pb-24">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Supermarket Routes</h2>
        </div>
        <div className="glass-panel p-6 text-slate-400">
          No supermarkets found. Please add supermarkets in the Manage Supermarkets settings.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Supermarket Routes</h2>
      </div>

      <div className="glass-panel p-6">
        <p className="text-sm text-slate-400 mb-6">
          Select a supermarket to customise your walking route through its departments.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {supermarkets.map((market) => {
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

      <div className="glass-panel p-6 sm:p-8 flex-1">
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
            {/* Removed max-h and overflow-y-auto so the list extends fully */}
            <div className="w-full space-y-2 rounded-xl">
              {currentRoute.map((department, index) => (
                <SortableRouteItem key={department} id={department} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
