"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, BookOpen, Settings } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Cupboard", path: "/", icon: Home },
    { name: "List", path: "/shopping-list", icon: ShoppingCart },
    { name: "Recipes", path: "/recipes", icon: BookOpen },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-[60] px-4 sm:top-0 sm:bottom-auto sm:px-0 sm:left-auto sm:right-auto sm:w-full">
      <div className="glass-blur border-transparent mx-auto max-w-sm sm:max-w-4xl px-2 sm:px-6 py-2 sm:py-3 flex justify-around sm:justify-center sm:gap-12 items-center rounded-full sm:rounded-none sm:border-x-0 sm:border-t-0 shadow-float sm:shadow-none">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={(e) => {
                if (isActive && item.name === "Recipes") {
                  e.preventDefault();
                  window.location.href = item.path;
                }
              }}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
                isActive 
                  ? "text-yellow-400" 
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={isActive ? "transform scale-110 text-yellow-400" : "transform scale-100 text-slate-400"}
              />
              <span className={`text-[10px] sm:text-sm transition-all duration-300 ${isActive ? 'font-semibold opacity-100 text-yellow-400' : 'font-medium opacity-80 text-slate-300'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
