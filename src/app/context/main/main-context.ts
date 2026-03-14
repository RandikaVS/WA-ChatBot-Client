// app/contexts/main-context/main-context.ts
import { createContext, useContext } from 'react';

interface MainContextValue {
  user:    any | null;
  method:  string;
  loading: boolean;
  authenticated:   boolean;
  unauthenticated: boolean;
  login:               (email: string, password: string) => Promise<void>;
  logout:              () => void;
  refreshAccessToken:  () => Promise<string | null>;
}

export const MainContext = createContext<MainContextValue>({} as MainContextValue);

// This custom hook is the clean way to consume the context.
// Instead of writing `useContext(MainContext)` everywhere, your
// components just call `useMainContext()` and get full TypeScript support.
export const useMainContext = () => {
  const context = useContext(MainContext);
  if (!context) {
    throw new Error('useMainContext must be used inside MainProvider');
  }
  return context;
};