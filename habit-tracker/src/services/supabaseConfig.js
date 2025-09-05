// supabaseConfig.js - Cleaned version
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'habit-tracker-auth',
    },
    global: {
        headers: {
            'x-client-info': 'habit-tracker'
        }
    }
});

// Error handling
export const handleSupabaseError = (error) => {
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

// Session checking with OAuth handling
export const checkAuthStatus = async () => {
    try {
        const oauthError = getOAuthError();
        if (oauthError) {
            return {
                isAuthenticated: false,
                session: null,
                error: oauthError.description
            };
        }

        if (hasOAuthParams()) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            return { isAuthenticated: false, session: null, error };
        }

        return {
            isAuthenticated: !!session?.user,
            session,
            error: null
        };

    } catch (error) {
        return { isAuthenticated: false, session: null, error };
    }
};

// Helper function to get current user ID safely
export const getCurrentUserId = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) return null;
        return user?.id || null;
    } catch (error) {
        return null;
    }
};

// Google OAuth sign in
export const signInWithGoogle = async () => {
    try {
        if (hasOAuthParams()) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const redirectUrl = `${window.location.origin}/dashboard`;

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

        if (error) throw error;

        return handleSupabaseSuccess(data, 'Redirecting to Google...');

    } catch (error) {
        return handleSupabaseError(error);
    }
};

// Sign out with cleanup
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut({
            scope: 'local'
        });

        if (error) throw error;

        if (hasOAuthParams()) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return handleSupabaseSuccess(null, 'Signed out successfully');

    } catch (error) {
        return handleSupabaseError(error);
    }
};

// Setup auth state listener
export const setupAuthListener = (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });

    return subscription;
};

// Force session refresh
export const refreshSession = async () => {
    try {
        const { data, error } = await supabase.auth.refreshSession();

        if (error) throw error;

        return handleSupabaseSuccess(data, 'Session refreshed');

    } catch (error) {
        return handleSupabaseError(error);
    }
};

// Get current user
export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        return handleSupabaseSuccess(user, 'User retrieved');

    } catch (error) {
        return handleSupabaseError(error);
    }
};

// Helper to check if user is authenticated
export const isUserAuthenticated = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session?.user;
    } catch (error) {
        return false;
    }
};

export default supabase;