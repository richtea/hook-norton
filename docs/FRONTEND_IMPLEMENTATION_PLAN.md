# Faque Frontend Implementation Plan

## Technology Stack

- **UI Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Data Fetching**: TanStack Query v5 (react-query)
- **URL State**: nuqs
- **State Management**: React Context (theme) + Zustand (optional)
- **Code Editing**: Prism or Monaco for JSON syntax highlighting
- **Build**: Vite
- **Environment**: `process.env.FAQUE_HTTPS || process.env.FAQUE_HTTP`

## Project Structure

```text
src/
├── api/
│   ├── client.ts           # Axios/fetch client with base URL setup
│   ├── hooks.ts            # TanStack Query hooks (useRoutes, useRequests, etc.)
│   └── types.ts            # API response types
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx    # Main layout with sidebar
│   │   ├── Sidebar.tsx
│   │   └── ThemeToggle.tsx
│   ├── routes/
│   │   ├── RoutesList.tsx   # Left pane - list with filters
│   │   ├── RouteDetails.tsx # Right pane - details/edit
│   │   ├── RouteForm.tsx    # Create/edit form
│   │   ├── HeadersTable.tsx # Headers editor
│   │   └── ResponseEditor.tsx # JSON syntax highlighter
│   ├── requests/
│   │   ├── RequestsList.tsx     # History list with filters
│   │   ├── RequestDetails.tsx   # Side panel with full details
│   │   ├── RequestFilters.tsx   # Filter controls
│   │   └── RequestBody.tsx      # Formatted body display
│   └── common/
│       ├── ConfirmDialog.tsx
│       ├── ErrorAlert.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useApi.ts           # Custom hook abstractions
│   └── useLocalStorage.ts  # Persistence for preferences
├── context/
│   └── ThemeContext.tsx    # Dark/light + purple theme
├── pages/
│   ├── RoutesPage.tsx      # Routes management (split pane)
│   ├── RequestsPage.tsx    # Request history
│   └── RouteFormPage.tsx   # New route form
├── types/
│   └── index.ts            # All TypeScript types
├── lib/
│   ├── utils.ts            # Helper functions
│   ├── constants.ts        # Magic strings, endpoints
│   └── testIds.ts          # Centralized test IDs
├── App.tsx
├── App.css
└── main.tsx
```

## Core Features & Page Layouts

### 1. Routes Management Page (Split Pane)

**Left Pane:**

- Filter controls: HTTP method dropdown, search box for path pattern
- Routes list (table or card view)
- "New Route" button (top)
- Multi-select checkboxes for bulk deletion
- Refresh button + auto-refresh indicator (30s)
- Clear all routes button (with confirmation)

**Right Pane (when route selected):**

- Route details view
- Edit/Delete buttons (inline)
- Live preview of response

**Route Form (Modal or separate page):**

- Method dropdown (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Path pattern input with validation
- Response status code input (100-599)
- Headers table editor (add/remove rows)
- Response body editor with JSON syntax highlighting
- Enabled checkbox
- Save/Cancel buttons

### 2. Request History Page

**Top Section:**

- Filter controls: method dropdown, path search, date range picker
- Refresh button + auto-refresh indicator (30s)
- Clear all requests button (with confirmation)

**Main List:**

- Timestamp, Method, Path, Query String, Body Excerpt
- Click to view full details in right side panel
- Sortable columns (by timestamp, method, path)

**Right Side Panel (when request selected):**

- Full request details: method, path, query, headers, body
- Body rendered as formatted JSON if applicable
- Copy-to-clipboard button for headers/body
- Request ID visible for debugging

## API Integration with TanStack Query

```typescript
// Custom hooks for data fetching
useRoutes(options?)           // Auto-poll, cacheable
useRoute(method, path)        // Get specific route
useCreateRoute()              // POST/PUT mutation
useUpdateRoute()              // PUT mutation
useDeleteRoute()              // DELETE mutation
useDeleteAllRoutes()          // DELETE all mutation
useRequests(options?)         // Auto-poll with filters
useRequest(id)                // Get specific request
useClearRequests()            // DELETE mutation
useHealth()                   // Health check
```

**Auto-polling Strategy:**

- `useRoutes` and `useRequests` queries set `refetchInterval: 30000`
- User-triggered refresh button uses `refetch()` for immediate update
- Show "Last updated X seconds ago" indicator
- Show loading state during refetch (subtle, non-blocking)

**Polling params via nuqs:**

```typescript
useQueryState('method', parseAsString)        // Routes filters
useQueryState('pathSearch', parseAsString)
useQueryState('selectedRouteId', parseAsString)
useQueryState('requestSearch', parseAsString)  // Requests filters
useQueryState('selectedRequestId', parseAsString)
```

## Theme System (Purple + Dark/Light Toggle)

**Context Provider** with:

- Current theme: 'light' | 'dark'
- Primary color: purple (customizable shades)
- Toggle function
- Persist to localStorage

**Color Palette:**

- Purple accent: `#a855f7` (standard), `#c084fc` (hover)
- Dark bg: `#0f172a`
- Light bg: `#ffffff`
- Borders/separators: subtle grays

## Testing & Accessibility

**DOM IDs** (centralized in `lib/testIds.ts`):

```typescript
// Routes page
routes-page
routes-list
route-list-item-{method}-{path}
route-method-filter
route-path-search
route-new-button
route-details-panel
route-delete-button-{method}-{path}
route-edit-button-{method}-{path}
routes-clear-all-button
routes-refresh-button

// Route form
route-form-page
route-form-method-input
route-form-path-input
route-form-status-code-input
route-form-headers-table
route-form-body-editor
route-form-enabled-checkbox
route-form-submit-button
route-form-cancel-button

// Requests page
requests-page
requests-list
request-list-item-{id}
request-method-filter
request-path-search
request-date-range-picker
request-details-panel
requests-clear-all-button
requests-refresh-button

// Common
theme-toggle-button
loading-spinner
error-alert
confirm-dialog-confirm-button
confirm-dialog-cancel-button
```

**Accessibility:**

- All interactive elements have `aria-label` or visible labels
- Color contrast ratios meet WCAG AA standard
- Keyboard navigation support (Tab, Enter, Escape)
- Semantic HTML (`<button>`, `<table>`, `<form>`)
- Loading states announced to screen readers

## Implementation Phases

### Phase 1: Foundation

1. Setup Tailwind + shadcn/ui
2. Install dependencies (TanStack Query, nuqs, Zustand, JSON editor)
3. Generate shadcn/ui components: Button, Input, Card, Dialog, Table, Select, Badge, Tabs, Pagination
4. Create theme context + toggle component
5. Setup API client + base URL configuration

### Phase 2: Routes Management

6. Create API hooks with TanStack Query
2. Build RoutesList (left pane) with filters
3. Build RouteDetails (right pane)
4. Build RouteForm (modal/page)
5. Implement split-pane layout
6. Wire up CRUD operations

### Phase 3: Request History

12. Build RequestsList with filters + search
2. Build RequestDetails panel
3. Implement auto-polling for both pages
4. Add request body formatting (JSON viewer)

### Phase 4: Polish & UX

16. Add confirmation dialogs (delete, clear all)
2. Error handling + error boundaries
3. Loading states + skeleton loaders
4. Refresh indicators + last-updated timestamps
5. Multi-select deletion for routes
6. Keyboard shortcuts (optional)

### Phase 5: Testing & Deployment

22. Add all test IDs
2. Verify accessibility compliance
3. Desktop-only responsive design
4. Build static assets for container

## Key Implementation Notes

1. **API Base URL**: Read from `process.env.FAQUE_HTTPS || process.env.FAQUE_HTTP` at runtime
2. **CORS**: Backend may need CORS headers; frontend should handle gracefully
3. **Error Handling**: Use shadcn/ui Alert component, show RFC 9457 error details
4. **JSON Editor**: Use Prism or Monaco for syntax highlighting with copy/format buttons
5. **Headers Table**: Use shadcn/ui Table with add/remove row functionality
6. **Multi-select Routes**: Add checkboxes with "Select All" in header, bulk delete with confirmation
7. **Date Range Filtering**: For requests, filter by timestamp range (e.g., last 1hr, 24hr, custom)
8. **Body Truncation**: Display full body for requests; handle large JSON gracefully
9. **Query Params**: Use nuqs to persist filters, selected items, and form state to URL
10. **Cache Strategy**: Stale queries for 30s (matches polling interval), background refetch
