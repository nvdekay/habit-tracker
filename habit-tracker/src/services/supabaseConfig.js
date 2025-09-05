// supabaseConfig.js - Improved OAuth callback detection
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
    throw new Error('Missing Supabase configuration');
}

// Create Supabase client with enhanced OAuth configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true, // Critical for OAuth
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development',
        storageKey: 'habit-tracker-auth',
    },
    global: {
        headers: {
            'x-client-info': 'habit-tracker'
        }
    }
});

// Enhanced error handling with OAuth-specific errors
export const handleSupabaseError = (error) => {
    console.error('Supabase Error:', error);

    // OAuth-specific error mappings
    const errorMappings = {
        'PGRST116': 'No data found',
        '23505': 'Data already exists',
        '42501': 'Insufficient permissions',
        'AUTH_SESSION_MISSING': 'Please sign in to continue',
        'AUTH_INVALID_CREDENTIALS': 'Invalid login credentials',
        'AUTH_USER_NOT_FOUND': 'User account not found',
        'AUTH_EMAIL_NOT_CONFIRMED': 'Please verify your email address',
        'AUTH_WEAK_PASSWORD': 'Password is too weak',
        'AUTH_SIGNUP_DISABLED': 'New registrations are currently disabled',
        'oauth_error': 'OAuth authentication failed',
        'invalid_request': 'Invalid OAuth request',
        'access_denied': 'OAuth access was denied',
        'unsupported_response_type': 'OAuth response type not supported',
    };

    // Check for OAuth-specific errors
    if (error.message?.includes('OAuth') || error.code?.includes('oauth')) {
        return {
            success: false,
            message: 'Google authentication failed. Please try again.',
            error: error,
            shouldRedirectToLogin: true
        };
    }

    // Check for JWT/token errors
    if (error.message?.includes('JWT') || 
        error.message?.includes('invalid_token') ||
        error.message?.includes('expired') ||
        error.message?.includes('refresh_token')) {
        return {
            success: false,
            message: 'Session expired. Please sign in again.',
            error: error,
            shouldRedirectToLogin: true
        };
    }

    // Use mapped error message or fallback
    const message = errorMappings[error.code] || 
                   errorMappings[error.error_description] ||
                   error.message || 
                   'Something went wrong';

    return {
        success: false,
        message: message,
        error: error,
        shouldRedirectToLogin: error.code === 'AUTH_SESSION_MISSING'
    };
};

export const handleSupabaseSuccess = (data, message = 'Success') => {
    return {
        success: true,
        data: data,
        message: message
    };
};

// Helper to check if URL has OAuth parameters
export const hasOAuthParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') || 
           urlParams.has('access_token') || 
           urlParams.has('error') ||
           urlParams.has('error_description');
};

// Helper to get OAuth error from URL
export const getOAuthError = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
        return {
            error,
            description: errorDescription || 'OAuth authentication failed'
        };
    }
    return null;
};

// Enhanced session checking with OAuth handling
export const checkAuthStatus = async () => {
    try {
        console.log('Checking auth status...');
        
        // Check for OAuth errors first
        const oauthError = getOAuthError();
        if (oauthError) {
            console.error('OAuth error detected:', oauthError);
            return { 
                isAuthenticated: false, 
                session: null, 
                error: oauthError.description 
            };
        }

        // If we have OAuth params, wait a bit for Supabase to process
        if (hasOAuthParams()) {
            console.log('OAuth parameters detected, waiting for session processing...');
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error checking auth status:', error);
            return { isAuthenticated: false, session: null, error };
        }

        console.log('Auth status checked:', !!session?.user);
        return { 
            isAuthenticated: !!session?.user, 
            session, 
            error: null 
        };
        
    } catch (error) {
        console.error('Error checking auth status:', error);
        return { isAuthenticated: false, session: null, error };
    }
};

// Helper function to get current user ID safely
export const getCurrentUserId = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
        return user?.id || null;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        return null;
    }
};

// Enhanced Google OAuth sign in
export const signInWithGoogle = async () => {
    try {
        console.log('Initiating Google OAuth...');
        
        // Clear any existing errors from URL
        if (hasOAuthParams()) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Get current origin for redirect
        const redirectUrl = `${window.location.origin}/dashboard`;
        console.log('OAuth redirect URL:', redirectUrl);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                skipBrowserRedirect: false
            }
        });

        if (error) {
            console.error('Google OAuth initiation error:', error);
            throw error;
        }

        console.log('Google OAuth initiated successfully');
        return handleSupabaseSuccess(data, 'Redirecting to Google...');
        
    } catch (error) {
        console.error('Google sign-in error:', error);
        return handleSupabaseError(error);
    }
};

// Enhanced sign out with cleanup
export const signOut = async () => {
    try {
        console.log('Signing out user...');
        
        const { error } = await supabase.auth.signOut({
            scope: 'local'
        });
        
        if (error) {
            console.error('Sign out error:', error);
            throw error;
        }
        
        // Clear any OAuth parameters from URL
        if (hasOAuthParams()) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        console.log('User signed out successfully');
        return handleSupabaseSuccess(null, 'Signed out successfully');
        
    } catch (error) {
        console.error('Sign out error:', error);
        return handleSupabaseError(error);
    }
};

// Setup auth state listener with enhanced logging
export const setupAuthListener = (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth state change: ${event}`, {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id || 'none',
            timestamp: new Date().toISOString()
        });
        callback(event, session);
    });
    
    return subscription;
};

// Force session refresh (useful for debugging)
export const refreshSession = async () => {
    try {
        console.log('Force refreshing session...');
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
            console.error('Error force refreshing session:', error);
            throw error;
        }
        
        console.log('Session force refreshed successfully');
        return handleSupabaseSuccess(data, 'Session refreshed');
        
    } catch (error) {
        console.error('Error force refreshing session:', error);
        return handleSupabaseError(error);
    }
};

// Get current user with enhanced error handling
export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
        
        return handleSupabaseSuccess(user, 'User retrieved');
        
    } catch (error) {
        console.error('Error getting current user:', error);
        return handleSupabaseError(error);
    }
};

// Debug helper - use this in console to check auth state
export const debugAuthState = async () => {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('URL:', window.location.href);
    console.log('Has OAuth params:', hasOAuthParams());
    console.log('OAuth error:', getOAuthError());
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session error:', error);
        console.log('Has session:', !!session);
        console.log('Has user:', !!session?.user);
        console.log('User email:', session?.user?.email || 'none');
        console.log('Session expires:', session?.expires_at || 'none');
    } catch (e) {
        console.error('Error getting session:', e);
    }
    console.log('=====================');
};

// Helper to check if user is authenticated
export const isUserAuthenticated = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session?.user;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
};

export default supabase;