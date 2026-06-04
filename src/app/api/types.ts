export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface IdeaApiItem {
  id: string;
  title: string;
  industry: string;
  stage: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  ideaId: string;
  title: string;
  description: string;
  status: "Pending" | "InProgress" | "Done";
  dueDate?: string | null;
  createdAt: string;
}

export interface CreateMilestoneInput {
  title: string;
  description: string;
  status?: "Pending" | "InProgress" | "Done";
  dueDate?: string | null;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  status?: "Pending" | "InProgress" | "Done";
  dueDate?: string | null;
}
