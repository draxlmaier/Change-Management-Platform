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
import SmartSharingManager from "./SmartSharingManager";
import uploadIcon from "../assets/images/uploadIcon.png"

interface Props {
  data: any[];
  phase: string;  
  projectName: string;
  siteId: string;
  isPersonal: boolean;
  siteUrl: string;
  onLog: (msg: string) => void;
  onUploadComplete: () => void;
}

const scopes = ["Sites.ReadWrite.All", "Sites.Manage.All"];

const SharePointUploader: React.FC<Props> = ({
  data,
  phase,
  projectName,
  siteId,
  isPersonal,
  siteUrl,
  onLog,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [listId, setListId] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!data.length || !projectName) {
      setStatus("Missing required data or project name.");
      return;
    }

    setUploading(true);
    setStatus("Authenticating...");
    try {
      const token = await getAccessToken(msalInstance, scopes);
      if (!token) throw new Error("Token acquisition failed.");

      const listName = `changes_${projectName.trim()}_${phase.trim()}`;
      onLog(`Preparing to upload to SharePoint list: ${listName}`);

      let listIdResult = await findListIdByName(siteId, listName, token);
      if (!listIdResult) {
        onLog("Creating new SharePoint list...");
        listIdResult = await createSpList(siteId, listName, token);
        if (!listIdResult) throw new Error("Failed to create SharePoint list.");
      } else {
        onLog("Existing list found. Clearing old data...");
        await deleteAllItems(siteId, listIdResult, token);
      }

      const existingCols = await getExistingColumns(siteId, listIdResult, token);
      const allCols = Object.keys(data[0]);
      const finalCols: string[] = [];

      for (const col of allCols) {
        if (existingCols[col]) {
          finalCols.push(col);
        } else {
          const created = await createTextColumnWithRetry(siteId, listIdResult, col, token);
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
        const id = await insertItem(siteId, listIdResult, fields, token);
        if (id) inserted++;
      }

      upsertProjectMapping(projectName, projectName, phase, listIdResult);

      setStatus(`✅ Uploaded ${inserted}/${data.length} rows.`);
      onLog(`✅ Upload complete: ${inserted}/${data.length} rows.`);
      setListId(listIdResult);
      onUploadComplete();
    } catch (error: any) {
      setStatus("❌ Upload failed: " + error.message);
      onLog("❌ Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col items-center">
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="
          w-72 h-72 
          bg-white/20 backdrop-blur-md 
          rounded-2xl shadow-lg
          hover:bg-white/30 hover:scale-105 
          transition transform duration-300 ease-in-out
          flex flex-col items-center justify-center text-white
        "
      >
        <img src={uploadIcon} alt="Upload" className="h-48 w-38 mb-6 object-contain" />
        <span className="text-xl font-semibold">
          {uploading ? "Uploading..." : "Upload to SharePoint"}
        </span>
      </button>

      {status && (
        <p className={`text-sm ${status.startsWith("✅") ? "text-green-400" : status.startsWith("❌") ? "text-red-400" : "text-yellow-200"}`}>
          {status}
        </p>
      )}

      {listId && isPersonal && (
        <SmartSharingManager 
          siteUrl={siteUrl} 
          listName={`changes_${projectName.trim()}_${phase.trim()}`} 
        />
      )}
    </div>
  );
};

export default SharePointUploader;
