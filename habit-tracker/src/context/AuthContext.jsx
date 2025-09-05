// context/AuthContext.jsx - Simplified with fallback for user profile issues
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase, signInWithGoogle, signOut } from '../services/supabaseConfig';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_AUTH_STATE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        session: action.payload.session,
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  session: null,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Simplified user profile creation with timeout and fallback
  const getOrCreateUserProfile = useCallback(async (authUser) => {
    return new Promise(async (resolve, reject) => {
      // Timeout after 5 seconds
      const timeout = setTimeout(() => {
        console.warn('User profile creation timeout - using fallback');
        resolve({
          id: authUser.id,
          username: authUser.email.split('@')[0],
          email: authUser.email,
          fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          avatar: authUser.user_metadata?.avatar_url || null,
          preferences: { darkMode: false, notifications: true, language: 'en' },
        });
      }, 5000);

      try {
        console.log('Getting/creating user profile for:', authUser.id);
        
        // Try to get existing user first
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        // Clear timeout if we got a response
        clearTimeout(timeout);

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
          // Use fallback instead of failing
          console.log('Using fallback user data due to fetch error');
          resolve({
            id: authUser.id,
            username: authUser.email.split('@')[0],
            email: authUser.email,
            fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            avatar: authUser.user_metadata?.avatar_url || null,
            preferences: { darkMode: false, notifications: true, language: 'en' },
          });
          return;
        }

        if (existingUser) {
          console.log('Found existing user:', existingUser.email);
          resolve({
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            fullName: existingUser.full_name,
            avatar: existingUser.avatar,
            preferences: existingUser.preferences || {},
          });
          return;
        }

        console.log('Creating new user profile...');
        // Create new user
        const baseUsername = authUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const newUser = {
          id: authUser.id,
          username: baseUsername,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          avatar: authUser.user_metadata?.avatar_url || null,
          preferences: { darkMode: false, notifications: true, language: 'en' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          // Use fallback instead of failing
          console.log('Using fallback user data due to creation error');
          resolve({
            id: authUser.id,
            username: baseUsername,
            email: authUser.email,
            fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            avatar: authUser.user_metadata?.avatar_url || null,
            preferences: { darkMode: false, notifications: true, language: 'en' },
          });
          return;
        }

        console.log('Created new user:', createdUser.email);
        resolve({
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
          fullName: createdUser.full_name,
          avatar: createdUser.avatar,
          preferences: createdUser.preferences || {},
        });

      } catch (error) {
        clearTimeout(timeout);
        console.error('Unexpected error in getOrCreateUserProfile:', error);
        // Use fallback for any unexpected error
        console.log('Using fallback user data due to unexpected error');
        resolve({
          id: authUser.id,
          username: authUser.email.split('@')[0],
          email: authUser.email,
          fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          avatar: authUser.user_metadata?.avatar_url || null,
          preferences: { darkMode: false, notifications: true, language: 'en' },
        });
      }
    });
  }, []);

  // Handle authentication session
  const handleAuthSession = useCallback(
    async (session) => {
      console.log('Handling auth session:', !!session, session?.user?.email);
      
      try {
        if (!session?.user) {
          console.log('No session or user, setting unauthenticated state');
          dispatch({
            type: 'SET_AUTH_STATE',
            payload: { isAuthenticated: false, user: null, session: null },
          });
          return;
        }

        console.log('Processing user data...');
        const userData = await getOrCreateUserProfile(session.user);
        console.log('Successfully processed user data:', userData.email);
        
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            isAuthenticated: true,
            user: userData,
            session,
          },
        });
        
        // Clean up URL parameters
        if (window.location.search.includes('code=') || window.location.search.includes('access_token=')) {
          console.log('Cleaning up OAuth URL parameters');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
      } catch (error) {
        console.error('Error handling auth session:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Failed to process authentication. Please try again.' 
        });
      }
    },
    [getOrCreateUserProfile]
  );

  // Initialize authentication
  useEffect(() => {
    let isMounted = true;
    let initTimeout;

    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            dispatch({ 
              type: 'SET_ERROR', 
              payload: 'Failed to check authentication status.' 
            });
          }
          return;
        }

        console.log('Initial session check:', !!session?.user);
        if (isMounted) {
          await handleAuthSession(session);
        }

      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: 'Failed to initialize authentication.' 
          });
        }
      }
    };

    // Timeout fallback
    initTimeout = setTimeout(() => {
      if (isMounted && state.loading) {
        console.warn('Auth initialization timeout - setting unauthenticated');
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: { isAuthenticated: false, user: null, session: null },
        });
      }
    }, 15000); // 15 second timeout

    initAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session?.user);
        
        if (!isMounted) return;

        // Clear timeout on any auth event
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }

        try {
          switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
            case 'USER_UPDATED':
              console.log('User authenticated, processing session...');
              await handleAuthSession(session);
              break;
            case 'SIGNED_OUT':
              console.log('User signed out');
              dispatch({ type: 'LOGOUT' });
              break;
            default:
              console.log('Other auth event, handling session...');
              await handleAuthSession(session);
              break;
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          if (isMounted) {
            dispatch({ 
              type: 'SET_ERROR', 
              payload: 'Authentication error occurred.' 
            });
          }
        }
      }
    );

    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      subscription.unsubscribe();
    };
  }, [handleAuthSession]);

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      console.log('Starting Google login...');
      const result = await signInWithGoogle();
      
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.message });
        return { success: false, message: result.message };
      }
      
      return { success: true, message: 'Redirecting to Google...' };
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error.message || 'Google sign-in failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('Logging out...');
      const result = await signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    loginWithGoogle,
    logout,
    clearError,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};