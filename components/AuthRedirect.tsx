"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function AuthRedirect() {
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) window.location.replace("/dashboard");
    };
    check();
  }, []);
  return null;
}
