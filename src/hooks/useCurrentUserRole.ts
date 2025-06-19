// File: src/hooks/useCurrentUserRole.ts
import { useState, useEffect } from "react";
import { msalInstance } from "../auth/msalInstance";
import { getAccessToken } from "../auth/getToken";
import axios from "axios";

const USERS_LIST_ID = "7f101e19-338b-455c-9740-1f1aa5dd4095";
//const SITE_ID = "draexlmaier.sharepoint.com:/sites/mgmt_CMPlatform";
const SITE_ID ="https://uittunis.sharepoint.com/sites/CMHData"

interface RoleResult {
  role: string;
  permissions: string[];
  loading: boolean;
  error: string | null;
}

export function useCurrentUserRole(): RoleResult {
  const [role, setRole] = useState("Viewer");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const account = msalInstance.getActiveAccount();
        if (!account) throw new Error("No signed-in user");

        const token = await getAccessToken(msalInstance, [
          "https://graph.microsoft.com/Sites.Read.All"
        ]);

        const email = account.username.toLowerCase();

        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/lists/${USERS_LIST_ID}/items?$expand=fields&$filter=fields/email eq '${email}'`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const item = resp.data.value?.[0];
        if (item) {
          setRole(item.fields.role);
          const perms = item.fields.permissions || "";
          setPermissions(perms.split(",").map((p: string) => p.trim()));
        } else {
          setRole("Viewer");
          setPermissions([]);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load user role");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, permissions, loading, error };
}
