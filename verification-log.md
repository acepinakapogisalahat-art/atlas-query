# Verification Log — TravelMate

| Feature | Expected | Actual | Pass/Fail |
| --- | --- | --- | --- |
| Signup (Process 1) | Auth user created + `app_users` profile row with matching `auth_user_id` | New user visible in Supabase Auth AND `app_users` table | Pass |
| Login, valid credentials | Session starts, redirect to home | Redirects to `/` cleanly | Pass |
| Login, wrong password | Error shown, no redirect | Red error box, stays on `/login` | Pass |
| Signup, duplicate email | Clear rejection, no duplicate row | "User already registered" shown | Pass |
| Home "Now Boarding" table | Top recommendations with match % from live recommendations table | 4 rows rendered with scores 99%→90% | Pass |
| Home search handoff | Routes to /search?q=... and filters listings | "Kyoto" returns Kyoto listings | Pass |
| Fuzzy search (Process 3) | Typo-tolerant keyword matching incl. country names | "jaan" returns Japan listings via pg_trgm similarity | Pass |
| Search cards clickable | Card click opens Listing Detail | Navigates to /listing/<id> | Pass |
| Search type tabs | All/Attractions/Hotels/Restaurants filter results | Tabs filter the 40 live listings correctly | Pass |
| Navbar auth state | Login/Signup when logged out; name + Log out when logged in | Correct on / and /search; hidden on /login and /signup | Pass |
| Listing detail view | Shows subtype details + reviews per listing type | Attraction shows activity/coords + review; hotel shows stars; restaurant shows cuisine | Pass |
| Seeded listing photos | Search cards + detail gallery render real images | Local assets in /public/img/listings render; works offline; SafeImg fallback covers missing files | Pass |
| Review submission (Process 4) | Review inserted + listings.average_rating recalculated | New review published, average updated live | Pass |
| BR-011 duplicate review block | Second review by same user rejected | Red BR-011 error shown; DB unique constraint as backstop | Pass |
