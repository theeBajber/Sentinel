"use client";
import { ShieldHalfIcon, User, Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Threats from "../threats/page";
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

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);
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
    <nav className="w-full flex items-center bg-bg-primary justify-between h-16 px-4 md:px-6 relative">
      <h1 className="flex items-center gap-2 text-accent-blue font-bold text-sm md:text-base">
        <ShieldHalfIcon className="size-4 md:size-5" />
        <span className="">SENTINEL</span>
      </h1>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
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
        <div className="relative" ref={userMenuRef}>
          <button
            className="p-1.5 rounded-lg bg-bg-hover hover:bg-bg-card transition-colors"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <User className="size-4" />
          </button>
          
          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card rounded-lg border border-bg-hover shadow-lg z-50">
              <div className="px-4 py-3 border-b border-bg-hover">
                <p className="text-sm text-text-primary font-medium">{email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors rounded-b-lg"
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
            className="p-1.5 rounded-lg bg-bg-hover hover:bg-bg-card transition-colors"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <User className="size-4" />
          </button>
          
          {/* Mobile User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card rounded-lg border border-bg-hover shadow-lg z-50">
              <div className="px-4 py-3 border-b border-bg-hover">
                <p className="text-sm text-text-primary font-medium">{email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors rounded-b-lg"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
        <button
          className="p-1.5 rounded-lg bg-bg-hover hover:bg-bg-card transition-colors"
          onClick={() => {
            setIsOpen(!isOpen);
            setUserMenuOpen(false); // Close user menu when opening mobile menu
          }}
        >
          {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 right-0 left-0 bg-bg-primary border-b border-bg-hover md:hidden z-50">
          <div className="flex flex-col gap-2 p-4">
            {links.map((link, idx) => (
              <Link
                href={link.path}
                className={`px-4 py-2 rounded text-sm font-semibold tracking-widest uppercase transition-colors ${isActive(link.path) ? "text-accent-blue bg-bg-hover" : "text-text-muted hover:text-text-primary"}`}
                key={idx}
                onClick={() => {
                  setIsOpen(false);
                  setUserMenuOpen(false); // Close user menu when navigating
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