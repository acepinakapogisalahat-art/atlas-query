# Component Log — TravelMate

| Screen/Component | Business Process It Implements | Status |
| --- | --- | --- |
| Login Screen | Process 1 – Registration (authentication) | Connected – real Supabase auth; redesigned split-screen; manual entry only (verified Pass) |
| Signup Screen | Process 1 – Registration | Connected – all dictionary inputs incl. Sex; profile row creation; no autocomplete (verified Pass) |
| AuthShell (split-screen auth layout) | Process 1 – Registration (presentation) | Done – brand panel + form card, shared by login/signup |
| Navbar + Footer (session & role aware) | Process 1 – Registration (session state) + role-based navigation (Secure It) | Connected – refined identity cluster (icon logout, profile link), session-aware footer columns |
| Discover Dashboard (/) | Process 6 – Recommendation + Process 3 (Explore rail) + Mission 1 Challenge 3 (live weather) | Connected – "Top picks" (card grid), Explore rail (type pills), live Open-Meteo forecast, trending, quick actions, Recent searches chips |
| Search & Results (/search) | Process 3 – Search & Discovery (+ Process 3 output logging) | Connected – fuzzy search_listings RPC, type tabs, clickable cards, logSearch wired to search_logs |
| Listing Detail Page (/listing/[id]) | Process 4 – Place Description + Ratings & Reviews (view) | Connected – live listings/photos/reviews |
| Review Form (on listing detail) | Process 4 – Ratings & Reviews (submit) + BR-011 anti-fraud + average recalc + review photos | Connected – writes reviews, uploads to Media/reviews |
| Admin Listing Manager (/admin) | Process 5 – Listing (CRUD, photo upload, destination creator) | Connected – role-gated, Storage uploads |
| Owner Applications Queue (/admin/applications) | Process 5a – Business Owner Application & Approval (review side) | Connected – approve creates business_owners row |
| Apply Page (/apply) | Process 5a – Business Owner Application (submit side) | Connected – per-state cards, BR-025 enforced |
| Owner Dashboard (/owner) | Process 5 – Listing, scoped (BR-026 owner-only management) | Connected – new-place-first flow, uploaded_by stamp |
| Profile & Preferences (/profile) | Process 2 – User Preference Selection + Process 1 profile management + trips view (ERD) | Connected – edit profile, save preferences, upcoming/completed trips |
| 404 + Loading states (app-level) | Cross-cutting UX resilience | Connected – branded not-found.tsx + loading.tsx |
| Trip Planner (client design) | Not a named Mission 1 process (ERD entity: trips/trip_items) | Deferred – full builder deferred; trips now viewable in /profile |
