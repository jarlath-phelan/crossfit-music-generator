with source as (

    select * from {{ source('crank', 'raw_events') }}

),

cleaned as (

    select
        event_id,
        event as event_name,
        distinct_id as user_id,
        timestamp as event_at,

        -- Extract common properties from JSON
        json_extract_string(properties, '$.genre') as genre,
        json_extract_string(properties, '$.track_id') as track_id,
        json_extract_string(properties, '$.workout_name') as workout_name,
        json_extract_string(properties, '$.workout_type') as workout_type,
        json_extract_string(properties, '$.input_mode') as input_mode,
        json_extract_string(properties, '$.playlist_id') as playlist_id,
        json_extract_string(properties, '$.$current_url') as current_url,
        json_extract_string(properties, '$.$pathname') as pathname,
        json_extract_string(properties, '$.step') as onboarding_step,
        TRY_CAST(json_extract_string(properties, '$.elapsed_ms') as INTEGER) as elapsed_ms,
        TRY_CAST(json_extract_string(properties, '$.track_count') as INTEGER) as track_count,
        TRY_CAST(json_extract_string(properties, '$.error_type') as VARCHAR) as error_type,
        json_extract_string(properties, '$.error_message') as error_message,

        -- Keep raw properties for ad-hoc analysis
        properties as raw_properties

    from source

)

select * from cleaned
