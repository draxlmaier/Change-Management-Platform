// src/components/SmartSharingManager.tsx

import React, { useState, useEffect } from "react";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";

// List of users to share with — you can load dynamically later
const availableUsers = [
  { name: "Achraf Touati EXT", email: "Achraf.Touati.extern@draexlmaier.com" },
  { name: "Achraf Touati", email: "achraf.touati@uit.university" }
];

interface Props {
  siteUrl: string;  // full site URL (personal or team site)
  listName: string;
}

const scopes = ["Sites.Manage.All", "User.Read"]; // added User.Read to get current user info

const SmartSharingManager: React.FC<Props> = ({ siteUrl, listName }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [result, setResult] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const extractHostAndPath = (fullUrl: string) => {
    const url = new URL(fullUrl);
    const hostname = url.hostname;
    let pathname = url.pathname;
    pathname = pathname.replace(/^\/sites\//, "").replace(/^\/personal\//, "").replace(/^\/+|\/+$/g, "");
    return { hostname, pathname };
  };

  // ✅ Get current user's email from Graph (once at mount)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await getAccessToken(msalInstance, ["User.Read"]);
        const response = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setCurrentUserEmail(data.mail || data.userPrincipalName);
      } catch (err) {
        console.error("Failed fetching current user", err);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleShare = async () => {
    setSharing(true);
    setResult("");

    try {
      const token = await getAccessToken(msalInstance, scopes);
      if (!token) throw new Error("Token acquisition failed.");

      const { hostname, pathname } = extractHostAndPath(siteUrl);
      const baseUrl = `https://${hostname}/sites/${pathname}`;

      for (const email of selected) {
        // ✅ Skip assigning permission to yourself
        if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
          console.log("Skipping current user (already owner)");
          continue;
        }

        // ✅ Use ensureuser to safely register any user
        const ensureUserResp = await fetch(`${baseUrl}/_api/web/ensureuser`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose"
          },
          body: JSON.stringify({
            logonName: `i:0#.f|membership|${email}`
          })
        });

        if (!ensureUserResp.ok) {
          const errorText = await ensureUserResp.text();
          throw new Error(`Failed ensuring user ${email}: ${errorText}`);
        }

        const ensureUserData = await ensureUserResp.json();
        const principalId = ensureUserData.d.Id;

        // ✅ Break role inheritance (safe if already done)
        const breakInheritanceResp = await fetch(`${baseUrl}/_api/web/lists/getbytitle('${listName}')/breakroleinheritance(true)`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Accept": "application/json;odata=verbose" }
        });

        if (!breakInheritanceResp.ok) {
          const errorText = await breakInheritanceResp.text();
          throw new Error(`Failed breaking inheritance: ${errorText}`);
        }

        // ✅ Assign permission (Contribute rights = 1073741826)
        const roleDefId = 1073741826;
        const addRoleResp = await fetch(`${baseUrl}/_api/web/lists/getbytitle('${listName}')/roleassignments/addroleassignment(principalid=${principalId},roleDefId=${roleDefId})`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Accept": "application/json;odata=verbose" }
        });

        if (!addRoleResp.ok) {
          const errorText = await addRoleResp.text();
          throw new Error(`Failed assigning permission: ${errorText}`);
        }
      }

      setResult("✅ Permissions successfully assigned.");
    } catch (err: any) {
      console.error(err);
      setResult(`❌ Error: ${err.message}`);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-[#014e56] rounded-lg">
      <h4 className="font-semibold text-lg mb-2">Assign List Permissions:</h4>

      <div className="flex flex-col gap-2">
        {availableUsers.map(user => (
          <label key={user.email} className="flex items-center space-x-2">
            <input
              type="checkbox"
              value={user.email}
              checked={selected.includes(user.email)}
              onChange={(e) => {
                const email = e.target.value;
                setSelected(prev => prev.includes(email) ? prev.filter(u => u !== email) : [...prev, email]);
              }}
            />
            <span>{user.name} ({user.email})</span>
          </label>
        ))}
      </div>

      <button
        className="mt-4 px-4 py-2 rounded bg-[#00f0cc] text-black font-semibold"
        onClick={handleShare}
        disabled={sharing || selected.length === 0}
      >
        {sharing ? "Applying..." : "Assign Permissions"}
      </button>

      {result && <p className="mt-2">{result}</p>}
    </div>
  );
};

export default SmartSharingManager;
