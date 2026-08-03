"use client";

import { useState } from "react";
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
import { GripVertical, Plus, X, Edit2, Trash2, ArrowLeft, Store } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";

function SortableSupermarketItem({ market, index, onClick }: { market: string; index: number; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: market });

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
          <Store size={18} className="text-slate-400" />
        </span>
        <span className="font-medium text-[15px] text-slate-200">{market}</span>
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

export default function SupermarketsSettingsScreen() {
  const { householdId } = useAuth();
  const { supermarkets, setSupermarkets, loading: supermarketsLoading } = useSupermarkets();
  
  // Supermarket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupermarket, setEditingSupermarket] = useState<string | null>(null);
  const [marketName, setMarketName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = supermarkets.indexOf(active.id as string);
      const newIndex = supermarkets.indexOf(over.id as string);
      const updatedList = arrayMove(supermarkets, oldIndex, newIndex);
      await setSupermarkets(updatedList);
    }
  };

  const openModal = (market?: string) => {
    if (market) {
      setEditingSupermarket(market);
      setMarketName(market);
    } else {
      setEditingSupermarket(null);
      setMarketName("");
    }
    setIsModalOpen(true);
  };

  const saveSupermarket = async () => {
    const name = marketName.trim();
    if (!name) return;
    
    let updatedList = [...supermarkets];
    
    if (editingSupermarket) {
      // Don't allow duplicates if changing name
      if (editingSupermarket !== name && updatedList.includes(name)) {
        alert("This supermarket already exists.");
        return;
      }
      
      updatedList = updatedList.map(m => m === editingSupermarket ? name : m);
      
      // Update routes to rename the supermarket key
      if (editingSupermarket !== name && householdId) {
        const docRef = doc(db, "households", householdId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.supermarketRoutes && data.supermarketRoutes[editingSupermarket]) {
            const newRoutes = { ...data.supermarketRoutes };
            newRoutes[name] = newRoutes[editingSupermarket];
            delete newRoutes[editingSupermarket];
            await setDoc(docRef, { supermarketRoutes: newRoutes }, { merge: true });
          }
        }
      }
    } else {
      if (updatedList.includes(name)) {
        alert("This supermarket already exists.");
        return;
      }
      updatedList.push(name);
    }
    
    await setSupermarkets(updatedList);
    setIsModalOpen(false);
  };

  const deleteSupermarket = async () => {
    if (!editingSupermarket) return;
    const updatedList = supermarkets.filter(m => m !== editingSupermarket);
    await setSupermarkets(updatedList);
    setIsModalOpen(false);
  };

  if (supermarketsLoading) {
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Manage Supermarkets</h2>
      </div>

      <div className="glass-panel p-6 sm:p-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <p className="text-sm text-slate-400">
              Add, edit, or drag to reorder your supermarkets.
            </p>
          </div>
          <button 
            onClick={() => openModal()} 
            className="btn btn-primary rounded-full px-5 py-2 text-sm self-end sm:self-auto"
          >
            <Plus size={16} />
            <span className="font-semibold">Add Supermarket</span>
          </button>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={supermarkets}
            strategy={verticalListSortingStrategy}
          >
            <div className="w-full max-w-lg mx-auto space-y-2 rounded-xl">
              {supermarkets.map((market, index) => (
                <SortableSupermarketItem 
                  key={market} 
                  market={market} 
                  index={index} 
                  onClick={() => openModal(market)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {isModalOpen && (
        <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center px-4 pt-4 pb-28 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">{editingSupermarket ? "Edit Supermarket" : "Add Supermarket"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Supermarket Name</label>
                <input 
                  type="text" 
                  value={marketName} 
                  onChange={(e) => setMarketName(e.target.value)}
                  placeholder="e.g. Tesco" 
                  className="input w-full" 
                  autoFocus 
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {editingSupermarket ? (
                <button 
                  onClick={deleteSupermarket} 
                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                  title="Delete Supermarket"
                >
                  <Trash2 size={20} />
                </button>
              ) : <div></div>}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60 rounded-xl px-4 py-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveSupermarket}
                  disabled={!marketName.trim()}
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
