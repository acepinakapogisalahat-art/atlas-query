# Verification Log — TravelMate
| Feature | Expected | Actual | Pass/Fail |
| Signup profile insert | Row created in app_users linked by auth_user_id | Failed twice: UUID (36 chars) exceeded user_id varchar(20); Brave Shields blocked requests ("failed to fetch") | Fail → Fixed: short USR- id for user_id, UUID in auth_user_id; test in Chrome. Retest Pass |
| --- | --- | --- | --- |
