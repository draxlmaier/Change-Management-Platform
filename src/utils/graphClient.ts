import { Client } from '@microsoft/microsoft-graph-client';
import { graphTokenRequest } from '../authConfig';
import type { AccountInfo } from '@azure/msal-browser';

export function getGraphClient(instance: any, account: AccountInfo) {
  return Client.init({
    authProvider: async (done) => {
      try {
        const resp = await instance.acquireTokenSilent({
          ...graphTokenRequest,
          account,
        });
        done(null, resp.accessToken);
      } catch (e) {
        done(e as Error, null);
      }
    },
  });
}
