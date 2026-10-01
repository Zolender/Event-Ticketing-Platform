"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => null);
    router.replace("/sign-in?reason=signed-out");
    router.refresh();
  }

  return (
    <Button variant="text" onClick={signOut} disabled={pending}>
      Sign out
    </Button>
  );
}
