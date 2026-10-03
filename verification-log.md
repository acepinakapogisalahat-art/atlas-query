# Verification Log — TravelMate
| Feature | Expected | Actual | Pass/Fail |
| Signup profile insert | Row created in app_users linked by auth_user_id | Failed twice: UUID (36 chars) exceeded user_id varchar(20); Brave Shields blocked requests ("failed to fetch") | Fail → Fixed: short USR- id for user_id, UUID in auth_user_id; test in Chrome. Retest Pass |
| Signup (Process 1) | Auth user created + app_users profile row linked by auth_user_id | New user visible in Supabase Auth AND app_users | Pass |
