# Verification Log — TravelMate

| Feature | Expected | Actual | Pass/Fail |
| --- | --- | --- | --- |
| Signup (Process 1) | Auth user created + `app_users` profile row with matching `auth_user_id` | New user visible in Supabase Auth AND `app_users` table | Pass |
| Signup sex field (Process 1 / dictionary) | Sex collected and stored per Mission 2 APP_USERS | Pill selector value stored in `app_users.sex` (varchar 10 safe) | Pass |
| Signup, duplicate email | Clear rejection, no duplicate row | "That email is already registered — try signing in instead." | Pass |
| Signup, short password | Rejection, no account created | Red error at <6 characters | Pass |
| Login, valid credentials | Session starts, redirect to home | Redirects to `/` cleanly | Pass |
| Login, wrong password | Error shown, no redirect | Red "Email or password is incorrect." | Pass |
| Login, forgot password | Reset email triggered with feedback | Green notice after submitting email | Pass |
| Auth fields empty on load | No pre-filled text after refresh/logout | Mount cleanup wipes injected values on /login and /signup | Pass |
| Auth autocomplete suppression | No dropdowns or suggestions on any auth field | Decoy inputs + removed stored credentials + autoComplete=off | Pass |
| Home "Top picks for you" | Top recommendations with match % from live recommendations table | 2x2 card grid with progress bars, Excellent/Good match chips, and reason text | Pass |
| Top picks clickable | Row click opens the Listing Detail | Navigates to /listing/<id> | Pass |
| Dashboard explore rail (Process 3) | Live listings browse with type pills for every user | Rail renders all listings; pills filter; cards open detail; new accounts see it first | Pass |
| Trending destinations | Highest average listing rating per destination, top 4 | Full-width cards render rated destinations; click searches that destination | Pass |
| 5-day forecast | Clearly labeled sample, no dev notes | "Sample data" tag + post-launch footnote | Pass |
| Home search handoff | Routes to /search?q=... and filters listings | "Kyoto" returns Kyoto listings | Pass |
| Fuzzy search (Process 3) | Typo-tolerant keyword matching incl. country names | "jaan" returns Japan listings via pg_trgm similarity | Pass |
| Search cards clickable | Card click opens Listing Detail | Navigates to /listing/<id> | Pass |
| Search type tabs | All/Attractions/Hotels/Restaurants filter results | Tabs filter the live listings correctly | Pass |
| Navbar auth state | Login/Signup when logged out; identity + Log out when logged in | Correct on / and /search; hidden on /login and /signup | Pass |
| Navbar signed-in identity | Signed-in accounts always show identity | Session-based branch with email fallback for profile-less accounts; refined icon logout | Pass |
| Navbar role links | Role-appropriate links only | Admin/Applications for admins; My Listings for owners; Become a publisher for travelers | Pass |
| Listing detail view | Shows subtype details + reviews per listing type | Attraction shows activity/coords; hotel shows stars; restaurant shows cuisine | Pass |
| Seeded listing photos | Search cards + detail gallery render real images | Local assets in /public/img/listings render; works offline | Pass |
| Review submission (Process 4) | Review inserted + listings.average_rating recalculated | New review published, average updated live | Pass |
| BR-011 duplicate review block | Second review by same user rejected | Red BR-011 error; DB unique constraint as backstop | Pass |
| Review form role accuracy | Message matches account state | Logged-out / profile-less / profiled states each show correct card | Pass |
| Review photo upload (Process 4) | Review carries photo_url; image renders in review card | Photo stored in Media/reviews and visible under review text | Pass |
| Admin gate (Secure It) | Non-admin visiting /admin sees Access Denied | End user blocked with role panel; demo admin sees manager | Pass |
| Admin publish transaction (Process 5) | listings + subtype + photos rows created; appears in /search | Listing published with uploaded photo, visible in search | Pass |
| Admin photo upload (Process 5) | File stored in Media/listings/<id>/ and renders on cards | Upload succeeded; file visible in Storage bucket | Pass |
| Delete with reviews blocked | Referential integrity prevents orphaned reviews | Delete of reviewed listing refused with clear message | Pass |
| Apply submission (Process 5a) | Application row created with status pending | APP-001 visible in business_applications | Pass |
| BR-025 pending uniqueness | Second pending application blocked | Pending card replaces form; DB partial unique index backstop | Pass |
| Admin approval (Process 5a) | Approve creates business_owners row + status approved | OWN-001 created; applicant becomes publisher | Pass |
| Owner scoped publish (BR-026) | Owner listing stamped uploaded_by = own user_id; appears in /search | Owner-published listing searchable; ownership stamped | Pass |
| Owner scoping (Secure It) | Owner sees/manages only own listings | /owner shows only own rows; RLS rejects cross-access | Pass |
| Owner creates destination (BR-012/027 revised) | New DEST row + listing stamped uploaded_by | Owner-typed place appears in search under the new destination | Pass |
| Profile update (Process 1) | Name/sex/location edits persist to app_users | Saved values re-render after reload | Pass |
| Preference save (Process 2) | user_preferences row created/updated per user | Pills saved; recommendations input complete | Pass |
| Trips view (ERD) | Upcoming vs completed split by end_date | Trip cards grouped correctly; empty state for new users | Pass |
