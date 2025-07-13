// Supabase Auth event types for onAuthStateChange callbacks
// See: https://supabase.com/docs/reference/javascript/auth-signin#listening-to-auth-changes

export type SupabaseAuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'
  | 'MFA_CHALLENGE_VERIFIED'
  | 'MFA_VERIFIED'
  | 'MFA_ENROLLMENT_COMPLETE'
  | 'MFA_ENROLLMENT_CANCELED'
  | 'MFA_UNENROLLED'
  | 'UNKNOWN'; 