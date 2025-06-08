// src/pages/ReportPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import { msalInstance } from "../auth/msalInstance";
import { getAccessToken } from "../auth/getToken";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Bondi Blue: #0095B6
const BONDI_BLUE = '#0095B6';
const PAGE_SIZE = 5;

type ProjectKey = "bmw" | "lamborghini" | "mercedes";
type Phase = "implementation" | "feasibility";

interface ProjectConfig { displayName: string; mapping: Record<Phase, string>; }
interface Config { siteId: string; projects: Record<ProjectKey, ProjectConfig>; }
interface ItemFields { SheetName: string; Start_x0020_date_x0020__x002d__x: string; End_x0020_date_x0020__x002d__x00: string; }
interface ReportItem { id: string; projectKey: ProjectKey; phase: Phase; fields: ItemFields; }

const ReportPage: React.FC = () => {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // filters
  const [projectFilter, setProjectFilter] = useState<ProjectKey[]>([]);
  const [areaFilter, setAreaFilter]       = useState<string>("");
  const [startFilter, setStartFilter]     = useState<string>("");
  const [endFilter, setEndFilter]         = useState<string>("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);

  const config = useMemo<Config | null>(() => {
    const raw = localStorage.getItem("cmConfig");
    return raw ? JSON.parse(raw) : null;
  }, []);

  useEffect(() => {
    if (!config) { setError("No config"); setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const token = await getAccessToken(msalInstance, ["Sites.Read.All"]);
        if (!token) throw new Error("Token failure");
        const client = Client.init({ authProvider: (done) => done(null, token) });
        const all: ReportItem[] = [];
        for (const [projectKey, projCfg] of Object.entries(config.projects) as [ProjectKey, ProjectConfig][]) {
          for (const phase of ["implementation","feasibility"] as Phase[]) {
            const listId = projCfg.mapping[phase];
            if (!listId) continue;
            const res: any = await client
              .api(`/sites/${config.siteId}/lists/${listId}/items`)
              .expand("fields($select=SheetName,Start_x0020_date_x0020__x002d__x,End_x0020_date_x0020__x002d__x00)")
              .get();
            res.value.forEach((i: any) => all.push({ id: i.id, projectKey, phase, fields: i.fields }));
          }
        }
        setItems(all);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [config]);

  if (!config) return <div className="p-8 text-red-600">No configuration found.</div>;
  if (loading)  return <div className="p-8 text-white">Loading report…</div>;
  if (error)    return <div className="p-8 text-red-600">{error}</div>;

  // options
  const projectOpts = Object.entries(config.projects).map(([key, c]) => ({ key: key as ProjectKey, label: c.displayName }));
  const areaOpts = Array.from(new Set(items.map(i=>i.fields.SheetName))).filter(Boolean);

  // filter logic
  const filtered = items.filter(i => {
    if (projectFilter.length > 0 && !projectFilter.includes(i.projectKey)) return false;
    if (areaFilter    && i.fields.SheetName !== areaFilter) return false;
    if (startFilter   && new Date(i.fields.Start_x0020_date_x0020__x002d__x) < new Date(startFilter)) return false;
    if (endFilter     && new Date(i.fields.End_x0020_date_x0020__x002d__x00) > new Date(endFilter)) return false;
    return true;
  });

  // pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageItems = filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  // exports
  const exportExcel = () => {
    const data = filtered.map(i=>({
      Project: config.projects[i.projectKey].displayName,
      Phase:   i.phase,
      Area:    i.fields.SheetName,
      Start:   i.fields.Start_x0020_date_x0020__x002d__x,
      End:     i.fields.End_x0020_date_x0020__x002d__x00,
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new(); utils.book_append_sheet(wb, ws, "Report"); writeFile(wb, "report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const cols = ["Project","Phase","Area","Start","End"];
    const rows = filtered.map(i=>[
      config.projects[i.projectKey].displayName,
      i.phase,
      i.fields.SheetName,
      i.fields.Start_x0020_date_x0020__x002d__x,
      i.fields.End_x0020_date_x0020__x002d__x00,
    ]);
    autoTable(doc, { head:[cols], body:rows });
    doc.save("report.pdf");
  };

  return (
    <div className="relative w-full min-h-screen text-white" style={{ backgroundColor: BONDI_BLUE }}>
      <div className="relative z-10 mx-auto p-8 max-w-6xl space-y-8">
        <h1 className="text-4xl font-bold">Report</h1>

        {/* Filters and Export Buttons */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block mb-1">From</label>
                <input
                  type="date"
                  value={startFilter}
                  onChange={e=>setStartFilter(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1">To</label>
                <input
                  type="date"
                  value={endFilter}
                  onChange={e=>setEndFilter(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectOpts.map(o=>(
                <label key={o.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={projectFilter.includes(o.key)}
                    onChange={()=> setProjectFilter(prev =>
                      prev.includes(o.key) ? prev.filter(p=>p!==o.key) : [...prev, o.key]
                    )}
                    className="form-checkbox h-5 w-5 text-green-500"
                  />
                  <span className="ml-2 text-white">{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Area</label>
              <select
                value={areaFilter}
                onChange={e=>setAreaFilter(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">All</option>
                {areaOpts.map(a=>(<option key={a} value={a}>{a}</option>))}
              </select>
            </div>
            <div className="flex space-x-4">
              <button onClick={exportExcel} className="flex-1 bg-white/20 hover:bg-white/30 border border-white/40 rounded-lg py-2 text-white font-semibold">
                Export Excel
              </button>
              <button onClick={exportPDF} className="flex-1 bg-white/20 hover:bg-white/30 border border-white/40 rounded-lg py-2 text-white font-semibold">
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Paginated Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto bg-white/20 backdrop-blur-sm rounded-lg shadow-md">
            <thead>
              <tr className="bg-white/30 text-white">
                {['Project','Phase','Area','Start','End'].map(h=>(
                  <th key={h} className="px-4 py-2 text-left text-gray-900">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map(i=>(
                <tr key={i.id} className="border-b border-white/30 hover:bg-white/10 transition">
                  <td className="px-4 py-2 text-gray-900">{config.projects[i.projectKey].displayName}</td>
                  <td className="px-4 py-2 text-gray-900">{i.fields.SheetName}</td>
                  <td className="px-4 py-2 text-gray-900">{i.fields.Start_x0020_date_x0020__x002d__x}</td>
                  <td className="px-4 py-2 text-gray-900">{i.fields.End_x0020_date_x0020__x002d__x00}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center space-x-4 mt-4 text-white">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p-1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-white/20 rounded disabled:opacity-50"
          >Prev</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-white/20 rounded disabled:opacity-50"
          >Next</button>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
