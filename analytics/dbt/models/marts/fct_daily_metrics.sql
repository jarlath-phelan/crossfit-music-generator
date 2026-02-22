with daily_events as (

    select
        CAST(event_at as DATE) as metric_date,
        user_id,
        event_name,
        elapsed_ms

    from {{ ref('stg_events') }}

),

daily_users as (

    select
        CAST(created_at as DATE) as signup_date,
        count(*) as new_users

    from {{ ref('stg_users') }}
    group by CAST(created_at as DATE)

),

daily_agg as (

    select
        metric_date,

        -- DAU: distinct users with any event
        count(distinct user_id) as dau,

        -- Generations
        count(case when event_name = 'generate_completed' then 1 end) as generations,

        -- Spotify exports
        count(case when event_name = 'spotify_export_completed' then 1 end) as exports,

        -- Average generation time (only for completed generations)
        avg(case when event_name = 'generate_completed' then elapsed_ms end) as avg_generation_time_ms,

        -- Errors
        count(case when event_name = 'generate_error' then 1 end) as error_count,

        -- Error rate (errors / (completed + errors))
        case
            when (count(case when event_name = 'generate_completed' then 1 end)
                + count(case when event_name = 'generate_error' then 1 end)) > 0
            then CAST(count(case when event_name = 'generate_error' then 1 end) as DOUBLE)
                / (count(case when event_name = 'generate_completed' then 1 end)
                   + count(case when event_name = 'generate_error' then 1 end))
            else 0.0
        end as error_rate

    from daily_events
    group by metric_date

),

joined as (

    select
        d.metric_date,
        d.dau,
        coalesce(u.new_users, 0) as new_users,
        d.generations,
        d.exports,
        d.avg_generation_time_ms,
        d.error_count,
        d.error_rate

    from daily_agg d
    left join daily_users u on d.metric_date = u.signup_date

)

select * from joined
order by metric_date
