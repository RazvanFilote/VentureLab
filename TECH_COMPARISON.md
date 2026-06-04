# Technology Stack Comparison

## Frontend Framework — React vs Alternatives

| | React | Vue | Angular |
|---|---|---|---|
| Learning curve | Medium | Low | High |
| Flexibility | High | Medium | Low |
| Ecosystem | Huge | Medium | Medium |
| Component model | JSX + hooks | Templates | TypeScript-first |

**Why React:** Largest ecosystem, most job-market demand, hooks make state simple, works seamlessly with the rest of our stack.

---

## Language — TypeScript vs JavaScript

| | TypeScript | JavaScript |
|---|---|---|
| Type safety | Yes | No |
| Refactoring | Safe | Error-prone |
| IDE support | Excellent | Basic |
| Build step | Required | Optional |

**Why TypeScript:** Catches bugs at compile time, makes interfaces (Idea, Offer, User) self-documenting, and enforces contracts between contexts and components.

---

## Routing — React Router vs Alternatives

| | React Router | TanStack Router | Next.js |
|---|---|---|---|
| Setup | Simple | Medium | Framework-level |
| File-based routing | No | No | Yes |
| Bundle size | Small | Small | Large |
| SPA support | Yes | Yes | Partial |

**Why React Router:** Industry standard for SPAs, simple `createBrowserRouter` setup, nested routes and layout components fit our two-interface structure perfectly.

---

## State Management — React Context vs Alternatives

| | React Context | Redux | Zustand |
|---|---|---|---|
| Boilerplate | Low | High | Low |
| DevTools | Basic | Excellent | Good |
| Bundle size | 0 (built-in) | Medium | Small |
| Learning curve | Low | High | Low |

**Why React Context:** Zero dependencies, built into React, sufficient for our scale. Redux would be overkill for a prototype with 5 entities.

---

## Styling — Tailwind CSS vs Alternatives

| | Tailwind | CSS Modules | Styled Components |
|---|---|---|---|
| Speed of development | Fast | Medium | Medium |
| Bundle size | Small (purged) | Small | Medium |
| Design consistency | High | Manual | Manual |
| Learning curve | Low | Low | Medium |

**Why Tailwind:** Utility classes eliminate context-switching between files, consistent spacing/color system, purges unused styles in production.

---

## UI Components — Radix UI / shadcn vs Alternatives

| | Radix UI + shadcn | MUI | Chakra UI |
|---|---|---|---|
| Accessibility | Excellent | Good | Good |
| Customizability | Full | Limited | Medium |
| Bundle size | Small (pick what you use) | Large | Medium |
| Opinionated design | No | Yes | Yes |

**Why Radix + shadcn:** Unstyled primitives with full Tailwind control, no design lock-in, accessible by default (keyboard nav, ARIA).

---

## Testing — Vitest vs Alternatives

| | Vitest | Jest | Cypress |
|---|---|---|---|
| Speed | Very fast | Medium | Slow |
| Vite integration | Native | Manual config | N/A |
| Unit + component tests | Yes | Yes | No (E2E only) |
| Setup complexity | Low | Medium | High |

**Why Vitest:** Native Vite integration means zero config, runs the same transform pipeline as the app, significantly faster than Jest for a Vite project.
