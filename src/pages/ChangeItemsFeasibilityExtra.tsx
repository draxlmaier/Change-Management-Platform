// src/pages/ChangeItemsFeasibilityExtra.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    implementation: string;
    feasibilityExtra?: string;
    implementationExtra?: string;
  };
}

interface ListsConfig {
  siteId: string;
  projects: IProject[];
}

interface ColumnDefinition {
  id: string;
  name: string;        // internal name
  displayName: string; // display name
}

interface ChangeItem {
  id: string;
  fields: Record<string, any>;
}

const ChangeItemsFeasibilityExtra: React.FC = () => {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [items, setItems] = useState<ChangeItem[]>([]);
  
  // Basic pagination
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) {
          setError("No configuration found in localStorage");
          return;
        }
        const config: ListsConfig = JSON.parse(raw);

        const project = config.projects.find((p) => p.id === projectKey);
        if (!project) {
          setError(`Project '${projectKey}' not found in config`);
          return;
        }

        // The Feasibility Extra list
        const extraListId = project.mapping.feasibilityExtra || "";
        if (!extraListId) {
          setError("No feasibilityExtra list assigned");
          return;
        }
        const account = msalInstance.getActiveAccount();
        if (!account) {
          setError("User not authenticated. Please sign in.");
          return;
        }

        const siteId = config.siteId;
        const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);

        if (!token) {
          setError("Authentication failed");
          return;
        }

        // 1) Fetch the columns
        const colResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${extraListId}/columns`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const colData = colResp.data.value as any[];
        const colDefs: ColumnDefinition[] = colData.map((c) => ({
          id: c.id,
          name: c.name,
          displayName: c.displayName || c.name,
        }));
        setColumns(colDefs);

        // 2) Fetch the items
        const itemResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${extraListId}/items?expand=fields&$top=5000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const rows = itemResp.data.value as any[];
        setItems(rows.map((r) => ({ id: r.id, fields: r.fields })));

        // Optionally auto-select no columns or a subset
        setSelectedCols([]);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      }
    })();
  }, [projectKey]);

  const pageCount = Math.ceil(items.length / pageSize);
  const currentItems = items.slice(page * pageSize, page * pageSize + pageSize);

  const toggleColumn = (colName: string) => {
    setSelectedCols((prev) =>
      prev.includes(colName) ? prev.filter((x) => x !== colName) : [...prev, colName]
    );
  };

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <p>Error: {error}</p>
        <button onClick={() => navigate(-1)} className="underline">
          Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 z-10 pointer-events-none" />
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 px-3 py-2 bg-white/20 hover:bg-white/30
                   rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      <div className="relative z-20 max-w-5xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold">
          Implementation Extra Changes ({projectKey?.toUpperCase()})
        </h1>

        {/* Column Selection */}
        <div className="bg-white/20 p-4 rounded-md">
          <h2 className="font-semibold mb-2">Select Columns</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {columns.map((col) => (
              <label key={col.id} className="flex items-center gap-2 px-2 py-1 bg-white/30 rounded">
                <input
                  type="checkbox"
                  checked={selectedCols.includes(col.name)}
                  onChange={() => toggleColumn(col.name)}
                />
                <span>
                  {col.displayName} <small>({col.name})</small>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-auto bg-white/20 p-4 rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/10">
                <th className="px-2 py-1 border-b border-white/40 text-left">Item ID</th>
                {columns
                  .filter((c) => selectedCols.includes(c.name))
                  .map((col) => (
                    <th key={col.name} className="px-2 py-1 border-b border-white/40 text-left">
                      {col.displayName}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((it) => (
                <tr key={it.id} className="hover:bg-white/10">
                  <td className="px-2 py-1 border-b border-white/20">{it.id}</td>
                  {columns
                    .filter((c) => selectedCols.includes(c.name))
                    .map((col) => {
                      const val = it.fields[col.name];
                      return (
                        <td key={col.name} className="px-2 py-1 border-b border-white/20">
                          {val !== undefined ? String(val) : ""}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-center items-center space-x-8 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="text-xl disabled:opacity-40"
            >
              ‹
            </button>
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
              disabled={page === pageCount - 1}
              className="text-xl disabled:opacity-40"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeItemsFeasibilityExtra;
