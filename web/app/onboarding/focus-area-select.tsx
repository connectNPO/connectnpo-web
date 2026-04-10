"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const FOCUS_AREAS = [
  "Education",
  "Health & Healthcare",
  "Environment & Conservation",
  "Arts & Culture",
  "Social Services",
  "Housing & Homelessness",
  "Youth Development",
  "Community Development",
  "Civil Rights & Advocacy",
  "Science & Technology",
  "Other",
];

export default function FocusAreaSelect() {
  const [selected, setSelected] = useState("");

  return (
    <div className="space-y-2">
      <Label htmlFor="focus_area_select">Focus Area</Label>
      <select
        id="focus_area_select"
        required
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>
          Select a focus area
        </option>
        {FOCUS_AREAS.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </select>

      {selected === "Other" && (
        <Input
          name="focus_area"
          placeholder="Enter your focus area"
          required
          className="mt-2"
        />
      )}

      {selected && selected !== "Other" && (
        <input type="hidden" name="focus_area" value={selected} />
      )}
    </div>
  );
}
