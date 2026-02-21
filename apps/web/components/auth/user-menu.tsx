"use client";

import { useState, useRef, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { SignInButton } from "./sign-in-button";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, ListMusic, ChevronDown } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isPending) {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />;
  }

  if (!session) {
    return <SignInButton />;
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="max-w-[120px] truncate text-sm">
          {session.user.name}
        </span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover shadow-lg z-50">
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              Music Preferences
            </Link>
            <Link
              href="/playlists"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
            >
              <ListMusic className="h-4 w-4" />
              Saved Playlists
            </Link>
            <hr className="my-1 border-border" />
            <button
              onClick={() => {
                setOpen(false);
                authClient.signOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
