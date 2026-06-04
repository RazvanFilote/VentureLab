import * as rest from "./rest";

const mode = import.meta.env.VITE_API_MODE ?? "standalone";

export const isApiMode = mode === "rest";

export const ideasApi = rest.ideasApi;
export const milestonesApi = rest.milestonesApi;

export const wsUrl = `${(import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace("http", "ws")}/ws`;
