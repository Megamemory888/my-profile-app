import { createClient } from '@supabase/supabase-js'

// Reads connection from environment (set per Vercel project / local .env).
// Falls back to the production values so the existing deployment keeps working
// even if env vars are not set. The demo deployment sets these to the demo instance.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://znliltzpdzvclhefjcrs.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_IIa6HGlp-fy-6HK_GjwsoQ_XmLdiXgf'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)