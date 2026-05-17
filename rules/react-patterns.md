# React Patterns & Best Practices

## Component Architecture
- Use functional components exclusively; never class components
- One component per file; file name matches component name (PascalCase)
- Keep components under 200 lines; extract sub-components when exceeding
- Separate container (logic) and presentational (UI) concerns

## Hooks Rules
- Never call hooks inside loops, conditions, or nested functions
- Custom hooks must start with `use` prefix (e.g., `useAuth`, `useFetch`)
- Extract repeated stateful logic into custom hooks
- Prefer `useReducer` over `useState` when state transitions are complex (3+ related states)
- Always provide dependency arrays for `useEffect`, `useMemo`, `useCallback`
- Clean up side effects in `useEffect` return function

## State Management
- Local state: `useState` / `useReducer` for component-scoped data
- Shared state: React Context + `useReducer` for app-wide data (auth, theme, notifications)
- External state: Zustand when Context becomes unwieldy (5+ consumers or frequent updates)
- Never store derived data in state — compute it during render
- Lift state to the lowest common ancestor, not higher

## Props & Types
- Define prop types with TypeScript interfaces, not inline types
- Use `interface` for component props, `type` for unions and utilities
- Destructure props in function signature: `function Card({ title, children }: CardProps)`
- Default values via destructuring, not `defaultProps`
- Avoid prop drilling beyond 2 levels — use Context or composition

## Event Handling
- Name handlers: `handleClick`, `handleSubmit`, `handleInputChange`
- Name callback props: `onClick`, `onSubmit`, `onChange` (mirror DOM convention)
- Wrap expensive handlers in `useCallback` only when passed to memoized children

## Performance
- Use `React.memo` only for components that re-render with unchanged props frequently
- Use `useMemo` for expensive computations, not all computations
- Lazy load routes and heavy components with `React.lazy` + `Suspense`
- Avoid anonymous functions in JSX for frequently re-rendered lists
- Use `key` prop correctly: stable IDs, never array index for dynamic lists

## File Structure (Vite + React)
```
src/
├── components/       # Reusable UI components
│   ├── Button.tsx
│   └── Card.tsx
├── pages/            # Route-level components
├── hooks/            # Custom hooks
├── contexts/         # React Context providers
├── utils/            # Pure utility functions
├── types/            # Shared TypeScript types
├── assets/           # Static assets (images, fonts)
├── styles/           # Global CSS, design tokens
│   └── index.css     # Design system variables
├── App.tsx           # Root component with routes
└── main.tsx          # Entry point
```

## Naming Conventions
- Components: `PascalCase.tsx` — `UserProfile.tsx`
- Hooks: `camelCase.ts` with `use` prefix — `useLocalStorage.ts`
- Utils: `camelCase.ts` — `formatDate.ts`
- Types: `PascalCase` — `interface UserData {}`
- CSS classes: `kebab-case` — `.user-profile-card`
- Constants: `UPPER_SNAKE_CASE` — `const MAX_RETRIES = 3`

## Anti-Patterns
- ❌ Never mutate state directly — always use setter functions
- ❌ Never use `useEffect` for derived state — compute during render
- ❌ Never fetch in `useEffect` without cleanup / abort controller
- ❌ Never use string refs — always `useRef`
- ❌ Never suppress TypeScript errors with `@ts-ignore` — fix the type
- ❌ Never use `any` type — use `unknown` and narrow
