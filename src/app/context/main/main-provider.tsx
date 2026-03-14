// app/contexts/main-context/main-provider.tsx
import PropTypes from 'prop-types';
import { useMemo, useEffect, useReducer, useCallback } from 'react';
import { MainContext } from './main-context';
import axios, { endpoints } from '../../../utils/axios';

// ── Storage key ──────────────────────────────────────────────────────────────
// This is the key we use in sessionStorage to persist the access token.
// sessionStorage means the token is cleared when the browser tab is closed,
// which is more secure than localStorage for auth tokens.
// We define it as a constant so it can never be misspelled anywhere.
const STORAGE_KEY         = 'bizassist_access_token';
const REFRESH_STORAGE_KEY = 'bizassist_refresh_token';

// ── State shape ───────────────────────────────────────────────────────────────
// TypeScript interfaces make the shape of your state explicit.
// This is important because `user` can be null (logged out) or an object (logged in).

interface Admin {
  id:         string;
  name:       string;
  email:      string;
  is_active:  boolean;
  created_at: string;
}

interface AuthState {
  user:    (Admin & { access_token: string }) | null;
  loading: boolean;
}

// ── Reducer ───────────────────────────────────────────────────────────────────
// The reducer is a pure function — same inputs always produce the same output.
// Each `action.type` string represents one thing that can happen in the auth lifecycle.

const initialState: AuthState = {
  user:    null,
  loading: true,  // true on startup because we don't know yet if there's a saved token
};

const reducer = (state: AuthState, action: any): AuthState => {
  switch (action.type) {

    case 'INITIAL':
      // Called on app startup after we check sessionStorage.
      // Sets loading to false regardless of whether a user was found.
      return {
        loading: false,
        user:    action.payload.user,
      };

    case 'LOGIN':
      // Called after a successful login API call.
      // loading stays false — the user just actively logged in.
      return {
        ...state,
        loading: false,
        user:    action.payload.user,
      };

    case 'LOGOUT':
      // Wipes the user from state. The sessionStorage cleanup
      // happens in the logout() function before this is dispatched.
      return {
        ...state,
        user: null,
      };

    default:
      return state;
  }
};

// ── Axios helper ──────────────────────────────────────────────────────────────
// This is the key piece that was missing from your original file.
// After login, we need to tell axios to include "Authorization: Bearer <token>"
// on every subsequent request. Without this, your agent config, conversations,
// and all other protected endpoints would return 401 even after login.

const setAxiosToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // When logging out, remove the header entirely so no token is sent
    delete axios.defaults.headers.common['Authorization'];
  }
};

// ── Provider component ────────────────────────────────────────────────────────

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── initialize ─────────────────────────────────────────────────────────────
  // This runs once when the app loads. It checks if there's a saved token
  // and if so, validates it against the /api/auth/me endpoint.
  // This is what keeps the user "logged in" across page refreshes.

  const initialize = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(STORAGE_KEY);

      if (accessToken) {
        // Tell axios to use this token for the upcoming /me request
        setAxiosToken(accessToken);

        // Verify the token is still valid by fetching the current admin's profile.
        // If the token is expired or invalid, this will throw and we fall to the catch block.
        const response = await axios.get(endpoints.auth.me);
        const admin = response.data;  // your /api/auth/me returns the admin object directly

        dispatch({
          type: 'INITIAL',
          payload: {
            user: {
              ...admin,
              access_token: accessToken,
            },
          },
        });

      } else {
        // No token found — user is not logged in, show login page
        dispatch({
          type: 'INITIAL',
          payload: { user: null },
        });
      }

    } catch (error) {
      // Token was found but the API rejected it — it's probably expired.
      // Clean up storage and treat the user as logged out.
      console.error('Session restore failed:', error);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(REFRESH_STORAGE_KEY);
      setAxiosToken(null);

      dispatch({
        type: 'INITIAL',
        payload: { user: null },
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);


  // ── login ──────────────────────────────────────────────────────────────────
  // Calls your FastAPI POST /api/auth/signin endpoint.
  // On success, saves both tokens to sessionStorage and updates axios headers.

  const login = useCallback(async (email: string, password: string) => {
    const response = await axios.post(endpoints.auth.login, { email, password });

    // Your FastAPI signin endpoint returns:
    // { access_token, refresh_token, token_type, admin: { id, name, email, ... } }
    const { access_token, refresh_token, admin } = response.data;

    // 1. Save tokens to sessionStorage so they survive page refresh
    sessionStorage.setItem(STORAGE_KEY,         access_token);
    sessionStorage.setItem(REFRESH_STORAGE_KEY, refresh_token);

    // 2. Tell axios to include this token on all future requests
    setAxiosToken(access_token);

    // 3. Update React state so the UI reflects the logged-in user
    dispatch({
      type: 'LOGIN',
      payload: {
        user: {
          ...admin,
          access_token,
        },
      },
    });
  }, []);


  // ── logout ─────────────────────────────────────────────────────────────────
  // Clears everything. Order matters here: clear storage first,
  // then remove the axios header, then update React state.
  // If you did it in the wrong order and something threw an error
  // halfway through, you'd end up in an inconsistent state.

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_STORAGE_KEY);
    setAxiosToken(null);
    dispatch({ type: 'LOGOUT' });
  }, []);


  // ── refreshToken ───────────────────────────────────────────────────────────
  // Called when an API request returns 401 (access token expired).
  // Uses the refresh token to get a new access token without re-login.
  // You would typically call this inside your axios response interceptor.

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const refreshToken = sessionStorage.getItem(REFRESH_STORAGE_KEY);
      if (!refreshToken) return null;

      const response = await axios.post(endpoints.auth.refresh, {
        refresh_token: refreshToken,
      });

      const { access_token } = response.data;

      // Update storage and axios with the new token
      sessionStorage.setItem(STORAGE_KEY, access_token);
      setAxiosToken(access_token);

      // Update state so user.access_token stays current
      if (state.user) {
        dispatch({
          type: 'LOGIN',
          payload: { user: { ...state.user, access_token } },
        });
      }

      return access_token;

    } catch {
      // Refresh token itself expired — force a full logout
      logout();
      return null;
    }
  }, [state.user, logout]);


  // ── Derived status ─────────────────────────────────────────────────────────
  // We derive a single `status` string from the state so consuming components
  // can do a simple equality check instead of combining multiple booleans.

  const status = state.loading
    ? 'loading'
    : state.user
    ? 'authenticated'
    : 'unauthenticated';


  // ── Memoized context value ─────────────────────────────────────────────────
  // useMemo ensures we don't create a new object on every render,
  // which would cause every component consuming this context to re-render
  // even when nothing auth-related actually changed.

  const memoizedValue = useMemo(() => ({
    // State
    user:    state.user,
    method:  'jwt',
    loading: status === 'loading',
    authenticated:   status === 'authenticated',
    unauthenticated: status === 'unauthenticated',

    // Actions — these are the functions your login page, header, etc. will call
    login,
    logout,
    refreshAccessToken,
  }), [state.user, status, login, logout, refreshAccessToken]);


  return (
    <MainContext.Provider value={memoizedValue}>
      {children}
    </MainContext.Provider>
  );
}

MainProvider.propTypes = {
  children: PropTypes.node,
};