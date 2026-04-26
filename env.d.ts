declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string
    readonly NEXT_PUBLIC_CREDIT_COST_FLASH: string
    readonly NEXT_PUBLIC_CREDIT_COST_PRO: string
    readonly NEXT_PUBLIC_CREDIT_COST_PRO_31: string
    readonly NEXT_PUBLIC_FREE_PRO_GENS: string
    readonly NEXT_PUBLIC_LAMBDA_FUNCTION_URL: string
    readonly NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
    readonly NEXT_PUBLIC_APP_URL: string
    readonly SUPABASE_SERVICE_ROLE_KEY: string
    readonly STRIPE_SECRET_KEY: string
    readonly STRIPE_WEBHOOK_SECRET: string
  }
}
