import Link from "next/link";
import { Music } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

export function NavBar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-5xl">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Music className="h-5 w-5" />
          <span>CrossFit Playlist</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
