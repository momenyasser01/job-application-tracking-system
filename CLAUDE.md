# Code Quality Guidelines

Write code that is simple, readable, and easy to maintain months later.

- Prefer clarity over cleverness and unnecessary abstraction.
- Keep functions, modules, and files small and focused.
- Use clear, descriptive names and consistent structure.
- Follow DRY, SOLID, and separation of concerns when they genuinely improve the design; do not over-engineer.
- Minimize coupling and keep dependencies flowing in obvious directions.
- Make code easy to modify, remove, test, and extend.
- Avoid duplication, magic values, deeply nested logic, and premature abstractions.
- Handle errors and edge cases explicitly.
- Add comments only when they explain why, not what the code already makes obvious.
- Before finishing a task, review the implementation as if you will maintain it 10 months from now.
- Prefer the simplest design that solves the current problem without unnecessarily limiting future changes.

# Project Architecture

- Use TypeScript strict mode.
- Keep business logic out of controllers.
- Controllers handle HTTP concerns only.
- Services contain business logic.
- Database access goes through repositories.
- Validate external input at the application boundary.
- Never expose database models directly through API responses.

**Frontend Guidelines — Next.js + Tailwind CSS**

### Architecture

- Prefer **Server Components by default**. Use `"use client"` only when interactivity, browser APIs, or client-side state genuinely require it.
- Keep business logic out of UI components. Extract reusable logic into hooks, utilities, or services when appropriate.
- Keep components focused and composable; avoid large components that handle unrelated responsibilities.
- Organize files by feature/domain when the project grows rather than creating giant global component folders.
- Keep data fetching close to the component/route that owns the data, while avoiding duplicated requests.
- Prefer simple solutions over introducing additional libraries or abstractions.

### Components

- Build reusable components around **meaningful UI patterns**, not every small `<div>` or element.
- Before creating a new component, check whether an existing component can be reused or extended.
- Avoid components with excessive configuration props. If a component becomes difficult to understand, reconsider its responsibilities.
- Keep component APIs predictable and easy to understand.
- Prefer composition over deeply nested conditional props and variants.
- Don't create abstractions until there is a real reuse case.

### Tailwind CSS

- Use Tailwind utility classes consistently rather than writing custom CSS unnecessarily.
- Avoid excessive arbitrary values such as `mt-[13px]` when an existing design-system value is sufficient.
- Don't repeat large blocks of identical Tailwind classes; extract a component or reusable styling pattern when repetition becomes meaningful.
- Keep spacing, typography, colors, borders, shadows, and responsive behavior consistent with the existing design.
- Before introducing a new color, spacing value, or visual pattern, check whether an existing design token already fits.
- Avoid using Tailwind classes as a substitute for good component structure.

### Styling & UI

- Prioritize **consistency over novelty**. Match the existing application's visual language.
- Build responsive layouts from the beginning rather than patching mobile support afterward.
- Prefer accessible HTML elements (`button`, `nav`, `form`, `label`, etc.) over generic `<div>` elements.
- Interactive elements must have visible focus states and appropriate disabled/loading states.
- Don't rely solely on color to communicate state.
- Use semantic HTML and accessible labels for inputs and controls.
- Handle loading, empty, error, and success states intentionally rather than leaving them as afterthoughts.

### State & Data

- Keep state as local as possible. Don't put state in global stores unless multiple unrelated parts of the application genuinely need it.
- Don't duplicate server state in client state without a clear reason.
- Prefer URL/search parameters for state that should be shareable or bookmarkable.
- Avoid unnecessary `useEffect`. Prefer derived values, event handlers, Server Components, or framework features when they solve the problem more directly.
- Don't fetch data on the client when the same result can reasonably be fetched on the server.

### Performance

- Avoid unnecessary client-side JavaScript.
- Prefer Server Components and server-side data fetching where appropriate.
- Optimize images using Next.js image capabilities.
- Avoid unnecessary re-renders and expensive computations, but don't introduce memoization without a reason.
- Lazy-load genuinely heavy components when it provides a meaningful benefit.
- Don't optimize prematurely; measure or identify a real bottleneck first.

### Code Quality

- Use TypeScript strictly. Avoid `any` unless there is a documented and unavoidable reason.
- Prefer explicit, meaningful types over complicated generic abstractions.
- Keep JSX readable. Extract complex sections rather than creating deeply nested JSX.
- Avoid deeply nested conditional rendering; use clear early returns or small components.
- Don't put large amounts of business logic directly inside JSX.
- Remove dead code, unused imports, obsolete components, and stale comments when modifying an area.
- When changing existing code, preserve established conventions unless there is a good reason to improve them.

### Before Finishing

Review the implementation and ask:

1. Is this the simplest solution that fits the existing architecture?
2. Did I unnecessarily introduce a Client Component?
3. Could an existing component or utility be reused?
4. Is the Tailwind styling consistent with the rest of the application?
5. Does it work on mobile and desktop?
6. Are loading, error, empty, and disabled states handled?
7. Is the implementation accessible?
8. Did I introduce unnecessary state, effects, dependencies, or abstractions?
9. Would another developer understand and safely modify this code 10 months from now?
10. Did I leave behind any duplication, dead code, or unnecessary complexity?
