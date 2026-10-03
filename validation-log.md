# Validation Log — TravelMate

| Scenario | Expected | Actual | Pass/Fail/Discuss |
| --- | --- | --- | --- |
| Signup fields vs live schema | Mission 2 dictionary columns accepted | Live table uses `name`/`password_hash`/`current_location`/`auth_user_id`; inserts failed until app adapted | Discuss – app follows live schema; dictionary needs update |
| App works in any browser | Identical behavior everywhere | Brave Shields blocked Supabase ("Failed to fetch"); Chrome works | Discuss – demo + docs will specify Chrome |
| 5-day weather outlook | Live telemetry per Mission 1 Challenge #3 | Static demo feed (no weather table exists) | Discuss – placeholder until external feed integrated |
| Activity/Budget chips | Filter results by activity/budget | Visual selection only – listings has no activity/budget column (budget lives in user_preferences, activity in attractions.activity_name) | Discuss – wire chips via attractions join next sprint |
