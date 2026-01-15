-- Clean up existing tags by removing leading hashtags
-- This fixes issues where tags were stored as "##tag" or "#tag" instead of just "tag"

UPDATE advertisements
SET tags = ARRAY(
    SELECT regexp_replace(tag, '^#+', '')
    FROM unnest(tags) AS tag
)
WHERE tags IS NOT NULL;
