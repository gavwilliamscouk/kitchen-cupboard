"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface HouseholdData {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  householdId: string | null;
  memberHouseholds: HouseholdData[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setHousehold: (id: string) => Promise<void>;
  updateHouseholdName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [memberHouseholds, setMemberHouseholds] = useState<HouseholdData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user data from firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setHouseholdId(data.householdId);
          
          const households = data.households || (data.householdId ? [data.householdId] : []);
          const loadedHouseholds: HouseholdData[] = [];
          
          for (const hId of households) {
            const hRef = doc(db, "households", hId);
            const hSnap = await getDoc(hRef);
            if (hSnap.exists()) {
              loadedHouseholds.push({ id: hId, name: hSnap.data().name || "My Household" });
            } else {
              loadedHouseholds.push({ id: hId, name: "My Household" });
            }
          }
          setMemberHouseholds(loadedHouseholds);
        } else {
          // Create user record
          await setDoc(userRef, {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            householdId: null,
            households: []
          });
          setMemberHouseholds([]);
        }
      } else {
        setHouseholdId(null);
        setMemberHouseholds([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Popup Auth Error:", error.message);
      alert("Login Error: " + error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const setHousehold = async (id: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    let currentHouseholds: string[] = [];
    
    if (userSnap.exists()) {
       currentHouseholds = userSnap.data().households || (userSnap.data().householdId ? [userSnap.data().householdId] : []);
    }
    
    if (!currentHouseholds.includes(id)) {
       currentHouseholds.push(id);
    }
    
    await setDoc(userRef, { householdId: id, households: currentHouseholds }, { merge: true });
    
    // Check if household exists, if not initialize name
    const hRef = doc(db, "households", id);
    const hSnap = await getDoc(hRef);
    let hName = "My Household";
    
    if (!hSnap.exists() || !hSnap.data().name) {
       await setDoc(hRef, { name: "My Household" }, { merge: true });
    } else {
       hName = hSnap.data().name;
    }

    setHouseholdId(id);
    setMemberHouseholds(prev => {
       if (prev.some(h => h.id === id)) return prev;
       return [...prev, { id, name: hName }];
    });
  };

  const updateHouseholdName = async (name: string) => {
    if (!householdId) return;
    const hRef = doc(db, "households", householdId);
    await setDoc(hRef, { name }, { merge: true });
    setMemberHouseholds(prev => prev.map(h => h.id === householdId ? { ...h, name } : h));
  };

  return (
    <AuthContext.Provider value={{ user, householdId, memberHouseholds, loading, signInWithGoogle, logout, setHousehold, updateHouseholdName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
