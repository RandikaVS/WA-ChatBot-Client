"use client";
import { baselightTheme } from "@/utils/theme/DefaultColors";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import './global.css'
import { MainProvider } from "./context/main";
import { AgentProvider } from "./context/agent-context/agent-provider";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={baselightTheme}>
          {/* <MainProvider> */}
            <AgentProvider>
              {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
              <CssBaseline />
              {children}
            </AgentProvider>
          {/* </MainProvider> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
