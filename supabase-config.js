const SUPABASE_URL = 'https://ywkbzoprvdnbtfdyzlye.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UY4_5H0ZBRsg82UeLR2vZA_VKmw60_Q';

const SUPABASE_CONFIGURED = !SUPABASE_URL.startsWith('PASTE_') && !SUPABASE_ANON_KEY.startsWith('PASTE_');
const diarySupabase = SUPABASE_CONFIGURED
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
