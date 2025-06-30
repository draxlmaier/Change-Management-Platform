import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";
import ProjectCarousel from "../../components/ProjectCarousel";

interface IProject {
  id: string;
  displayName: string;
  mapping: {
    implementation: string;
  };
}

interface EditableRow {
  Project: string;                 // User select
  Area: string;                    // User select
  Carline: string;                 // User select
  FollowupcostBudgetPA: number;    // "Valeur nette totale"
  InitiationReasons: string;       // User select (select per row)
  BucketID: string;                // "Numéro du panier"
  Date: string;                    // "Créé le"
  Statut: string;                  // "Statut"
  Quantity: number;                // "Quantité"
  NettValue: number;               // "Valeur nette"
  TotalNettValue: number;          // "Valeur nette totale"
  Currency: string;                // "Devise"
  BucketResponsible: string;       // (user input, can be blank)
  PostnameID: string;              // "Nom du poste"
  selected?: boolean;
}

interface UploadProps {
  siteId: string;
  listId: string;
  projects: IProject[];
  onComplete?: () => void;
}

// Helper to extract all carlines from Parameters string
function extractCarlines(parameters: string): string[] {
  const match = parameters.match(/Carline:\s*([^|]+)/i);
  if (match) {
    return match[1].split(",").map(x => x.trim()).filter(Boolean);
  }
  return [];
}

const FollowUpExcelUploader: React.FC<UploadProps> = ({
  siteId,
  listId,
  projects,
  onComplete,
}) => {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Bulk assignment state
  const [bulkProjectId, setBulkProjectId] = useState<string>("");
  const [bulkArea, setBulkArea] = useState<string>("");
  const [bulkCarline, setBulkCarline] = useState<string>("");

  // Carline options for the selected bulk project
  const [bulkProjectCarlines, setBulkProjectCarlines] = useState<string[]>([]);

  // For "Select All"
  const allSelected = rows.length > 0 && rows.every(r => r.selected);
  const someSelected = rows.some(r => r.selected);

  // --- Fetch Carlines when project changes ---
  useEffect(() => {
    const fetchCarlineValues = async () => {
      setBulkCarline("");
      setBulkProjectCarlines([]);
      if (!siteId || !bulkProjectId) return;
      const project = projects.find((p) => p.id === bulkProjectId);
      if (!project?.mapping?.implementation) return;

      try {
        const account = msalInstance.getActiveAccount();
        if (!account) throw new Error("User not authenticated.");
        const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);
        if (!token) throw new Error("No token available");
        const listIdImpl = project.mapping.implementation;
        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listIdImpl}/items?$expand=fields($select=Parameters)`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Get all carlines, flatten, dedupe, and sort
        const carlineSet = new Set<string>();
        response.data.value.forEach((item: any) => {
          const carlines = extractCarlines(String(item.fields?.Parameters ?? ""));
          carlines.forEach(c => carlineSet.add(c));
        });
        setBulkProjectCarlines(Array.from(carlineSet).sort());
      } catch (error) {
        setBulkProjectCarlines([]);
      }
    };
    fetchCarlineValues();
  }, [siteId, bulkProjectId, projects]);

  // --- Excel parser ---
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

      const editableRows = (rawRows as any[]).map((row) => ({
        Project: "",
        Area: "",
        Carline: "",
        FollowupcostBudgetPA: Number(row["Valeur nette totale"] || 0),
        InitiationReasons: "",
        BucketID: row["Numéro du panier"] || "",
        Date: row["Créé le"] || "",
        Statut: row["Statut"] || "",
        Quantity: Number(row["Quantité"] || 0),
        NettValue: Number(row["Valeur nette"] || 0),
        TotalNettValue: Number(row["Valeur nette totale"] || 0),
        Currency: row["Devise"] || "",
        BucketResponsible: row["Responsable"] || "",
        PostnameID: row["Nom du poste"] || "",
        selected: false,
      }));

      setRows(editableRows);
    } catch (err: any) {
      setMsg("Erreur: " + (err.message || "Erreur de lecture du fichier."));
    } finally {
      setLoading(false);
    }
  };

  // Row change handler (works for all fields)
  const handleRowChange = (index: number, field: keyof EditableRow, value: any) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Select/deselect all rows
  const handleSelectAll = (checked: boolean) => {
    setRows(prev => prev.map(row => ({ ...row, selected: checked })));
  };

  // Select/deselect single row
  const handleSelectRow = (idx: number, checked: boolean) => {
    setRows(prev => prev.map((row, i) => (i === idx ? { ...row, selected: checked } : row)));
  };

  // Bulk assign selected values to selected rows
  const handleBulkAssign = () => {
    setRows(prev =>
      prev.map(row =>
        row.selected
          ? {
              ...row,
              Project: bulkProjectId,
              Area: bulkArea,
              Carline: bulkCarline,
            }
          : row
      )
    );
  };

  // Only these fields must be filled to upload
  const handleUpload = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Could not get access token.");

      const validRows = rows.filter(row =>
        row.Project && row.Area && row.Carline && row.InitiationReasons
      );

      if (validRows.length === 0) {
        setMsg("Aucune ligne valide à importer. Veuillez remplir tous les champs obligatoires.");
        setLoading(false);
        return;
      }

      for (const row of validRows) {
        await axios.post(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
          {
            fields: {
              Project: row.Project,
              Area: row.Area,
              Carline: row.Carline,
              FollowupcostBudgetPA: row.FollowupcostBudgetPA,
              InitiationReasons: row.InitiationReasons,
              BucketID: row.BucketID,
              Date: row.Date,
              Statut: row.Statut,
              Quantity: row.Quantity,
              NettValue: row.NettValue,
              TotalNettValue: row.TotalNettValue,
              Currency: row.Currency,
              BucketResponsible: row.BucketResponsible,
              PostnameID: row.PostnameID,
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
      setMsg("Erreur: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* --- FILE UPLOAD --- */}
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {rows.length > 0 && (
        <div>
          {/* --- Project Carousel, Area, Carline bulk selectors --- */}
          <div className="mb-4 p-4 rounded-xl bg-white/10 border border-white/20 w-full">
            <p className="mb-2 font-semibold text-blue-100">
              Sélectionner des lignes puis appliquer un projet, une zone et un carline à ces lignes :
            </p>
            <div className="mb-2">
              <ProjectCarousel
                projects={projects}
                selectedProject={bulkProjectId}
                onProjectSelect={setBulkProjectId}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Area select */}
              <select
                value={bulkArea}
                onChange={e => setBulkArea(e.target.value)}
                className="p-2 rounded text-black min-w-[140px]"
              >
                <option value="">-- Zone --</option>
                <option>MR</option>
                <option>Innenraum</option>
                <option>Autarke</option>
                <option>Cockpit</option>
              </select>
              {/* Carline select */}
              <select
                value={bulkCarline}
                onChange={e => setBulkCarline(e.target.value)}
                className="p-2 rounded text-black min-w-[140px]"
              >
                <option value="">-- Carline --</option>
                {bulkProjectCarlines.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={!someSelected || !bulkProjectId || !bulkArea || !bulkCarline}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
              >
                Appliquer aux lignes sélectionnées
              </button>
            </div>
          </div>
          {/* --- TABLE PREVIEW --- */}
          <div className="overflow-x-auto border border-white/20 p-4 rounded-xl bg-white/10">
            <table className="w-full text-sm text-white">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Panier ID</th>
                  <th>Projet</th>
                  <th>Zone</th>
                  <th>Carline</th>
                  <th>Raison</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td>
                      <input
                        type="checkbox"
                        checked={!!row.selected}
                        onChange={e => handleSelectRow(idx, e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.BucketID}
                        onChange={e => handleRowChange(idx, "BucketID", e.target.value)}
                        className="w-32 p-1 text-black"
                      />
                    </td>
                    <td>
                      {projects.find(p => p.id === row.Project)?.displayName || ""}
                    </td>
                    <td>
                      {row.Area}
                    </td>
                    <td>
                      {row.Carline}
                    </td>
                    <td>
                      <select
                        value={row.InitiationReasons}
                        onChange={e => handleRowChange(idx, "InitiationReasons", e.target.value)}
                        className="p-1 text-black"
                        required
                      >
                        <option value="">Sélectionnez la raison</option>
                        <option value="Demande suite AEB">Demande suite AEB</option>
                        <option value="Demande suite optimsation">Demande suite optimsation</option>
                        <option value="Suite mail/reclamation">Suite mail/reclamation</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleUpload}
              disabled={loading || !rows.some(row =>
                row.Project && row.Area && row.Carline && row.InitiationReasons
              )}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
            >
              Upload All to SharePoint
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-blue-300">En cours...</p>}
      {msg && <p className="text-green-300 font-semibold">{msg}</p>}
    </div>
  );
};

export default FollowUpExcelUploader;
