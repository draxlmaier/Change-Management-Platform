// File: src/components/FollowUpExcelUploader.tsx

import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";

interface UploadProps {
  siteId: string;
  listId: string;
  selectedProject: string;
  selectedArea: string;
  onComplete?: () => void;
}

interface EditableRow {
  Followupcost_x002f_BudgetPA: number;
  InitiationReasons: string;
  BucketID: string;
  Date: string;
  BucketResponsible: string;
  Postname_x002f_ID: string;
}

const FollowUpExcelUploader: React.FC<UploadProps> = ({
  siteId,
  listId,
  selectedProject,
  selectedArea,
  onComplete,
}) => {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parseDate = (raw: any): string => {
    const str = typeof raw === "string" ? raw : "";
    const parts = str.split(" ")[0].split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets["Data"];
      if (!sheet) throw new Error("Missing 'Data' sheet in Excel file.");

      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const editableRows = (rawRows as any[]).map((row) => {
        const cost = row["Valeur nette totale"] || 0;
        const bucketId = row["Numéro du panier"] || "";
        const postName = row["Nom du poste"] || "";
        const rawDate = row["Créé le"] || "";

        const reason = row["Demande suite AEB"]
          ? "demande suite à un changement technique (aeb)"
          : row["Demande suite optimsation"]
          ? "demande suite une optimisation"
          : row["Suite mail/reclamation"]
          ? "demande suite mail/réunion d'analyse de réclamation"
          : "";

        return {
          Followupcost_x002f_BudgetPA: parseFloat(cost),
          InitiationReasons: reason,
          BucketID: bucketId,
          Date: parseDate(rawDate),
          BucketResponsible: "",
          Postname_x002f_ID: postName,
        };
      });

      setRows(editableRows);
    } catch (err: any) {
      console.error("Parsing error:", err);
      setMsg("Erreur: " + (err.message || "Erreur de lecture du fichier."));
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof EditableRow, value: string | number) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpload = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Could not get access token.");

      for (const row of rows) {
        await axios.post(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
          {
            fields: {
              Project: selectedProject,
              Area: selectedArea,
              ...row,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      setMsg("Importation terminée avec succès.");
      setRows([]);
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error("Upload error:", err);
      setMsg("Erreur: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {rows.length > 0 && (
        <div className="overflow-x-auto border border-white/20 p-4 rounded-xl bg-white/10">
          <table className="w-full text-sm text-white">
            <thead>
              <tr>
                <th>Coût suivi / Budget PA</th>
                <th>Raison</th>
                <th>Panier ID</th>
                <th>Date</th>
                <th>Responsable</th>
                <th>Poste</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-t border-white/10">
                  <td>
                    <input
                      type="number"
                      value={row.Followupcost_x002f_BudgetPA}
                      onChange={(e) =>
                        handleRowChange(idx, "Followupcost_x002f_BudgetPA", parseFloat(e.target.value))
                      }
                      className="w-24 p-1 text-black"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.InitiationReasons}
                      onChange={(e) => handleRowChange(idx, "InitiationReasons", e.target.value)}
                      className="w-52 p-1 text-black"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.BucketID}
                      onChange={(e) => handleRowChange(idx, "BucketID", e.target.value)}
                      className="w-24 p-1 text-black"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={row.Date}
                      onChange={(e) => handleRowChange(idx, "Date", e.target.value)}
                      className="w-36 p-1 text-black"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.BucketResponsible}
                      onChange={(e) => handleRowChange(idx, "BucketResponsible", e.target.value)}
                      className="w-36 p-1 text-black"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.Postname_x002f_ID}
                      onChange={(e) => handleRowChange(idx, "Postname_x002f_ID", e.target.value)}
                      className="w-36 p-1 text-black"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
          >
            Upload All to SharePoint
          </button>
        </div>
      )}

      {loading && <p className="text-blue-300">En cours...</p>}
      {msg && <p className="text-green-300 font-semibold">{msg}</p>}
    </div>
  );
};

export default FollowUpExcelUploader;
