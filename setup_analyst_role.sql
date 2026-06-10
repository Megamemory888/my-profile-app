-- ============================================================
-- NCIC — Analyst Role Setup
-- Run AFTER creating the analyst user in Supabase Auth dashboard
-- (Authentication > Users > Add user > email: analyst@ncic.gov.fj)
-- ============================================================

INSERT INTO user_roles (user_id, role, full_name, badge_number, station, rank)
SELECT id, 'analyst', 'Intelligence Analyst', 'ANALYST-01', 'CID HQ', 'Analyst'
FROM auth.users
WHERE email = 'analyst@ncic.gov.fj'
ON CONFLICT (user_id) DO UPDATE SET role = 'analyst';

SELECT 'Analyst role created' AS result;
