// src/auth/msalInstance.ts
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../authConfig";

console.log("MSAL will use redirectUri:", msalConfig.auth.redirectUri);

export const msalInstance = new PublicClientApplication(msalConfig);
// Properly initialize
await msalInstance.initialize();
