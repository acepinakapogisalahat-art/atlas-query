# Validation Log — TravelMate

| Scenario | Expected | Actual | Pass/Fail/Discuss |
| --- | --- | --- | --- |
| Signup fields vs live schema | Mission 2 dictionary columns accepted | Live table uses `name`/`password_hash`/`current_location`/`auth_user_id`; inserts failed until app adapted | Discuss – app follows live schema; dictionary needs update |
| App works in any browser | Identical behavior everywhere | Brave Shields blocked Supabase ("Failed to fetch"); Chrome works | Discuss – demo + docs will specify Chrome |
| 5-day weather outlook | Live telemetry per Mission 1 Challenge #3 | Static demo feed (no weather table exists) | Discuss – placeholder until external feed integrated |
| Activity/Budget chips | Filter results by activity/budget | Visual selection only – listings has no activity/budget column (budget lives in user_preferences, activity in attractions.activity_name) | Discuss – wire chips via attractions join next sprint |
| Who uploads listing photos | Owners/admins upload their own assets (Process 5) | Seeded rows repointed to stock CC photos; owner-upload pipeline = Supabase Storage bucket listing-photos, wired in admin manager | Discuss – stock URLs are demo stand-ins until real uploads |
| Business-owner self-service | Owners post their own listings | Schema models only Administrator role; owner submissions flow through admin curation | Discuss – add owner role post-Go-Live |
| Listing photos source | Real photos render reliably | Third-party placeholder service unreachable from campus network; switched to local assets in /public/img/listings (original Mission 3 seed paths now resolve) | Pass – works offline |
| 4-tile photo gallery | Design shows 4 tiles | DB seeds 1 photo per listing (BR-019 permits many) | Discuss – hero cover until admin upload flow adds more |
