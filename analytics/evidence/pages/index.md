---
title: Crank Analytics — Overview
---

# Crank Analytics

```sql total_users
select count(*) as total_users from raw_users
```

```sql total_generations
select count(*) as total_generations from raw_playlists
```

```sql total_exports
select count(*) as total_exports from raw_events where event = 'spotify_export_completed'
```

```sql dau_today
select count(distinct distinct_id) as dau
from raw_events
where cast(timestamp as date) = (select max(cast(timestamp as date)) from raw_events)
```

<BigValue data={total_users} value=total_users title="Total Users" />
<BigValue data={total_generations} value=total_generations title="Total Generations" />
<BigValue data={total_exports} value=total_exports title="Spotify Exports" />
<BigValue data={dau_today} value=dau title="DAU (Latest Day)" />

## Daily Active Users

```sql dau_trend
select
  cast(timestamp as date) as day,
  count(distinct distinct_id) as dau
from raw_events
group by 1
order by 1
```

<LineChart data={dau_trend} x=day y=dau title="Daily Active Users (90 Days)" />

## Generations by Genre

```sql genre_breakdown
select genre, count(*) as generations
from raw_playlists
group by genre
order by generations desc
```

<BarChart data={genre_breakdown} x=genre y=generations title="Generations by Genre" />

## Generation Funnel

```sql funnel
select 'Page View' as step, 1 as step_order, count(distinct distinct_id) as users from raw_events where event = '$pageview'
union all
select 'Generate Submitted', 2, count(distinct distinct_id) from raw_events where event = 'generate_submitted'
union all
select 'Generate Completed', 3, count(distinct distinct_id) from raw_events where event = 'generate_completed'
union all
select 'Spotify Export', 4, count(distinct distinct_id) from raw_events where event = 'spotify_export_completed'
order by step_order
```

<FunnelChart data={funnel} nameCol=step valueCol=users title="User Funnel" />

## Top Workout Types

```sql top_workouts
select
  coalesce(workout_type, 'custom') as workout_type,
  count(*) as generations,
  round(avg(track_count), 1) as avg_tracks,
  round(avg(elapsed_ms / 1000.0), 1) as avg_time_sec
from raw_playlists
group by 1
order by generations desc
limit 10
```

<DataTable data={top_workouts} title="Top 10 Workout Types" />
