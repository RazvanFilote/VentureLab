import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { milestonesApi } from "../api/client";
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput } from "../api/types";

interface MilestonesContextType {
  milestones: Record<string, Milestone[]>;
  loading: Record<string, boolean>;
  fetchMilestones: (ideaId: string) => Promise<void>;
  createMilestone: (ideaId: string, data: CreateMilestoneInput) => Promise<Milestone>;
  updateMilestone: (ideaId: string, milestoneId: string, data: UpdateMilestoneInput) => Promise<Milestone>;
  deleteMilestone: (ideaId: string, milestoneId: string) => Promise<void>;
}

const MilestonesContext = createContext<MilestonesContextType | null>(null);

export function MilestonesProvider({ children }: { children: ReactNode }) {
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchMilestones = useCallback(async (ideaId: string) => {
    setLoading((prev) => ({ ...prev, [ideaId]: true }));
    try {
      const items = await milestonesApi.list(ideaId);
      setMilestones((prev) => ({ ...prev, [ideaId]: items }));
    } catch {
      setMilestones((prev) => ({ ...prev, [ideaId]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [ideaId]: false }));
    }
  }, []);

  const createMilestone = useCallback(async (ideaId: string, data: CreateMilestoneInput): Promise<Milestone> => {
    const m = await milestonesApi.create(ideaId, data);
    setMilestones((prev) => ({ ...prev, [ideaId]: [...(prev[ideaId] ?? []), m] }));
    return m;
  }, []);

  const updateMilestone = useCallback(async (ideaId: string, milestoneId: string, data: UpdateMilestoneInput): Promise<Milestone> => {
    const m = await milestonesApi.update(ideaId, milestoneId, data);
    setMilestones((prev) => ({
      ...prev,
      [ideaId]: (prev[ideaId] ?? []).map((item) => (item.id === milestoneId ? m : item)),
    }));
    return m;
  }, []);

  const deleteMilestone = useCallback(async (ideaId: string, milestoneId: string): Promise<void> => {
    await milestonesApi.delete(ideaId, milestoneId);
    setMilestones((prev) => ({
      ...prev,
      [ideaId]: (prev[ideaId] ?? []).filter((m) => m.id !== milestoneId),
    }));
  }, []);

  return (
    <MilestonesContext.Provider value={{ milestones, loading, fetchMilestones, createMilestone, updateMilestone, deleteMilestone }}>
      {children}
    </MilestonesContext.Provider>
  );
}

export function useMilestones(): MilestonesContextType {
  const ctx = useContext(MilestonesContext);
  if (!ctx) throw new Error("useMilestones must be used within MilestonesProvider");
  return ctx;
}
