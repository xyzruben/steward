import { z } from 'zod'

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================
// Validates all required environment variables at startup
// Fails fast if any critical configuration is missing

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),
  
  // Google Cloud Configuration (optional in development)
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export type ValidatedEnv = z.infer<typeof envSchema>

/**
 * Validates environment variables at startup
 * Throws error and exits if validation fails
 */
export function validateEnvironment(): ValidatedEnv {
  try {
    const validatedEnv = envSchema.parse(process.env)
    
    // Additional validation for production
    if (validatedEnv.NODE_ENV === 'production') {
      if (!validatedEnv.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON is required in production')
      }
      if (!validatedEnv.NEXT_PUBLIC_APP_URL) {
        throw new Error('NEXT_PUBLIC_APP_URL is required in production')
      }
    }
    
    console.log('✅ Environment validation passed')
    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('❌ Environment validation failed:', error)
    }
    
    console.error('Please check your environment variables and try again.')
    process.exit(1)
  }
}

/**
 * Get validated environment variables
 * Use this instead of process.env directly
 */
export const env = validateEnvironment() 