import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const msg =
    'SCI Archive is missing required configuration.\n\n' +
    'If you are building this app, please make sure the following environment variables are set in Codemagic:\n' +
    '  VITE_SUPABASE_URL\n' +
    '  VITE_SUPABASE_PUBLISHABLE_KEY\n\n' +
    'See codemagic.yaml for setup instructions.';
  // Surface the error visibly in the app instead of silently crashing
  if (typeof document !== 'undefined') {
    document.body.style.cssText =
      'margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0f1e;color:#e2e8f0;font-family:sans-serif;padding:24px;box-sizing:border-box;text-align:center;';
    document.body.innerHTML =
      `<div><div style="font-size:2rem;margin-bottom:12px;">⚠️</div><h2 style="margin:0 0 12px;font-size:1.1rem;">Configuration Error</h2><p style="margin:0;font-size:0.85rem;opacity:0.7;white-space:pre-line;">${msg}</p></div>`;
  }
  throw new Error(msg);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});