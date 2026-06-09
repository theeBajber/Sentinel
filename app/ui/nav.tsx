"use client";
import { ShieldHalf, User, Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

export function Nav() {
  const pathName = usePathname();
  const { isAuthenticated, email, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (pathName === "/login") return null;
  if (pathName === "/register") return null;
  if (!isAuthenticated) return null;

  const links = [
    { name: "Dashboard", path: "/" },
    { name: "Threats", path: "/threats" },
    { name: "History", path: "/logs" },
    { name: "Settings", path: "/settings" },
  ];
  const isActive = (path: string) => pathName === path;

  const handleLogout = () => {
    console.log('Nav logout clicked');
    logout();
    setUserMenuOpen(false);
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    console.log('Logout button clicked');
    e.stopPropagation();
    e.preventDefault();
    handleLogout();
  };

  return (
    <nav className="w-full flex items-center bg-slate-900 justify-between h-16 px-4 md:px-6 relative">
      <h1 className="flex items-center gap-2 text-blue-300 font-bold text-sm md:text-base">
        <ShieldHalf className="size-4 md:size-5" />
        <span className="">SENTINEL</span>
      </h1>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-4 uppercase text-slate-400 *:hover:text-white">
          {links.map((link, idx) => (
            <Link
              href={link.path}
              className={`text-xs font-semibold tracking-widest ${isActive(link.path) ? "text-blue-300" : ""} transition-colors`}
              key={idx}
            >
              {link.name}
            </Link>
          ))}
        </div>
        <div className="relative" ref={userMenuRef}>
          <button
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            type="button"
          >
            <User className="size-4" />
          </button>
          
          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 rounded-lg border border-slate-700 shadow-lg z-50">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm text-white font-medium">{email}</p>
              </div>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-800 transition-colors rounded-b-lg"
                type="button"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center gap-3">
        <div className="relative" ref={userMenuRef}>
          <button
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            type="button"
          >
            <User className="size-4" />
          </button>
          
          {/* Mobile User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 rounded-lg border border-slate-700 shadow-lg z-50">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm text-white font-medium">{email}</p>
              </div>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-800 transition-colors rounded-b-lg"
                type="button"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
        <button
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          onClick={() => {
            setIsOpen(!isOpen);
            setUserMenuOpen(false);
          }}
          type="button"
        >
          {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 right-0 left-0 bg-slate-900 border-b border-slate-700 md:hidden z-50">
          <div className="flex flex-col gap-2 p-4">
            {links.map((link, idx) => (
              <Link
                href={link.path}
                className={`px-4 py-2 rounded text-sm font-semibold tracking-widest uppercase transition-colors ${isActive(link.path) ? "text-blue-300 bg-slate-800" : "text-slate-400 hover:text-white"}`}
                key={idx}
                onClick={() => {
                  setIsOpen(false);
                  setUserMenuOpen(false);
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}