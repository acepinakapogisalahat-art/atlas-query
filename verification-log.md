| Signup (Process 1) | Auth user created + app_users profile row linked by auth_user_id | New user visible in Supabase Auth AND app_users | Pass |
| Login, valid credentials | Session starts, redirect to home | Redirects to / cleanly | Pass |
| Login, wrong password | Error shown, no redirect | Red error box, stays on /login | Pass |
| Signup, duplicate email | Clear rejection, no duplicate row | "User already registered" shown | Pass |
