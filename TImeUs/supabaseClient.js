import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ywbnhxqjznmmnuluiwcm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Ym5oeHFqem5tbW51bHVpd2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTg0MjcsImV4cCI6MjEwMjA5NDQyN30.ySSyiz1inafhpSjKIZnK68quGxBZ4PDHn90xEr2P5dc'

export const supabase = createClient(supabaseUrl, supabaseKey)