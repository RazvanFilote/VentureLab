import * as rest from "./rest";
import { API_BASE } from "./auth";

const mode = import.meta.env.VITE_API_MODE ?? "standalone";

export const isApiMode = mode === "rest";

export const ideasApi = rest.ideasApi;
export const milestonesApi = rest.milestonesApi;

// Derive the WS URL from the shared API base. In a same-origin prod build
// API_BASE is "", so fall back to the page origin. (WS is disabled by default
// via VITE_ENABLE_WS; this just avoids ever pointing at ws://localhost.)
const wsHttpBase = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
export const wsUrl = `${wsHttpBase.replace(/^http/, "ws")}/ws`;
