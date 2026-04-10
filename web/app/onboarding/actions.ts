"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function submitOnboarding(formData: FormData) {
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    mission: String(formData.get("mission") ?? "").trim(),
    focus_area: String(formData.get("focus_area") ?? "").trim(),
    annual_budget: String(formData.get("annual_budget") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
  };

  // Basic validation: every field is required
  for (const [key, value] of Object.entries(payload)) {
    if (!value) {
      throw new Error(`Missing required field: ${key}`);
    }
  }

  const { error } = await supabase.from("organizations").insert(payload);

  if (error) {
    console.error("Failed to insert organization:", error);
    throw new Error("Could not save your organization. Please try again.");
  }

  const params = new URLSearchParams({
    focus_area: payload.focus_area,
    org: payload.name,
    state: payload.state,
    budget: payload.annual_budget,
  });
  redirect(`/results?${params.toString()}`);
}
