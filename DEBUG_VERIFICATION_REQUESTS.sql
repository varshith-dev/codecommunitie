-- Debug verification requests
-- Run this to see what's in the table and check for issues

-- 1. Check all verification requests
SELECT 
    vr.id,
    vr.user_id,
    vr.status,
    vr.requested_at,
    p.username,
    p.display_name,
    p.is_verified
FROM verification_requests vr
LEFT JOIN profiles p ON p.id = vr.user_id
ORDER BY vr.requested_at DESC;

-- 2. Check if there are orphaned requests (user_id not in profiles)
SELECT 
    vr.id,
    vr.user_id,
    vr.status,
    'ORPHANED - No profile found' as issue
FROM verification_requests vr
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = vr.user_id
);

-- 3. Try a manual approval to test
-- Uncomment and replace the ID to test manually
-- UPDATE verification_requests 
-- SET status = 'approved', reviewed_at = NOW()
-- WHERE id = 1;

-- UPDATE profiles 
-- SET is_verified = true 
-- WHERE id = (SELECT user_id FROM verification_requests WHERE id = 1);
