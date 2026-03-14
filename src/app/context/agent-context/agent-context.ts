// app/contexts/agent-context/agent-context.ts
import { createContext, useContext } from 'react';

// The shape of the agent config — mirrors what your FastAPI returns,
// but using camelCase as is conventional in TypeScript/React.
export interface AgentConfig {
  isActive:       boolean;
  businessName:   string;
  systemPrompt:   string;
  welcomeMessage: string;
  model:          string;
  language:       string;
  temperature:    number;
  maxTokens:      number;
  replyDelay:     number;
  // Read-only plan info — fetched with config, never written back
  plan:                  string;
  monthlyMessageLimit:   number;
  messagesUsed:          number;
  waConnected:           boolean;
}

export interface AgentStats {
  conversationsThisMonth:  number;
  messagesHandled:         number;
  escalationsThisMonth:    number;
  avgResponseTimeSeconds:  number;
}

interface AgentContextValue {
  // State
  config:      AgentConfig | null;
  stats:       AgentStats  | null;
  configLoading: boolean;
  statsLoading:  boolean;
  saving:      boolean;
  error:       string | null;

  // Actions — functions the page will call
  fetchConfig:  () => Promise<void>;
  saveConfig:   (updates: Partial<AgentConfig>) => Promise<boolean>;
  testMessage:  (payload: TestPayload) => Promise<TestResult | null>;
  fetchStats:   () => Promise<void>;
}

export interface TestPayload {
  message:      string;
  systemPrompt: string;
  model:        string;
  language:     string;
  temperature:  number;
  maxTokens:    number;
}

export interface TestResult {
  reply:       string;
  modelUsed:   string;
  tokensUsed:  number;
}

export const AgentContext = createContext<AgentContextValue>({} as AgentContextValue);

// The custom hook — this is what every component imports instead of
// importing the context object directly. It also gives a helpful error
// if someone accidentally uses it outside the provider.
export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used inside AgentProvider');
  }
  return context;
};