import type {
  PageResult,
  IdeaApiItem,
  Milestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "./types";
import type { Idea, Offer, Feedback } from "../data/mockData";
import { API_BASE, getToken, triggerUnauthorized } from "./auth";

const BASE = API_BASE;

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const init: RequestInit = {
    method,
    headers: authHeaders(body ? { "Content-Type": "application/json" } : undefined),
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const r = await fetch(`${BASE}${path}`, init);
  if (r.status === 401) {
    triggerUnauthorized();
    throw new Error(`${method} ${path} → 401 (session expired)`);
  }
  if (!r.ok && r.status !== 204) {
    throw new Error(`${method} ${path} → ${r.status}`);
  }
  if (r.status === 204) return undefined as T;
  return r.json();
}

function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

function del(path: string): Promise<void> {
  return request<void>("DELETE", path);
}

// ── Transforms ────────────────────────────────────────────────────────────

function toIdeaItem(raw: Record<string, unknown>): IdeaApiItem {
  return {
    id: raw.id as string,
    title: raw.title as string,
    industry: raw.industry as string,
    stage: raw.stage as string,
    description: raw.description as string,
    createdBy: raw.created_by as string,
    createdAt: raw.created_at as string,
  };
}

function toIdea(raw: Record<string, unknown>): Idea {
  return {
    id: raw.id as string,
    title: raw.title as string,
    industry: raw.industry as string,
    stage: raw.stage as string,
    description: raw.description as string,
    createdBy: raw.created_by as string,
    createdAt: raw.created_at as string,
    // backend doesn't store these; computed client-side from feedback
    avgRating: 0,
    feedbackCount: 0,
  };
}

function toOffer(raw: Record<string, unknown>): Offer {
  return {
    id: raw.id as string,
    ideaId: raw.idea_id as string,
    ideaTitle: (raw.idea_title as string) ?? "",
    investorName: raw.investor_name as string,
    amount: raw.amount as number,
    equity: raw.equity as number,
    message: raw.message as string,
    status: raw.status as Offer["status"],
    createdAt: raw.created_at as string,
  };
}

function toFeedback(raw: Record<string, unknown>): Feedback {
  return {
    id: raw.id as string,
    ideaId: raw.idea_id as string,
    user: raw.user as string,
    rating: raw.rating as number,
    comment: raw.comment as string,
    createdAt: raw.created_at as string,
  };
}

function toMilestone(raw: Record<string, unknown>): Milestone {
  return {
    id: raw.id as string,
    ideaId: raw.idea_id as string,
    title: raw.title as string,
    description: raw.description as string,
    status: raw.status as Milestone["status"],
    dueDate: raw.due_date as string | null | undefined,
    createdAt: raw.created_at as string,
  };
}

// ── Helper: fetch every page of a paginated endpoint ─────────────────────

async function fetchAllPages<T>(
  buildPath: (page: number, pageSize: number) => string,
  mapper: (raw: Record<string, unknown>) => T,
  pageSize = 100,
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  let pages = 1;
  do {
    const raw = await get<Record<string, unknown>>(buildPath(page, pageSize));
    const items = raw.items as Record<string, unknown>[];
    for (const it of items) out.push(mapper(it));
    pages = (raw.pages as number) ?? 1;
    page += 1;
  } while (page <= pages);
  return out;
}

// ── Ideas ─────────────────────────────────────────────────────────────────

export const ideasApi = {
  async list(page: number, pageSize: number): Promise<PageResult<IdeaApiItem>> {
    const raw = await get<Record<string, unknown>>(
      `/api/ideas?page=${page}&page_size=${pageSize}`,
    );
    const items = (raw.items as Record<string, unknown>[]).map(toIdeaItem);
    return {
      items,
      total: raw.total as number,
      page: raw.page as number,
      pageSize: raw.page_size as number,
      pages: raw.pages as number,
    };
  },

  async listAll(): Promise<Idea[]> {
    return fetchAllPages(
      (page, ps) => `/api/ideas?page=${page}&page_size=${ps}`,
      toIdea,
    );
  },

  async create(data: {
    title: string;
    industry: string;
    stage: string;
    description: string;
    createdBy: string;
  }): Promise<Idea> {
    const raw = await post<Record<string, unknown>>(`/api/ideas`, {
      title: data.title,
      industry: data.industry,
      stage: data.stage,
      description: data.description,
      created_by: data.createdBy,
    });
    return toIdea(raw);
  },

  async update(
    id: string,
    data: { title?: string; industry?: string; stage?: string; description?: string },
  ): Promise<Idea> {
    const body: Record<string, unknown> = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.industry !== undefined) body.industry = data.industry;
    if (data.stage !== undefined) body.stage = data.stage;
    if (data.description !== undefined) body.description = data.description;
    const raw = await put<Record<string, unknown>>(`/api/ideas/${id}`, body);
    return toIdea(raw);
  },

  async delete(id: string): Promise<void> {
    await del(`/api/ideas/${id}`);
  },
};

// ── Offers ────────────────────────────────────────────────────────────────

export const offersApi = {
  async listAll(): Promise<Offer[]> {
    return fetchAllPages(
      (page, ps) => `/api/offers?page=${page}&page_size=${ps}`,
      toOffer,
    );
  },

  async create(data: {
    ideaId: string;
    ideaTitle: string;
    investorName: string;
    amount: number;
    equity: number;
    message: string;
  }): Promise<Offer> {
    const raw = await post<Record<string, unknown>>(`/api/offers`, {
      idea_id: data.ideaId,
      idea_title: data.ideaTitle,
      investor_name: data.investorName,
      amount: data.amount,
      equity: data.equity,
      message: data.message,
    });
    return toOffer(raw);
  },

  async updateStatus(id: string, status: "Accepted" | "Rejected"): Promise<Offer> {
    const raw = await patch<Record<string, unknown>>(`/api/offers/${id}/status`, {
      status,
    });
    return toOffer(raw);
  },

  async delete(id: string): Promise<void> {
    await del(`/api/offers/${id}`);
  },
};

// ── Feedback ──────────────────────────────────────────────────────────────

export const feedbackApi = {
  async listAll(): Promise<Feedback[]> {
    return fetchAllPages(
      (page, ps) => `/api/feedback?page=${page}&page_size=${ps}`,
      toFeedback,
    );
  },

  async create(data: {
    ideaId: string;
    user: string;
    rating: number;
    comment: string;
  }): Promise<Feedback> {
    const raw = await post<Record<string, unknown>>(`/api/feedback`, {
      idea_id: data.ideaId,
      user: data.user,
      rating: data.rating,
      comment: data.comment,
    });
    return toFeedback(raw);
  },

  async update(
    id: string,
    data: { rating?: number; comment?: string },
  ): Promise<Feedback> {
    const body: Record<string, unknown> = {};
    if (data.rating !== undefined) body.rating = data.rating;
    if (data.comment !== undefined) body.comment = data.comment;
    const raw = await put<Record<string, unknown>>(`/api/feedback/${id}`, body);
    return toFeedback(raw);
  },

  async delete(id: string): Promise<void> {
    await del(`/api/feedback/${id}`);
  },
};

// ── Milestones ────────────────────────────────────────────────────────────

export const milestonesApi = {
  async list(ideaId: string): Promise<Milestone[]> {
    const raw = await get<Record<string, unknown>[]>(`/api/ideas/${ideaId}/milestones`);
    return raw.map(toMilestone);
  },

  async create(ideaId: string, data: CreateMilestoneInput): Promise<Milestone> {
    const raw = await post<Record<string, unknown>>(`/api/ideas/${ideaId}/milestones`, {
      title: data.title,
      description: data.description,
      status: data.status ?? "Pending",
      due_date: data.dueDate ?? null,
    });
    return toMilestone(raw);
  },

  async update(
    ideaId: string,
    milestoneId: string,
    data: UpdateMilestoneInput,
  ): Promise<Milestone> {
    const body: Record<string, unknown> = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.description !== undefined) body.description = data.description;
    if (data.status !== undefined) body.status = data.status;
    if (data.dueDate !== undefined) body.due_date = data.dueDate;
    const raw = await put<Record<string, unknown>>(
      `/api/ideas/${ideaId}/milestones/${milestoneId}`,
      body,
    );
    return toMilestone(raw);
  },

  async delete(ideaId: string, milestoneId: string): Promise<void> {
    await del(`/api/ideas/${ideaId}/milestones/${milestoneId}`);
  },
};
