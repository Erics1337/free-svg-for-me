import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or key not found. Auth features will not work.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Types for our database tables
export type Profile = {
  id: string;
  credits: number;
  free_pro_generations_used: number;
  created_at: string;
  updated_at: string;
};

export type CreditPurchase = {
  id: string;
  user_id: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  credits_amount: number;
  amount_paid_cents: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  completed_at: string | null;
};

export type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'generation' | 'free_pro_tier' | 'refund' | 'bonus';
  description: string | null;
  purchase_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

import { CREDIT_COSTS as BaseCreditCosts, FREE_PRO_GENERATIONS } from './config';

// Credit costs per model (mapped to model IDs)
export const CREDIT_COSTS = {
  'gemini-2.0-flash': BaseCreditCosts.FLASH,
  'gemini-3-pro-preview': BaseCreditCosts.PRO,
  'gemini-3.1-pro-preview': BaseCreditCosts.PRO_31,
};

export { FREE_PRO_GENERATIONS };

export function isProModel(model: string): boolean {
  return model.includes('pro');
}

export function getCreditCost(model: string): number {
  return CREDIT_COSTS[model as keyof typeof CREDIT_COSTS] || 1;
}

// Helper to get the current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

// Helper to get the user's profile with credits
export async function getUserProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }

  return data as Profile;
}

// Helper to get credit transactions
export async function getCreditTransactions(limit = 10): Promise<CreditTransaction[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting transactions:', error);
    return [];
  }

  return data as CreditTransaction[];
}
