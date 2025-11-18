import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sbpxwwidwkyvbydnmhff.supabase.co";  
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHh3d2lkd2t5dmJ5ZG5taGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDI5MzQsImV4cCI6MjA3ODg3ODkzNH0.sZm-kXW9jpEPSTPmZcCeEN2m2T1rRxxlnxZUAFtSFtw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
