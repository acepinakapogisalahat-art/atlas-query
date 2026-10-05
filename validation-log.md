# Validation Log — TravelMate

| Scenario | Expected | Actual | Pass/Fail/Discuss |
| --- | --- | --- | --- |
| Signup fields vs live schema | Mission 2 dictionary columns accepted | Live table uses name/password_hash/current_location/auth_user_id; inserts failed until app adapted | Discuss – app follows live schema; dictionary needs update |
| Registration sex input | All Process 1 inputs collected in UI | Sex was missing from signup UI; added pill selector storing to app_users.sex | Pass – paper compliance restored |
| New-user primary key strategy | New profile rows link cleanly to Supabase Auth | user_id varchar(20) rejects 36-char UUIDs; app writes USR-<8hex> into user_id and keeps the UUID in auth_user_id | Discuss – documented id strategy |
| Mission 3 trigger placement | Triggers fire only on intended tables | enforce_single_review_subtype attached to app_users blocked every profile insert | Fail → Fixed – dropped from app_users |
| Signup error transparency | Errors state an actionable reason | Initial generic error hid PostgREST objects; improved catch surfaces real messages | Pass – after fix |
| Email confirmation at signup | Production norm: confirm email before first login | Disabled in Supabase Auth so demo accounts can sign in instantly | Discuss – demo-mode decision; re-enable post-Go-Live |
| Browser credential autofill | Auth fields stay empty with no dropdowns | Chrome ignores autocomplete=off when credentials are saved; solved with decoy inputs, stored-credential removal, and mount cleanup | Discuss – browser-level behavior, documented |
| "Now Boarding" naming | Section names read clearly | Label implied flight departure; renamed to "Top picks for you" with match chips | Pass – copy clarity |
| "Updated hourly" claim | Copy matches system behavior | Trending recomputes per page load; inaccurate label replaced with honest helper text | Pass – honest copy |
| App works in any browser | Identical behavior everywhere | Brave Shields blocked Supabase ("Failed to fetch"); Chrome works | Discuss – demo + docs will specify Chrome |
| 5-day weather outlook | Live telemetry per Mission 1 Challenge #3 | Static demo feed (no weather table exists); labeled "Sample data" | Discuss – placeholder until external feed integrated post-Go-Live |
| Activity/Budget chips | Filter results by activity/budget | Visual selection only – listings has no activity/budget column | Discuss – wire chips via attractions join next sprint |
| Who uploads listing photos | Owners/admins upload their own assets (Process 5) | Seeded rows use local stand-in assets; real uploads flow through Media bucket prefixes | Discuss – stand-ins until curated |
| Business-owner self-service | Owners post their own listings | Originally admin-only curation; revised: Process 5a application/approval, business_owners role, scoped /owner dashboard (BR-026) | Pass – implemented as paper revision |
| Marketplace onboarding latency | Owners publish immediately after signup | Approval queue introduces review delay (Process 5a) | Discuss – trust vs speed; auto-approve tier possible post-Go-Live |
| Server-side ID generation | Client computes next primary keys | RLS hides other rows from applicants; security-definer rpcs new_application_id / new_owner_id generate IDs | Discuss – pattern reused for future queues |
| Destination creation rights | Owners might add new places | BR-027 revised: approved owners (vetted via Process 5a) may create destinations; travelers cannot; rename/delete stays admin-only | Discuss – vetted-publisher model |
| Listing photos source | Real photos render reliably | Third-party placeholder service unreachable from campus network; switched to local assets in /public/img/listings | Pass – works offline |
| 4-tile photo gallery | Design shows 4 tiles | DB seeds 1 photo per listing (BR-019 permits many) | Discuss – hero cover until upload flow adds more |
| New-user recommendation cold start | Personalized picks for every logged-in user | Brand-new users have no recommendations rows; engine falls back to global top-4 | Discuss – cold-start strategy until search_logs accumulate |
| Admin writing reviews | Signed-in users can review | Demo admin existed only in administrators; review flow requires app_users profile | Fixed – dual-role profile row (USR-ADM001) + accurate per-state messaging |
| Storage bucket strategy | Dedicated listing-photos bucket | Bucket never created → "bucket not found"; consolidated into public Media bucket with listings/ + reviews/ prefixes | Discuss – single bucket governance |
| Review photos schema | reviews table stores a photo reference | Mission 2/3 schema had no photo column; added photo_url text | Discuss – dictionary needs update |
| Trip Planner in client design | Every screen maps to a named Mission 1 process | trips/trip_items are ERD entities with no named process in Mission 1 | Discuss – deferred stretch screen, instructor check-in |
