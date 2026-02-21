"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export function SignInButton() {
  const handleSignIn = () => {
    authClient.signIn.social({
      provider: "spotify",
      callbackURL: "/",
    });
  };

  return (
    <Button onClick={handleSignIn} variant="outline" size="sm">
      <Music className="h-4 w-4 mr-2" />
      Sign in with Spotify
    </Button>
  );
}
