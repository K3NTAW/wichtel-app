/**
 * Helper function to handle Supabase and network errors
 */
export function handleSupabaseError(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Network errors
  if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
    return 'Network/CORS error: Please ensure your Supabase project allows requests from this domain. Go to Supabase Dashboard > Authentication > URL Configuration and add your domain to the allowed list.';
  }

  // Supabase specific errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        // No rows found - this is often expected, not an error
        return 'No matching record found';
      case '23505':
        return 'This record already exists';
      case '42501':
        return 'Permission denied';
      case 'PGRST301':
        return 'Cannot coerce the result to a single JSON object. Multiple rows or no rows returned.';
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

