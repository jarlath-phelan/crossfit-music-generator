---
title: API Performance
---

# API Performance

```sql success_rate
select
  round(100.0 * count(*) filter (where event = 'generate_completed') /
    nullif(count(*) filter (where event in ('generate_completed', 'generate_error')), 0), 1) as success_rate_pct,
  round(avg(try_cast(json_extract_string(properties, '$.elapsed_ms') as integer)) filter (where event = 'generate_completed')) as avg_latency_ms,
  count(*) filter (where event = 'generate_error' and json_extract_string(properties, '$.error_type') = 'timeout') as timeouts
from raw_events
where event in ('generate_completed', 'generate_error')
```

<BigValue data={success_rate} value=success_rate_pct fmt="0.0" title="Success Rate %" />
<BigValue data={success_rate} value=avg_latency_ms fmt="#,##0" title="Avg Latency (ms)" />
<BigValue data={success_rate} value=timeouts title="Timeouts" />

## Generation Latency Over Time

```sql latency_trend
select
  cast(timestamp as date) as day,
  round(avg(try_cast(json_extract_string(properties, '$.elapsed_ms') as integer))) as avg_ms,
  round(percentile_cont(0.95) within group (order by try_cast(json_extract_string(properties, '$.elapsed_ms') as integer))) as p95_ms
from raw_events
where event = 'generate_completed'
  and json_extract_string(properties, '$.elapsed_ms') is not null
group by 1
order by 1
```

<LineChart data={latency_trend} x=day y={['avg_ms', 'p95_ms']} title="Generation Latency (ms)" />

## Errors by Type

```sql errors_by_type
select
  json_extract_string(properties, '$.error_type') as error_type,
  count(*) as count
from raw_events
where event = 'generate_error'
group by 1
order by count desc
```

<BarChart data={errors_by_type} x=error_type y=count title="Errors by Type" />

## Daily Error Rate

```sql daily_errors
select
  cast(timestamp as date) as day,
  count(*) filter (where event = 'generate_error') as errors,
  count(*) filter (where event in ('generate_completed', 'generate_error')) as total,
  round(100.0 * count(*) filter (where event = 'generate_error') /
    nullif(count(*) filter (where event in ('generate_completed', 'generate_error')), 0), 2) as error_rate_pct
from raw_events
where event in ('generate_completed', 'generate_error')
group by 1
order by 1
```

<LineChart data={daily_errors} x=day y=error_rate_pct title="Daily Error Rate (%)" />
