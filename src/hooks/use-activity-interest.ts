import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_PREFIX = "familyloop:interest:";

function hasLocalInterest(activityId: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + activityId) === "1";
  } catch {
    return false;
  }
}

function setLocalInterest(activityId: string) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + activityId, "1");
  } catch {
    // localStorage unavailable (private mode, disabled) — interest is still recorded server-side.
  }
}

export function useActivityInterest(activityId: string) {
  const [count, setCount] = useState<number | null>(null);
  const [interested, setInterested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInterested(hasLocalInterest(activityId));
  }, [activityId]);

  useEffect(() => {
    let active = true;
    supabase
      .from("interest")
      .select("*", { count: "exact", head: true })
      .eq("activity_id", activityId)
      .then(({ count: c, error }) => {
        if (!active || error) return;
        setCount(c ?? 0);
      });
    return () => {
      active = false;
    };
  }, [activityId]);

  const markInterest = useCallback(async () => {
    if (interested || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("interest").insert({ activity_id: activityId });
    setSubmitting(false);
    if (error) {
      return false;
    }
    setLocalInterest(activityId);
    setInterested(true);
    setCount((prev) => (prev ?? 0) + 1);
    return true;
  }, [activityId, interested, submitting]);

  return { count, interested, submitting, markInterest };
}
