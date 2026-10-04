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
| Navbar signed-in state | Signed-in accounts always show identity | Profile-less accounts previously saw Sign in/Create Account; now session-based branch + email fallback | Pass |
| Listing detail view | Shows subtype details + reviews per listing type | Attraction shows activity/coords + review; hotel shows stars; restaurant shows cuisine | Pass |
| Seeded listing photos | Search cards + detail gallery render real images | Local assets in /public/img/listings render; works offline; SafeImg fallback covers missing files | Pass |
| Review submission (Process 4) | Review inserted + listings.average_rating recalculated | New review published, average updated live | Pass |
| BR-011 duplicate review block | Second review by same user rejected | Red BR-011 error shown; DB unique constraint as backstop | Pass |
| Review form role accuracy | Message matches account state | Logged-out sees Sign in; profile-less admin sees explanation; profiled admin sees star form | Pass |
| Admin photo upload (Process 5) | File stored in Media/listings/<id>/ and renders on cards | Upload succeeded; file visible in Storage bucket | Pass |
| Review photo upload (Process 4) | Review carries photo_url; image renders in review card | Photo visible under review text | Pass |
| Admin gate (Secure It) | Non-admin visiting /admin sees Access Denied | End user blocked with role panel; demo admin sees manager | Pass |
| Publish listing transaction (Process 5) | listings + subtype + photos rows created; appears in /search | New listing published with uploaded photo, visible in search | Pass |
| Delete with reviews blocked | Referential integrity prevents orphaned reviews | Delete of reviewed listing refused with clear message | Pass |
| Apply submission (Process 5a) | Application row created with status pending | APP-001 visible in business_applications | Pass |
| BR-025 pending uniqueness | Second pending application blocked | Pending card replaces form; DB partial unique index as backstop | Pass |
| Admin approval (Process 5a) | Approve creates business_owners row + status approved | OWN-001 created; applicant becomes publisher | Pass |
| Owner scoped publish (BR-026) | Owner listing stamped uploaded_by = own user_id; appears in /search | New listing published and searchable | Pass |
| Owner scoping (Secure It) | Owner sees/manages only own listings | /owner shows only own rows; RLS rejects cross-access | Pass |
| Owner creates destination (BR-012/027 revised) | New DEST row + listing stamped uploaded_by | Owner-typed place appears in search under the new destination | Pass |
