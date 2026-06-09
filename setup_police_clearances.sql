-- ============================================================
-- NCIC — Police Clearance Table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS police_clearances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clearance_id  TEXT UNIQUE NOT NULL,           -- e.g. PC-2026-00001

  -- Officer who performed the check
  officer_user_id UUID,
  officer_name    TEXT,
  officer_badge   TEXT,
  officer_station TEXT,
  officer_rank    TEXT,

  -- Applicant details
  applicant_name        TEXT NOT NULL,
  applicant_dob         DATE,
  applicant_gender      TEXT,
  applicant_nationality TEXT,
  applicant_id_number   TEXT,                   -- passport, social welfare, driver's licence, etc.
  applicant_phone       TEXT,
  applicant_address     TEXT,
  applicant_email       TEXT,

  -- Clearance details
  purpose               TEXT,                   -- employment, visa, travel, etc.
  search_result         TEXT DEFAULT 'clear',   -- 'clear' or 'record_found'
  matched_profile_id    TEXT REFERENCES criminal_profiles(id) ON DELETE SET NULL,
  officer_notes         TEXT,
  status                TEXT DEFAULT 'Issued',  -- 'Issued', 'Record Found — Refer to Supervisor', 'Pending'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE police_clearances ENABLE ROW LEVEL SECURITY;

-- All authenticated officers can read/write clearances
CREATE POLICY "Authenticated users can manage clearances"
  ON police_clearances FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

SELECT 'police_clearances table created successfully' AS result;
