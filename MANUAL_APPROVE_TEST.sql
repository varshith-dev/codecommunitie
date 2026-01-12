-- SIMPLE TEST: Manually approve a verification request
-- This will help us see if the database operations work

-- Step 1: See current requests
SELECT id, user_id, status FROM verification_requests;

-- Step 2: Manually approve request ID 1 (change ID if needed)
UPDATE verification_requests 
SET 
    status = 'approved',
    reviewed_at = NOW()
WHERE id = 1;

-- Step 3: Mark user as verified
UPDATE profiles 
SET is_verified = true 
WHERE id = (SELECT user_id FROM verification_requests WHERE id = 1);

-- Step 4: Check results
SELECT 
    vr.id,
    vr.status,
    p.username,
    p.is_verified
FROM verification_requests vr
JOIN profiles p ON p.id = vr.user_id
WHERE vr.id = 1;
