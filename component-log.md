# Component Log — TravelMate

| Screen/Component | Business Process It Implements | Status |
| --- | --- | --- |
| Login Screen | Process 1 – Registration (authentication) | Connected – real Supabase auth (verified Pass) |
| Signup Screen | Process 1 – Registration | Connected – real Supabase auth (verified Pass) |
| Navbar + Footer (session & role aware) | Process 1 – Registration (session state) + role-based navigation (Secure It) | Connected – useRole-driven links (Admin / Applications / My Listings / Become a publisher) |
| Discover Dashboard (/) | Process 6 – Recommendation (+ Process 2 personalization, entry to Process 3) | Connected – live recommendations & trending |
| Search & Results (/search) | Process 3 – Search & Discovery | Connected – fuzzy search_listings RPC, type tabs, clickable cards |
| Listing Detail Page (/listing/[id]) | Process 4 – Place Description + Ratings & Reviews (view) | Connected – live listings/photos/reviews |
| Review Form (on listing detail) | Process 4 – Ratings & Reviews (submit) + BR-011 anti-fraud + average recalc + review photos | Connected – writes reviews, uploads to Media/reviews |
| Admin Listing Manager (/admin) | Process 5 – Listing (CRUD, photo upload, destination creator) | Connected – role-gated, Storage uploads |
| Owner Applications Queue (/admin/applications) | Process 5a – Business Owner Application & Approval (review side) | Connected – approve creates business_owners row |
| Apply Page (/apply) | Process 5a – Business Owner Application (submit side) | Connected – per-state cards, BR-025 enforced |
| Owner Dashboard (/owner) | Process 5 – Listing, scoped (BR-026 owner-only management) | Connected – publishes with uploaded_by stamp |
| Preference Onboarding / Profile | Process 2 – User Preference Selection | To build |
| Trip Planner (client design) | Not a named Mission 1 process (ERD entity: trips/trip_items) | Deferred – flagged for instructor check-in |
