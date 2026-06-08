-- ============================================================
-- FIJI CENTRAL CRIMINAL INTELLIGENCE SYSTEM
-- Officer Portal — Database Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. USER ROLES TABLE
-- Maps Supabase auth users to roles (admin / officer)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,  -- matches auth.users.id
  role TEXT NOT NULL DEFAULT 'officer',  -- 'admin' or 'officer'
  full_name TEXT,
  badge_number TEXT,
  station TEXT,
  rank TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INCIDENT REPORTS TABLE
CREATE TABLE IF NOT EXISTS incident_reports (
  id TEXT PRIMARY KEY,               -- e.g. IR-2024-00001
  report_type TEXT NOT NULL,         -- 'complaint', 'accident', 'crime_scene', 'witness'

  -- Officer who took the report
  officer_user_id UUID,
  officer_name TEXT,
  officer_badge TEXT,
  officer_station TEXT,
  officer_rank TEXT,

  -- When / where
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  incident_date DATE,
  incident_time TEXT,
  incident_location TEXT,
  incident_location_detail TEXT,

  -- Complainant / Victim details
  complainant_name TEXT,
  complainant_dob DATE,
  complainant_gender TEXT,
  complainant_phone TEXT,
  complainant_address TEXT,
  complainant_nationality TEXT,
  complainant_occupation TEXT,
  complainant_email TEXT,

  -- Incident description
  offence_type TEXT,
  incident_description TEXT,
  property_stolen TEXT,
  property_value NUMERIC,
  injuries_reported BOOLEAN DEFAULT FALSE,
  injuries_description TEXT,
  weapons_involved BOOLEAN DEFAULT FALSE,
  weapons_description TEXT,

  -- Accident specific
  vehicle_reg_1 TEXT,
  vehicle_driver_1 TEXT,
  vehicle_reg_2 TEXT,
  vehicle_driver_2 TEXT,
  accident_type TEXT,               -- 'Collision', 'Single vehicle', 'Hit and run', etc.
  road_conditions TEXT,
  fatalities INTEGER DEFAULT 0,

  -- Suspect (known or unknown)
  suspect_known BOOLEAN DEFAULT FALSE,
  suspect_name TEXT,
  suspect_description TEXT,         -- physical description if unknown
  suspect_profile_id TEXT REFERENCES criminal_profiles(id) ON DELETE SET NULL,
  suspect_last_seen TEXT,
  suspect_vehicle TEXT,

  -- Witnesses
  witness_1_name TEXT,
  witness_1_phone TEXT,
  witness_1_statement TEXT,
  witness_2_name TEXT,
  witness_2_phone TEXT,
  witness_2_statement TEXT,

  -- Evidence
  evidence_collected TEXT,
  evidence_photos BOOLEAN DEFAULT FALSE,
  evidence_cctv BOOLEAN DEFAULT FALSE,

  -- Follow-up
  status TEXT DEFAULT 'New',        -- 'New', 'Under Investigation', 'Referred', 'Closed'
  referred_to TEXT,                 -- e.g. CID, Traffic Division
  follow_up_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUTO-INCREMENT ID function for incident reports
CREATE OR REPLACE FUNCTION generate_report_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT := TO_CHAR(NOW(), 'YYYY');
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM incident_reports
  WHERE id LIKE 'IR-' || year_str || '-%';
  RETURN 'IR-' || year_str || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. Enable Row Level Security (optional but recommended)
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write incident_reports
CREATE POLICY "Authenticated users can manage reports"
  ON incident_reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to read user_roles
CREATE POLICY "Authenticated users can read roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to read/update their own role record
CREATE POLICY "Users can update own role"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. INSERT SAMPLE OFFICER ACCOUNTS
-- After creating officers via Supabase Auth (Authentication > Users > Add user),
-- run this to assign their roles (replace the UUIDs with actual auth user IDs):
--
-- INSERT INTO user_roles (user_id, role, full_name, badge_number, station, rank) VALUES
--   ('YOUR-OFFICER-UUID-HERE', 'officer', 'Cpl. Jone Vuli', 'FP-2201', 'Suva Central', 'Corporal'),
--   ('YOUR-ADMIN-UUID-HERE',   'admin',   'Sgt. Ana Tikoisuva', 'FP-0045', 'CID HQ', 'Sergeant');

SELECT 'Setup complete. Tables created: user_roles, incident_reports' AS result;
