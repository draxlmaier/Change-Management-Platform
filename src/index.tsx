// src/index.tsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

import App from "./App";
import { msalConfig } from "./authConfig";
import "./index.css";

const msalInstance = new PublicClientApplication(msalConfig);

const RootRouter: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    msalInstance
    .initialize() // Explicitly initialize the instance
      .then(() => msalInstance.handleRedirectPromise())
      .then((resp) => {
        if (resp?.account) {
          msalInstance.setActiveAccount(resp.account);
        }
      })
      .catch((e) => console.error("MSAL redirect error:", e))
      .finally(() => setLoaded(true));
  }, [/* remove navigate from deps */]);

  if (!loaded) {
    return <div>Loading authentication...</div>;
  }

  return <App />;
};

const Root: React.FC = () => (
    <HashRouter>
    <MsalProvider instance={msalInstance}>
    <RootRouter />
    </MsalProvider>
  </HashRouter>

);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<Root />);
