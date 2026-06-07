"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LogOut, User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null;

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/favicon.ico" alt="Terac Logo" width={32} height={32} unoptimized />
        <span className="font-semibold text-lg">terac</span>
      </Link>
      
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center outline-none focus:ring-2 focus:ring-neutral-900 rounded-full"
        >
          {session.user?.image ? (
            <Image 
              src={session.user.image} 
              alt="Profile" 
              width={36} 
              height={36} 
              className="rounded-full"
            />
          ) : (
            <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center">
              <User size={20} className="text-neutral-500" />
            </div>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-10">
            <div className="px-4 py-2 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-900 truncate">{session.user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">{session.user?.email}</p>
            </div>
            <button 
              onClick={() => signOut()}
              className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
