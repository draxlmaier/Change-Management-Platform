// src/components/SharePointUploader.tsx
import React, { useState } from "react";
import { getAccessToken } from "../auth/getToken";
import {
  findListIdByName,
  createSpList,
  deleteAllItems,
  getExistingColumns,
  createTextColumnWithRetry,
  insertItem
} from "../services/sharepointService";
import { msalInstance } from "../auth/msalInstance";
import { upsertProjectMapping } from "../services/configService";

interface Props {
  data: any[];
  phase: string;
  projectName: string;
  onLog: (msg: string) => void;
  onUploadComplete: () => void;
}

const scopes = ["Sites.ReadWrite.All"];

const SharePointUploader: React.FC<Props> = ({
  data,
  phase,
  projectName,
  onLog,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!data.length || !projectName || !phase) {
      setStatus("Missing required data, project name, or phase.");
      return;
    }

    setUploading(true);
    setStatus("Authenticating...");
    try {
      const token = await getAccessToken(msalInstance, scopes);
      if (!token) throw new Error("Token acquisition failed.");

      const siteId = localStorage.getItem("sharepointSiteId");
      if (!siteId) throw new Error("SharePoint Site ID not found. Please resolve it first.");

      const listName = `changes_${projectName.trim()}_${phase.trim()}`;
      onLog(`Preparing to upload to SharePoint list: ${listName}`);

      let listId = await findListIdByName(siteId, listName, token);
      if (!listId) {
        onLog("Creating new SharePoint list...");
        listId = await createSpList(siteId, listName, token);
        if (!listId) throw new Error("Failed to create SharePoint list.");
      } else {
        onLog("Existing list found. Clearing old data...");
        await deleteAllItems(siteId, listId, token);
      }

      const existingCols = await getExistingColumns(siteId, listId, token);
      const allCols = Object.keys(data[0]);
      const finalCols: string[] = [];

      for (const col of allCols) {
        if (existingCols[col]) {
          finalCols.push(col);
        } else {
          const created = await createTextColumnWithRetry(siteId, listId, col, token);
          if (created) finalCols.push(col);
        }
      }

      onLog(`Uploading ${data.length} rows...`);
      let inserted = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const fields: Record<string, string> = { Title: `Row_${i + 1}` };
        for (const col of finalCols) {
          fields[col] = row[col] === "---" ? "" : String(row[col] || "");
        }

        const id = await insertItem(siteId, listId, fields, token);
        if (id) inserted++;
      }

      // ✅ Auto-save mapping to config
      upsertProjectMapping(projectName, projectName, phase, listId);

      setStatus(`✅ Uploaded ${inserted}/${data.length} rows.`);
      onLog(`✅ Upload complete: ${inserted}/${data.length} rows.`);
      onUploadComplete();
    } catch (error: any) {
      setStatus("❌ Upload failed: " + error.message);
      onLog("❌ Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleUpload}
        disabled={uploading}
        className={`px-6 py-2 rounded font-medium transition ${
          uploading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-[#1cb3d2] hover:bg-[#17a2ba]"
        }`}
      >
        {uploading ? "Uploading..." : "Upload to SharePoint"}
      </button>

      {status && (
        <p
          className={`text-sm ${
            status.startsWith("✅")
              ? "text-green-400"
              : status.startsWith("❌")
              ? "text-red-400"
              : "text-yellow-200"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
};

export default SharePointUploader;
