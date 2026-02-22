with events as (

    select * from {{ ref('stg_events') }}

),

with_previous as (

    select
        event_id,
        user_id,
        event_name,
        event_at,
        lag(event_at) over (
            partition by user_id
            order by event_at
        ) as prev_event_at

    from events

),

with_session_boundary as (

    select
        *,
        case
            when prev_event_at is null then 1
            when epoch_ms(event_at) - epoch_ms(prev_event_at) > 30 * 60 * 1000 then 1
            else 0
        end as is_new_session

    from with_previous

),

with_session_id as (

    select
        *,
        sum(is_new_session) over (
            partition by user_id
            order by event_at
            rows unbounded preceding
        ) as session_seq

    from with_session_boundary

),

sessioned as (

    select
        event_id,
        user_id,
        event_name,
        event_at,
        -- Create a deterministic session ID from user_id + session sequence
        user_id || '-' || CAST(session_seq as VARCHAR) as session_id,
        session_seq

    from with_session_id

)

select * from sessioned
