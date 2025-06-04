# Next.js Frontend Conventions

This document outlines key conventions and best practices for developing the Next.js frontend application for MTK Care.

## 1. Component Architecture: App Router (Server & Client Components)

The project uses the Next.js App Router. Understanding and correctly utilizing Server Components and Client Components is crucial.

### Guiding Principles:

*   **Default to Server Components:** Components should be Server Components by default unless they explicitly require client-side interactivity (hooks like `useState`, `useEffect`, `useContext`, browser-only APIs, event listeners).
*   **Minimize Client Component Size:** Keep Client Components small and focused. Push client-side logic as far down the component tree as possible (towards the leaves).
*   **Data Fetching in Server Components:** Perform data fetching primarily in Server Components. Pass data as props to Client Components if they need it.
*   **Server Actions for Mutations:** Use Server Actions for form submissions and data mutations to avoid creating API route handlers for these purposes where possible.
*   **Interactivity:** Use Client Components for UI that requires immediate feedback or relies on browser events.

### Specific Component Types:

*   **Layouts (`layout.tsx`):** Can be Server Components. They wrap `children` and can fetch data.
*   **Pages (`page.tsx`):** Can be Server Components. Ideal for fetching initial page data.
*   **Reusable UI Primitives (e.g., ShadCN components):** Many are Client Components due to internal state or event handling. Wrap them or use them within your own Client Components if interactivity is needed, or pass server-fetched data to them if they are display-only.
*   **Context Providers:** Components that provide React Context using `createContext` and manage state for that context must be Client Components and should wrap only the parts of the tree that need access to that context.

### Identifying Component Types:

*   **Server Component:** Standard React component. Does not use `'use client'` directive.
*   **Client Component:** Must have the `'use client'` directive at the top of the file.

## 2. Data Fetching

*   **Server Components:** Use `async/await` directly within Server Components for data fetching. Next.js extends `fetch` for automatic request deduping, caching, and revalidating.
*   **Client Components:** If data fetching *must* occur on the client (e.g., polling, data dependent on client-side interaction not suitable for Server Actions), use libraries like SWR or React Query, or `useEffect` with `fetch`. Prefer fetching data in a Server Component parent and passing it down.
*   **Route Handlers (API Routes):** Use for specific API endpoints that need to be called from the client (e.g., for SWR/React Query) or by third-party services. For internal data needs, prefer direct data fetching in Server Components or Server Actions.

## 3. State Management

*   **Server Components:** Are stateless regarding React state (`useState`).
*   **Client Components:** Use React hooks (`useState`, `useReducer`) for local component state.
*   **Shared Client-Side State:** For state shared across multiple Client Components, use React Context or consider libraries like Zustand or Jotai if complexity warrants. Keep the scope of shared state minimal.
*   **URL State:** Utilize URL query parameters or path segments for state that should be bookmarkable or shareable.

## 4. Styling

*   **Tailwind CSS:** Primary styling solution.
*   **ShadCN UI:** Pre-built components styled with Tailwind CSS.
*   **CSS Modules:** Can be used for component-scoped CSS if needed, but prefer Tailwind utility classes.

## 5. Authentication & Authorization

*   **NextAuth.js:** Used for authentication.
*   **`getServerSession`:** Use in Server Components and Route Handlers to access session data.
*   **`useSession` Hook:** Use in Client Components for session data and status.
*   **Middleware (`middleware.ts`):** For protecting routes and redirecting unauthenticated users.
*   **`SessionProvider`:** Must wrap the application (typically in the root `layout.tsx`) and is a Client Component.

## 6. Error Handling & Loading States

*   **`error.tsx`:** Create `error.tsx` files within route segments to define UI boundaries for runtime errors. These are Client Components.
*   **`loading.tsx`:** Create `loading.tsx` files to show instant loading UI using React Suspense while Server Components in a segment are fetching data.
*   **`notFound()` function:** Use in Server Components to render the nearest `not-found.tsx` file or a default Next.js 404 page.

## 7. Code Organization

*   **`app/` directory:** Core of the App Router.
*   **`components/` directory:** For reusable UI components.
    *   `components/ui/`: For ShadCN UI components.
    *   `components/shared/` or `components/feature/`: For custom reusable components.
*   **`lib/` directory:** For utility functions, constants, etc.
*   **`hooks/` directory:** For custom React hooks.
*   **`docs/` directory:** For project documentation like this file.

---
*This document is a living guide and will be updated as the project evolves.*
