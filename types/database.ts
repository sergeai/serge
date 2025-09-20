export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          subscription_plan: 'starter' | 'professional' | 'enterprise'
          audit_credits: number
          company_name: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_plan?: 'starter' | 'professional' | 'enterprise'
          audit_credits?: number
          company_name?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_plan?: 'starter' | 'professional' | 'enterprise'
          audit_credits?: number
          company_name?: string | null
        }
      }
      audits: {
        Row: {
          id: string
          user_id: string
          business_email: string
          website_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          ai_readiness_score: number | null
          analysis_types: string[]
          results: Json | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          business_email: string
          website_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_readiness_score?: number | null
          analysis_types: string[]
          results?: Json | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          business_email?: string
          website_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_readiness_score?: number | null
          analysis_types?: string[]
          results?: Json | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'starter' | 'professional' | 'enterprise'
          status: 'active' | 'cancelled' | 'past_due'
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due'
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due'
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Audit = Database['public']['Tables']['audits']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
