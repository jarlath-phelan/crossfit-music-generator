with events as (

    select * from {{ ref('stg_events') }}

),

-- Determine which funnel steps each user has reached
user_funnel_steps as (

    select
        user_id,

        -- Step 1: Visited the app (any pageview)
        min(case when event_name = '$pageview' then event_at end) as first_pageview_at,
        count(case when event_name = '$pageview' then 1 end) > 0 as reached_pageview,

        -- Step 2: Submitted a generation request
        min(case when event_name = 'generate_submitted' then event_at end) as first_generate_submitted_at,
        count(case when event_name = 'generate_submitted' then 1 end) > 0 as reached_generate_submitted,

        -- Step 3: Got a successful generation result
        min(case when event_name = 'generate_completed' then event_at end) as first_generate_completed_at,
        count(case when event_name = 'generate_completed' then 1 end) > 0 as reached_generate_completed,

        -- Step 4: Exported playlist to Spotify
        min(case when event_name = 'spotify_export_completed' then event_at end) as first_spotify_export_at,
        count(case when event_name = 'spotify_export_completed' then 1 end) > 0 as reached_spotify_export,

        -- Counts for volume analysis
        count(case when event_name = 'generate_submitted' then 1 end) as total_submissions,
        count(case when event_name = 'generate_completed' then 1 end) as total_completions,
        count(case when event_name = 'generate_error' then 1 end) as total_errors,
        count(case when event_name = 'spotify_export_completed' then 1 end) as total_exports

    from events
    group by user_id

)

select * from user_funnel_steps
