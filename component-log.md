# Component Log — TravelMate

| Screen/Component | Business Process It Implements | Status |
| --- | --- | --- |
| Login Screen | Process 1 – Registration (authentication) | Connected – real Supabase auth (verified Pass) |
| Signup Screen | Process 1 – Registration | Connected – real Supabase auth (verified Pass) |
| Navbar + Footer (session-aware) | Process 1 – Registration (session state) + shared navigation | Done |
| Discover Dashboard (/) | Process 6 – Recommendation (+ Process 2 personalization, entry to Process 3; includes home recommendation feed) | Connected – live recommendations & trending |
| Search & Results (/search) | Process 3 – Search & Discovery | Connected – fuzzy search_listings RPC, type tabs, clickable cards |
| Listing Detail Page (/listing/[id]) | Process 4 – Place Description + Ratings & Reviews (view) | Connected – live listings/photos/reviews |
| Review Form (on listing detail) | Process 4 – Ratings & Reviews (submit) + BR-011 anti-fraud + average recalc | Connected – writes to reviews, recalculates average |
| Preference Onboarding / Profile | Process 2 – User Preference Selection | To build |
| Admin Listing Manager (CRUD) | Process 5 – Listing | To build |
| Trip Planner (client design) | Not a named Mission 1 process (ERD entity: trips/trip_items) | Deferred – flagged for instructor check-in |
