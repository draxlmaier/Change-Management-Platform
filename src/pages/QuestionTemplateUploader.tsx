// File: src/components/QuestionTemplateUploader.tsx

import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import { getConfig } from "../services/configService";

interface QuestionTemplate {
  Questions: string;
  TriggerOn: string;
  Action: string;
  ResponsibleRole: string;
}

const REQUIRED_COLUMNS = ["Questions", "TriggerOn", "Action", "Responsible's role"];

const QuestionTemplateUploader: React.FC = () => {
  const [rows, setRows] = useState<QuestionTemplate[]>([]);
  const [valid, setValid] = useState(false);
  const [status, setStatus] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr !== "string") return;

      const wb = XLSX.read(bstr, { type: "binary" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const casted = data.map((row: any) => ({
        Questions: row["Questions"]?.toString().trim() || "",
        TriggerOn: row["TriggerOn"]?.toString().trim() || "",
        Action: row["Action"]?.toString().trim() || "",
        ResponsibleRole: row["Responsible's role"]?.toString().trim() || "",
      }));

      const isValid = casted.every(
        (row) => row.Questions && row.TriggerOn && row.Action && row.ResponsibleRole
      );

      setRows(casted);
      setValid(isValid);
    };

    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    try {
      setStatus("Uploading...");
      const token = await getAccessToken(msalInstance, ["Sites.ReadWrite.All"]);
      const config = getConfig();

      if (!config.questionsListId || !config.siteId) {
        throw new Error("Configuration is missing");
      }

      for (const row of rows) {
        const fields = {
          Questions: row.Questions,
          TriggerOn: row.TriggerOn,
          Action: row.Action,
          ["Responsible's role"]: row.ResponsibleRole,
        };

        await axios.post(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items`,
          { fields },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setStatus(`✅ Uploaded ${rows.length} questions successfully.`);
      setRows([]);
      setValid(false);
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="bg-white/10 text-white p-6 rounded-xl shadow-md backdrop-blur-md">
      <h3 className="text-xl font-semibold mb-4">Upload Question Templates</h3>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mb-4" />

      {rows.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="table-auto w-full border text-sm">
            <thead>
              <tr className="bg-white/20">
                {REQUIRED_COLUMNS.map((col) => (
                  <th key={col} className="px-2 py-1 border">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="odd:bg-white/10">
                  <td className="border px-2 py-1">{row.Questions}</td>
                  <td className="border px-2 py-1">{row.TriggerOn}</td>
                  <td className="border px-2 py-1">{row.Action}</td>
                  <td className="border px-2 py-1">{row.ResponsibleRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        disabled={!valid}
        onClick={handleUpload}
        className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50"
      >
        Upload to QuestionTemplates
      </button>

      {status && <p className="mt-3 text-sm italic text-yellow-200">{status}</p>}
    </div>
  );
};

export default QuestionTemplateUploader;
