import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jvxculkrimwffglwycsy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eGN1bGtyaW13ZmZnbHd5Y3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDcwNzQsImV4cCI6MjA4NzQ4MzA3NH0.od36hDs6Ak3SJg47wRA3u6hKcxDtv1it4zJbaZrt_Hc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});