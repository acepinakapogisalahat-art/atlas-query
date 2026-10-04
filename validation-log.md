# Validation Log — TravelMate

| Scenario | Expected | Actual | Pass/Fail/Discuss |
| --- | --- | --- | --- |
| Signup fields vs live schema | Mission 2 dictionary columns accepted | Live table uses name/password_hash/current_location/auth_user_id; inserts failed until app adapted | Discuss – app follows live schema; dictionary needs update |
| New-user primary key strategy | New profile rows link cleanly to Supabase Auth | user_id varchar(20) rejects 36-char UUIDs; app writes USR-<8hex> into user_id and keeps the UUID in auth_user_id | Discuss – documented id strategy |
| Mission 3 trigger placement | Triggers fire only on intended tables | enforce_single_review_subtype (trigger "user") attached to app_users read NEW.review_id and blocked every profile insert | Fail → Fixed – dropped from app_users |
| Signup error transparency | Errors state an actionable reason | Initial generic "Unexpected error" hid PostgREST objects; improved catch surfaces real messages (column mismatch, trigger fault) | Pass – after fix |
| Email confirmation at signup | Production norm: confirm email before first login | Disabled in Supabase Auth so demo accounts can sign in instantly | Discuss – demo-mode decision; re-enable post-Go-Live |
| App works in any browser | Identical behavior everywhere | Brave Shields blocked Supabase ("Failed to fetch"); Chrome works | Discuss – demo + docs will specify Chrome |
| 5-day weather outlook | Live telemetry per Mission 1 Challenge #3 | Static demo feed (no weather table exists) | Discuss – placeholder until external feed integrated post-Go-Live |
| Activity/Budget chips | Filter results by activity/budget | Visual selection only – listings has no activity/budget column (budget lives in user_preferences, activity in attractions.activity_name) | Discuss – wire chips via attractions join next sprint |
| Who uploads listing photos | Owners/admins upload their own assets (Process 5) | Seeded rows repointed to stock CC photos; owner-upload pipeline = Supabase Storage bucket Media with listings/ + reviews/ prefixes | Discuss – stock URLs are demo stand-ins until real uploads |
| Business-owner self-service | Owners post their own listings | Originally admin-only curation; paper + schema revised: Process 5a application/approval, business_owners role, scoped /owner dashboard (BR-026) | Pass – implemented as paper revision |
| Marketplace onboarding latency | Owners publish immediately after signup | Approval queue introduces review delay (Process 5a) | Discuss – trust vs speed; auto-approve tier possible post-Go-Live |
| Server-side ID generation | Client computes next primary keys | RLS hides other rows from applicants; security-definer rpcs new_application_id / new_owner_id generate IDs | Discuss – pattern reused for future queues |
| Destination creation rights | Owners might add new places | BR-027 revised: approved owners (vetted via Process 5a) may create destinations; travelers cannot; rename/delete stays admin-only | Discuss – vetted-publisher model |
| Listing photos source | Real photos render reliably | Third-party placeholder service unreachable from campus network; switched to local assets in /public/img/listings (original Mission 3 seed paths now resolve) | Pass – works offline |
| 4-tile photo gallery | Design shows 4 tiles | DB seeds 1 photo per listing (BR-019 permits many) | Discuss – hero cover until admin upload flow adds more |
| New-user recommendation cold start | Personalized picks for every logged-in user | Brand-new users have no recommendations rows; engine falls back to global top-4 | Discuss – cold-start strategy until search_logs accumulate |
| Admin writing reviews | Signed-in users can review | Demo admin existed only in administrators; review flow requires app_users profile, so form showed a misleading "Sign in" message | Fixed – dual-role profile row (USR-ADM001) + accurate per-state messaging |
| Storage bucket strategy | Dedicated listing-photos bucket | Bucket never created → "bucket not found"; consolidated into existing public Media bucket with prefix folders listings/ + reviews/, policies scoped by prefix | Discuss – single bucket governance |
| Review photos schema | reviews table stores a photo reference | Mission 2/3 schema had no photo column; added photo_url text | Discuss – dictionary needs update |
| Trip Planner in client design | Every screen maps to a named Mission 1 process | trips/trip_items are ERD entities with no named process in Mission 1 | Discuss – deferred stretch screen, instructor check-in |
