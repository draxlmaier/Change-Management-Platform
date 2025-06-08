// src/auth/getToken.ts
import {
  IPublicClientApplication,
  AuthenticationResult,
  InteractionRequiredAuthError,
  SilentRequest,
} from "@azure/msal-browser";
export async function getAccessToken(
  instance: IPublicClientApplication,
  scopes: string[]
): Promise<string | null> {
  const account = instance.getActiveAccount();
  if (!account) {
    console.warn("No active account—redirecting to login.");
    instance.loginRedirect({ scopes });
    return null;
  }

  const silentRequest: SilentRequest = { scopes, account };

  try {
    const response: AuthenticationResult = await instance.acquireTokenSilent(silentRequest);
    return response.accessToken;
  } catch (e: any) {
    if (e instanceof InteractionRequiredAuthError) {
      console.warn("Silent token failed—redirecting for interaction.");
      instance.acquireTokenRedirect(silentRequest);
      return null;
    }
    console.error("Token acquisition failed:", e);
    return null;
  }
}
