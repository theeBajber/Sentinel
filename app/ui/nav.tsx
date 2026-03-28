"use client";
import { ShieldHalfIcon, User } from "lucide-react";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full flex items-center bg-bg-primary justify-between h-16 px-6">
      <h1 className="flex items-center gap-2 text-accent-blue font-bold">
        <ShieldHalfIcon />
        SENTINEL
      </h1>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 uppercase text-text-muted *:hover:text-text-primary">
          <Link
            href={"/"}
            className="text-xs font-semibold text-accent-blue tracking-widest"
          >
            Dashboard
          </Link>
          <Link
            href={"/threats"}
            className="text-xs font-semibold tracking-widest"
          >
            Threats
          </Link>
          <Link
            href={"/logs"}
            className="text-xs font-semibold tracking-widest"
          >
            History
          </Link>
          <Link
            href={"/settings"}
            className="text-xs font-semibold tracking-widest"
          >
            Settings
          </Link>
        </div>
        <button className="p-1.5 rounded-lg bg-[#2e3447]">
          <User className="size-4" />
        </button>
      </div>
    </nav>
  );
}
