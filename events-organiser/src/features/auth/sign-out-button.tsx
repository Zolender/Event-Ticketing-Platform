"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => null);
    // On a shared computer, the next organiser must not see this one's cached events.
    queryClient.clear();
    router.replace("/sign-in?reason=signed-out");
    router.refresh();
  }

  return (
    <Button variant="text" onClick={signOut} disabled={pending}>
      Sign out
    </Button>
  );
}
