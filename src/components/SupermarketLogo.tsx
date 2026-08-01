import React from "react";

export function SupermarketLogo({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const normalized = name.toLowerCase().trim();

  if (normalized.includes("tesco")) {
    return (
      <div className={`inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 shrink-0 ${className}`}>
        <span className="font-black tracking-wider text-[#EE1C2E] text-base leading-none">TESCO</span>
        <span className="flex gap-[2px] ml-0.5">
          <span className="w-1 h-[3px] bg-[#00539F] rounded-full"></span>
          <span className="w-1 h-[3px] bg-[#00539F] rounded-full"></span>
          <span className="w-1 h-[3px] bg-[#00539F] rounded-full"></span>
        </span>
      </div>
    );
  }

  if (normalized.includes("asda")) {
    return (
      <div className={`inline-flex items-center bg-[#78BE20] px-3.5 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
        <span className="font-black tracking-widest text-white text-base leading-none">ASDA</span>
      </div>
    );
  }

  if (normalized.includes("sainsbury")) {
    return (
      <div className={`inline-flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 shrink-0 ${className}`}>
        <span className="font-black tracking-tight text-[#EC8A00] text-base leading-none">Sainsbury&apos;s</span>
      </div>
    );
  }

  if (normalized.includes("lidl")) {
    return (
      <div className={`inline-flex items-center justify-center bg-[#0050AA] border-2 border-[#E30613] px-3 py-1.5 rounded-lg shadow-sm relative shrink-0 overflow-hidden ${className}`}>
        <span className="font-black text-[#FFF000] text-base tracking-wider leading-none">LIDL</span>
      </div>
    );
  }

  if (normalized.includes("aldi")) {
    return (
      <div className={`inline-flex items-center justify-center bg-[#0A2540] border-2 border-[#00A3E0] px-3.5 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
        <span className="font-black tracking-widest text-[#FFC72C] text-base leading-none">ALDI</span>
      </div>
    );
  }

  if (normalized.includes("co-op") || normalized.includes("coop")) {
    return (
      <div className={`inline-flex items-center bg-[#00B2A9] px-3.5 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
        <span className="font-black tracking-tight text-white text-base leading-none">coop</span>
      </div>
    );
  }

  if (normalized.includes("boots")) {
    return (
      <div className={`inline-flex items-center bg-[#001A70] px-3.5 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
        <span className="font-serif italic font-black text-white text-base leading-none">Boots</span>
      </div>
    );
  }

  if (normalized.includes("b&q") || normalized.includes("bnq")) {
    return (
      <div className={`inline-flex items-center bg-[#FF6600] px-3 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
        <span className="font-black text-white text-base leading-none">B&amp;Q</span>
      </div>
    );
  }

  if (normalized.includes("halfords")) {
    return (
      <div className={`inline-flex items-center bg-[#111111] border border-[#FF6600] px-3 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
        <span className="font-black text-[#FF6600] text-sm leading-none">halfords</span>
      </div>
    );
  }

  if (normalized.includes("waitrose")) {
    return (
      <div className={`inline-flex items-center bg-[#00592D] px-3.5 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
        <span className="font-serif font-bold text-white text-base leading-none">Waitrose</span>
      </div>
    );
  }

  if (normalized.includes("next")) {
    return (
      <div className={`inline-flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-300 shrink-0 ${className}`}>
        <span className="font-black text-black text-sm leading-none tracking-widest">NEXT</span>
      </div>
    );
  }

  // Generic store logo badge
  return (
    <div className={`inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 px-3.5 py-1.5 rounded-lg shadow-sm shrink-0 ${className}`}>
      <span className="text-sm">🛒</span>
      <span className="font-extrabold text-slate-100 text-sm uppercase">{name}</span>
    </div>
  );
}
