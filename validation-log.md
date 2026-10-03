# Validation Log — TravelMate

| Scenario | Expected | Actual | Pass/Fail/Discuss |
| --- | --- | --- | --- |
| Signup fields vs live schema | Mission 2 dictionary columns accepted | Live table uses `name`/`password_hash`/`current_location`/`auth_user_id`; inserts failed until app adapted | Discuss – app follows live schema; dictionary needs update |
| App works in any browser | Identical behavior everywhere | Brave Shields blocked Supabase ("Failed to fetch"); Chrome works | Discuss – demo + docs will specify Chrome |
