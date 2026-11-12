const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://jbjfbczsxezptvhswfmm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_QhEWhEnwiVutvWyR983O0w_itQJZaWQ';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials missing. Running in mock/in-memory mode.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };

