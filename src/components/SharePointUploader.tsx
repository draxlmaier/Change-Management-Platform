// src/components/SharePointUploader.tsx

import React, { useState } from "react";
import { getAccessToken } from "../auth/getToken";
import {
  findListIdByName,
  createSpList,
  deleteAllItems,
  getExistingColumns,
  createTextColumnWithRetry,
  getAllListItems,
  insertItem,
} from "../services/sharepointService";
import { msalInstance } from "../auth/msalInstance";
import { upsertProjectMapping, getConfig } from "../services/configService";
import uploadIcon from "../assets/images/uploadIcon.png";
import axios from "axios";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const scopes = ["Sites.ReadWrite.All", "Sites.Manage.All"];

interface Props {
  data: any[];
  phase: string;
  projectName: string;
  siteId: string | null;
  isPersonal: boolean;
  siteUrl: string;
  onLog: (msg: string) => void;
  onUploadComplete: () => void;
}

const SharePointUploader: React.FC<Props> = ({
  data,
  phase,
  projectName,
  siteId,
  onLog,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const handleUpload = async () => {
    if (!data.length || !projectName || !siteId) {
      setStatus("Missing data, project name, or site ID.");
      return;
    }

    setUploading(true);
    try {
      // 1️⃣ Authenticate
      const token = await getAccessToken(msalInstance, scopes);
      if (!token) throw new Error("Token acquisition failed.");

      //
      // 2️⃣ Prepare “changes” list...
      //
      const changesName = `changes_${projectName.trim()}_${phase.trim()}`;
      onLog(`🔧 Preparing list: ${changesName}`);
      let changesId = await findListIdByName(siteId, changesName, token);
      if (!changesId) {
        onLog("➕ Creating changes list…");
        changesId = await createSpList(siteId, changesName, token);
      }
      if (!changesId) throw new Error(`Cannot find/create list '${changesName}'`);

      // Clear raw
      const beforeRaw = await getAllListItems(siteId, changesId, token);
      onLog(`🗑️ Deleting ${beforeRaw.length} existing change items`);
      await deleteAllItems(siteId, changesId, token);

      // Ensure raw columns
      const existingRawCols = await getExistingColumns(siteId, changesId, token);
      const displayCols = Object.keys(data[0]);
      onLog(`📑 Data columns: [${displayCols.join(", ")}]`);
      for (const col of displayCols) {
        if (!existingRawCols[col]) {
          await createTextColumnWithRetry(siteId, changesId, col, token);
        }
      }
      const rawColMap = await getExistingColumns(siteId, changesId, token);

      // Insert raw rows
      onLog(`📤 Inserting ${data.length} raw change rows…`);
      let rawSuccess = 0;
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const fields: Record<string, string> = { Title: `Row_${i + 1}` };
        for (const col of displayCols) {
          fields[rawColMap[col]] = row[col] === "---" ? "" : String(row[col] ?? "");
        }
        const id = await insertItem(siteId, changesId, fields, token);
        if (id) rawSuccess++;
        onLog(`  • ${rawSuccess}/${i + 1} succeeded`);
      }
      onLog(`✅ Raw upload complete: ${rawSuccess}/${data.length}`);

      //
      // 3️⃣ Fetch QuestionTemplates...
      //
      const cfg = getConfig();
      const qListId = cfg.questionsListId;
      if (!qListId) {
        onLog("⚠️ No QuestionTemplates configured—skipping CQS");
        onUploadComplete();
        return;
      }
      onLog("🔍 Fetching QuestionTemplates…");
      const tmplResp = await axios.get(
        `${GRAPH_BASE}/sites/${siteId}/lists/${qListId}/items?$top=1000&expand=fields`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const rawTemplates = tmplResp.data.value.map((it: any) => it.fields);
      const templates = rawTemplates.filter((f: any) => !!f.Questionid);
      onLog(`✅ Valid templates: ${templates.length}`);
      if (!templates.length) {
        onLog("⚠️ No valid templates—skipping CQS");
        onUploadComplete();
        return;
      }

      //
      // 4️⃣ Build change–area mapping from in-memory rows
      //
      const changeAreaList = data.map(r => ({
        change: r.Processnumber,
        area: r.SheetName
      }));

      //
      // 5️⃣ Prepare ChangeQuestionStatus list, **ensuring “Area” column exists**...
      //
      const cqsName = `ChangeQuestionStatus_${projectName.trim()}`;
      onLog(`🔧 Preparing CQS list: ${cqsName}`);
      let cqsId = await findListIdByName(siteId, cqsName, token);
      if (!cqsId) {
        onLog("➕ Creating CQS list…");
        cqsId = await createSpList(siteId, cqsName, token);
      }
      if (!cqsId) throw new Error(`Cannot find/create CQS list '${cqsName}'`);

      // Always ensure these columns exist (including Area)
      const needed = [
        "ChangeNumber",
        "QuestionId",
        "Area",                // ← new column
        "responseReceived",
        "lastSent",
        "lastChecked",
        "conversationId",
        "internetMessageId",
        "Question",
        "TriggerOn",
        "ResponsableEmail",
        "SendIntervalValue",
        "SendIntervalUnit",
        "Action",
        "Responsiblerole",
        "emailbody",
        "emailsubject",
      ];
      const existingCqsCols = await getExistingColumns(siteId, cqsId, token);
      for (const col of needed) {
        if (!existingCqsCols[col]) {
          await createTextColumnWithRetry(siteId, cqsId, col, token);
          onLog(`➕ Created CQS column '${col}'`);
        }
      }

      // Refresh mapping
      const cqsColMap = await getExistingColumns(siteId, cqsId, token);

      // Clear old CQS items
      const beforeCqs = await getAllListItems(siteId, cqsId, token);
      onLog(`🗑️ Deleting ${beforeCqs.length} existing CQS items`);
      await deleteAllItems(siteId, cqsId, token);

      //
      // 6️⃣ Insert CQS rows (populating Area from SheetName)...
      //
      const totalCqs = changeAreaList.length * templates.length;
      onLog(`📤 Inserting ${totalCqs} CQS rows…`);
      let cqsSuccess = 0;

      for (const { change, area } of changeAreaList) {
        for (const t of templates) {
          const fields: Record<string, any> = { Title: `${change}-${t.Questionid}` };

          // Required fields
          fields[cqsColMap["ChangeNumber"]] = change;
          fields[cqsColMap["Area"]]         = area;           // ← use SheetName
          fields[cqsColMap["QuestionId"]]   = t.Questionid;
          fields[cqsColMap["responseReceived"]]  = "false";
          fields[cqsColMap["lastSent"]]          = "";
          fields[cqsColMap["lastChecked"]]       = "";
          fields[cqsColMap["conversationId"]]    = "";
          fields[cqsColMap["internetMessageId"]] = "";
          fields[cqsColMap["Question"]]          = t.Question || "";
          fields[cqsColMap["TriggerOn"]]         = t.TriggerOn || "";
          fields[cqsColMap["ResponsableEmail"]]  = t.ResponsableEmail || "";
          fields[cqsColMap["SendIntervalValue"]] = String(t.SendIntervalValue ?? "");
          fields[cqsColMap["SendIntervalUnit"]]  = t.SendIntervalUnit || "";
          fields[cqsColMap["Action"]]            = t.Action || "";
          fields[cqsColMap["Responsiblerole"]]   = t.Responsiblerole || "";
          fields[cqsColMap["emailbody"]]         = t.emailbody || "";
          fields[cqsColMap["emailsubject"]]      = t.emailsubject || "";

          // Stringify
          for (const k of Object.keys(fields)) {
            fields[k] = String(fields[k] ?? "");
          }

          const id = await insertItem(siteId, cqsId, fields, token);
          if (id) {
            cqsSuccess++;
            onLog(`  • ${cqsSuccess}/${totalCqs} succeeded`);
          } else {
            console.error(
              `❌ Failed CQS insert for ${change}/${t.Questionid}`,
              fields
            );
            onLog(`❌ Insert failed at ${change}-${t.Questionid}`);
          }
        }
      }

      onLog(`✅ Completed CQS upload: ${cqsSuccess}/${totalCqs}`);
      onUploadComplete();

    } catch (err: any) {
      setStatus(`❌ Upload failed: ${err.message}`);
      onLog(`❌ Upload failed: ${err.message}`);
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
          w-72 h-72 bg-white/20 backdrop-blur-md
          rounded-2xl shadow-lg hover:bg-white/30 hover:scale-105
          transition-transform duration-300 ease-in-out
          flex flex-col items-center justify-center text-white
        "
      >
        <img
          src={uploadIcon}
          alt="Upload"
          className="h-48 w-38 mb-6 object-contain"
        />
        <span className="text-xl font-semibold">
          {uploading ? "Uploading..." : "Upload to SharePoint"}
        </span>
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
