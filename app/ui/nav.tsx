"use client";
import { ShieldHalfIcon, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Threats from "../threats/page";
import { useAuth } from "@/lib/auth-context";

export function Nav() {
  const pathName = usePathname();
  const { isAuthenticated, email, logout } = useAuth();
  console.log(email, logout, isAuthenticated);
  if (pathName === "/login") return null;
  if (!isAuthenticated) return null;
  const links = [
    { name: "Dashboard", path: "/" },
    { name: "Threats", path: "/threats" },
    { name: "History", path: "/logs" },
    { name: "Settings", path: "/settings" },
  ];
  const isActive = (path: string) => pathName === path;
  return (
    <nav className="w-full flex items-center bg-bg-primary justify-between h-16 px-6">
      <h1 className="flex items-center gap-2 text-accent-blue font-bold">
        <ShieldHalfIcon />
        SENTINEL
      </h1>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 uppercase text-text-muted *:hover:text-text-primary">
          {links.map((link, idx) => (
            <Link
              href={link.path}
              className={`text-xs font-semibold tracking-widest ${isActive(link.path) ? "text-accent-blue" : ""} transition-colors`}
              key={idx}
            >
              {link.name}
            </Link>
          ))}
        </div>
        <button
          className="p-1.5 rounded-lg bg-[#2e3447]"
          onClick={() => {
            logout();
          }}
        >
          <User className="size-4" />
        </button>
      </div>
    </nav>
  );
}
