---
title: Music Analytics
---

# Music Analytics

## Genre Popularity Over Time

```sql genre_over_time
select
  cast(generated_at as date) as day,
  genre,
  count(*) as generations
from raw_playlists
group by 1, 2
order by 1
```

<BarChart data={genre_over_time} x=day y=generations series=genre title="Genre Popularity Over Time" type=stacked />

## Top Tracks by Play Count

```sql top_tracks
select
  track_name,
  artist,
  count(*) filter (where action = 'play') as plays,
  count(*) filter (where action = 'thumbs_up') as thumbs_up,
  count(*) filter (where action = 'thumbs_down') as thumbs_down,
  count(*) filter (where action = 'thumbs_up') - count(*) filter (where action = 'thumbs_down') as sentiment
from raw_track_events
group by 1, 2
order by plays desc
limit 20
```

<DataTable data={top_tracks} title="Top 20 Tracks" />

## BPM Distribution

```sql bpm_dist
select
  case
    when bpm < 100 then 'Cooldown (<100)'
    when bpm < 120 then 'Warm Up (100-120)'
    when bpm < 130 then 'Low (120-130)'
    when bpm < 145 then 'Moderate (130-145)'
    when bpm < 160 then 'High (145-160)'
    else 'Very High (160+)'
  end as bpm_range,
  count(*) as tracks
from raw_tracks
group by 1
order by min(bpm)
```

<BarChart data={bpm_dist} x=bpm_range y=tracks title="Track BPM Distribution" />

## Track Sentiment Leaderboard

```sql sentiment
select
  track_name,
  artist,
  count(*) filter (where action = 'thumbs_up') as up,
  count(*) filter (where action = 'thumbs_down') as down,
  count(*) filter (where action = 'thumbs_up') - count(*) filter (where action = 'thumbs_down') as net
from raw_track_events
where action in ('thumbs_up', 'thumbs_down')
group by 1, 2
having count(*) > 0
order by net desc
limit 15
```

<BarChart data={sentiment} x=track_name y=net title="Track Sentiment (Net Thumbs Up)" />
