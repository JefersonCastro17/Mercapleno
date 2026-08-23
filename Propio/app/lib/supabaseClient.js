import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewrgxkqangfnudvnuxqa.supabase.co'
const supabaseKey = 'sb_publishable_y0dR3OypAv5xUd-rnd6Nsw_7IlrNVbK'
export const supabase = createClient(supabaseUrl, supabaseKey)