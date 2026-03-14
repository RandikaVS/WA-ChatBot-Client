// app/contexts/agent-context/agent-provider.tsx
import { useMemo, useReducer, useCallback } from 'react';
import { AgentContext, AgentConfig, AgentStats, TestPayload, TestResult } from './agent-context';
import axios, { endpoints } from '../../../utils/axios';

// ── State shape ───────────────────────────────────────────────────────────────

interface AgentState {
  config:        AgentConfig | null;
  stats:         AgentStats  | null;
  configLoading: boolean;
  statsLoading:  boolean;
  saving:        boolean;
  error:         string | null;
}

const initialState: AgentState = {
  config:        null,
  stats:         null,
  configLoading: false,
  statsLoading:  false,
  saving:        false,
  error:         null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
// Each action type represents one distinct thing that can happen.
// This makes it very easy to trace in React DevTools: you can see
// every state transition with its label.

const reducer = (state: AgentState, action: any): AgentState => {
  switch (action.type) {

    case 'CONFIG_LOADING':
      // Started fetching config — show the loading skeleton
      return { ...state, configLoading: true, error: null };

    case 'CONFIG_LOADED':
      // Config arrived successfully — populate the form fields
      return { ...state, configLoading: false, config: action.payload };

    case 'CONFIG_ERROR':
      // Fetch failed — show an error message in the UI
      return { ...state, configLoading: false, error: action.payload };

    case 'SAVE_START':
      // Save button was clicked — disable the button while in flight
      return { ...state, saving: true, error: null };

    case 'SAVE_SUCCESS':
      // Save completed — update the stored config with what the server returned
      return { ...state, saving: false, config: action.payload };

    case 'SAVE_ERROR':
      return { ...state, saving: false, error: action.payload };

    case 'STATS_LOADING':
      return { ...state, statsLoading: true };

    case 'STATS_LOADED':
      return { ...state, statsLoading: false, stats: action.payload };

    default:
      return state;
  }
};

// ── Field name mapping ────────────────────────────────────────────────────────
// This is the bridge between snake_case (Python/FastAPI) and camelCase (TypeScript/React).
// Having the mapping in one place means if your API field names change,
// you update it in one place rather than hunting through your component files.

const apiToConfig = (data: any): AgentConfig => ({
  isActive:             data.is_bot_active,
  businessName:         data.business_name,
  systemPrompt:         data.system_prompt,
  welcomeMessage:       data.welcome_message,
  model:                data.ai_model,
  language:             data.language,
  temperature:          data.temperature,
  maxTokens:            data.max_tokens,
  replyDelay:           data.reply_delay_seconds,
  plan:                 data.plan,
  monthlyMessageLimit:  data.monthly_message_limit,
  messagesUsed:         data.messages_used,
  waConnected:          data.wa_connected,
});

const configToApi = (config: Partial<AgentConfig>) => ({
  ...(config.isActive       !== undefined && { is_bot_active:        config.isActive }),
  ...(config.businessName   !== undefined && { business_name:        config.businessName }),
  ...(config.systemPrompt   !== undefined && { system_prompt:        config.systemPrompt }),
  ...(config.welcomeMessage !== undefined && { welcome_message:      config.welcomeMessage }),
  ...(config.model          !== undefined && { ai_model:             config.model }),
  ...(config.language       !== undefined && { language:             config.language }),
  ...(config.temperature    !== undefined && { temperature:          config.temperature }),
  ...(config.maxTokens      !== undefined && { max_tokens:           config.maxTokens }),
  ...(config.replyDelay     !== undefined && { reply_delay_seconds:  config.replyDelay }),
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── fetchConfig ───────────────────────────────────────────────────────────
  // Fetches the current bot config from your FastAPI GET /api/agent/config.
  // Called automatically when the My Agent page mounts.
  // Also callable manually (e.g. after navigating back to the page).

  const fetchConfig = useCallback(async () => {

    console.log("===================")
    dispatch({ type: 'CONFIG_LOADING' });
    try {
      const response = await axios.get(endpoints.agent.config);

      // The axios instance already has the Bearer token in its headers
      // from when the user logged in (set by your MainContext's setAxiosToken).
      // So you never need to manually attach the token here.
      dispatch({
        type: 'CONFIG_LOADED',
        payload: apiToConfig(response.data),
      });
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to load agent config';
      dispatch({ type: 'CONFIG_ERROR', payload: message });
    }
  }, []);

  // ── saveConfig ────────────────────────────────────────────────────────────
  // Sends only the changed fields to PUT /api/agent/config.
  // Returns true on success so the page can show a "Saved!" confirmation.
  // Returns false on failure so the page can keep the form editable.
  //
  // The reason we accept Partial<AgentConfig> is that the user might
  // only change one slider — we shouldn't send the entire config object
  // when only one field changed. The configToApi mapper handles this.

  const saveConfig = useCallback(async (updates: Partial<AgentConfig>): Promise<boolean> => {
    dispatch({ type: 'SAVE_START' });
    try {
      const response = await axios.put(endpoints.agent.config, configToApi(updates));

      // The server returns the complete updated config — we use the server's
      // version (not our local version) as the source of truth. This catches
      // any server-side transformations or defaults applied during save.
      dispatch({
        type: 'SAVE_SUCCESS',
        payload: apiToConfig(response.data),
      });
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to save agent config';
      dispatch({ type: 'SAVE_ERROR', payload: message });
      return false;
    }
  }, []);

  // ── testMessage ───────────────────────────────────────────────────────────
  // Sends a test message to POST /api/agent/test and returns the AI reply.
  // Note: this function is intentionally stateless — it doesn't dispatch
  // anything to the reducer because test results are ephemeral (they live
  // only in the test chat's local state, not in the global agent context).

  const testMessage = useCallback(async (
    payload: TestPayload
  ): Promise<TestResult | null> => {
    try {
      const response = await axios.post(endpoints.agent.test, {
        message:       payload.message,
        system_prompt: payload.systemPrompt,
        model:         payload.model,
        language:      payload.language,
        temperature:   payload.temperature,
        max_tokens:    payload.maxTokens,
      });
      return {
        reply:      response.data.reply,
        modelUsed:  response.data.model_used,
        tokensUsed: response.data.tokens_used,
      };
    } catch (error: any) {
      // Return null so the test chat can show an error bubble
      // without crashing the entire page
      console.error('Test message failed:', error);
      return null;
    }
  }, []);

  // ── fetchStats ────────────────────────────────────────────────────────────
  // Fetches the four stat cards from GET /api/agent/stats.
  // Kept separate from fetchConfig because stats may need to refresh
  // more frequently (e.g. every 60 seconds) while config rarely changes.

  const fetchStats = useCallback(async () => {
    dispatch({ type: 'STATS_LOADING' });
    try {
      const response = await axios.get(endpoints.agent.stats);
      dispatch({
        type: 'STATS_LOADED',
        payload: {
          conversationsThisMonth: response.data.conversations_this_month,
          messagesHandled:        response.data.messages_handled,
          escalationsThisMonth:   response.data.escalations_this_month,
          avgResponseTimeSeconds: response.data.avg_response_time_seconds,
        },
      });
    } catch (error) {
      console.error('Failed to load agent stats:', error);
      // Stats failing is non-critical — don't block the page over it
    }
  }, []);

  // ── Memoized value ────────────────────────────────────────────────────────
  // Same pattern as MainContext — prevents unnecessary re-renders
  // in components that consume this context.

  const memoizedValue = useMemo(() => ({
    config:        state.config,
    stats:         state.stats,
    configLoading: state.configLoading,
    statsLoading:  state.statsLoading,
    saving:        state.saving,
    error:         state.error,
    fetchConfig,
    saveConfig,
    testMessage,
    fetchStats,
  }), [
    state.config, state.stats,
    state.configLoading, state.statsLoading,
    state.saving, state.error,
    fetchConfig, saveConfig, testMessage, fetchStats,
  ]);

  return (
    <AgentContext.Provider value={memoizedValue}>
      {children}
    </AgentContext.Provider>
  );
}