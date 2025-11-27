/**
 * Helper function to handle Supabase and network errors
 */
export function handleSupabaseError(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Network errors
  if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
    return 'Network error: Please check your internet connection and ensure Supabase is configured correctly.';
  }

  // Supabase specific errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return 'No rows found';
      case '23505':
        return 'This record already exists';
      case '42501':
        return 'Permission denied';
      default:
        return error.message || `Error: ${error.code}`;
    }
  }

  // Generic error messages
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

