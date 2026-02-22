---
title: User Analytics
---

# User Analytics

## New Users Per Day

```sql new_users
select
  cast(created_at as date) as day,
  count(*) as new_users
from raw_users
group by 1
order by 1
```

<LineChart data={new_users} x=day y=new_users title="New User Signups" />

## Users by Signup Source

```sql by_source
select
  signup_source,
  count(*) as users
from raw_users
group by 1
order by users desc
```

<BarChart data={by_source} x=signup_source y=users title="Users by Signup Source" />

## Preferred Genre Distribution

```sql genre_pref
select
  preferred_genre,
  count(*) as users
from raw_users
group by 1
order by users desc
```

<BarChart data={genre_pref} x=preferred_genre y=users title="Preferred Genre" />

## Most Active Users

```sql active_users
select
  u.user_id,
  u.signup_source,
  u.preferred_genre,
  count(distinct p.playlist_id) as generations,
  count(distinct te.event_id) filter (where te.action = 'play') as plays
from raw_users u
left join raw_playlists p on u.user_id = p.user_id
left join raw_track_events te on u.user_id = te.user_id
group by 1, 2, 3
order by generations desc
limit 20
```

<DataTable data={active_users} title="Most Active Users (Top 20)" />

## Spotify Premium Distribution

```sql premium
select
  case when has_spotify_premium then 'Premium' else 'Free' end as plan,
  count(*) as users
from raw_users
group by 1
```

<BarChart data={premium} x=plan y=users title="Spotify Premium vs Free" />
