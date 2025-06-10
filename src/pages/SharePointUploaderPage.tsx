// src/pages/SharePointUploaderPage.tsx
import React, { useState } from "react";
import PhaseSelector from "../components/PhaseSelector";
import ExcelParser from "../components/ExcelParser";
import SiteResolver from "../components/SiteResolver";
import SharePointUploader from "../components/SharePointUploader";
import LogsViewer from "../components/LogsViewer";
import HeaderWithBack from "../components/HeaderWithBack";

const SharePointUploaderPage: React.FC = () => {
  const [phase, setPhase] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [projectName, setProjectName] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [phaseLocked, setPhaseLocked] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [siteResolved, setSiteResolved] = useState<boolean>(false);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  const handlePhaseSelect = (p: string) => {
    if (!phaseLocked) {
      setPhase(p === phase ? "" : p); // toggle selection
      log(p === phase ? "Phase deselected" : `Phase selected: ${p}`);
    }
  };

  const handleUploadComplete = () => {
    setUploadComplete(true);
    setPhaseLocked(false);
    log("✅ Upload complete. Phase selection unlocked.");
  };

  const handleSiteResolved = (id: string) => {
    log(`✅ Using SharePoint Site ID: ${id}`);
    setSiteResolved(true);
  };

  return (
    <div className="min-h-screen bg-[#013941] text-white px-6 py-8 font-sans">
      <HeaderWithBack />

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#00f0cc]">Excel → SharePoint List Converter</h2>
        <p className="text-lg text-white/80 mt-2">
          Change Management Platform – Data Extraction Tool
        </p>
      </div>

      {/* Phase Selector */}
      <section className="mb-6 bg-[#014e56] p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">1. Select Phase</h3>
          {phase && (
            <span className="bg-[#00f0cc] text-black px-3 py-1 rounded font-semibold">
              Selected: {phase}
            </span>
          )}
        </div>
        <PhaseSelector selectedPhase={phase} onSelectPhase={handlePhaseSelect} disabled={phaseLocked} />
        {phaseLocked && !uploadComplete && (
          <p className="mt-2 text-sm text-yellow-200 italic">
            Phase selection is locked. Finish uploading to unlock.
          </p>
        )}
      </section>

      {/* Excel Upload and Parse */}
      <section className="mb-6 bg-[#014e56] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">2. Upload Excel File</h3>
        <ExcelParser
          phase={phase}
          onDataParsed={(parsed) => {
            setData(parsed);
            setPhaseLocked(true);
          }}
          onProjectNameDetected={setProjectName}
          onLog={log}
        />
      </section>

      {/* SharePoint Site Resolver */}
      <section className="mb-6 bg-[#014e56] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">3. Resolve SharePoint Site</h3>
        <SiteResolver onResolved={handleSiteResolved} onLog={log} />
        {!siteResolved && (
          <p className="mt-2 text-sm text-yellow-100 italic">Please resolve the site before continuing.</p>
        )}
      </section>

      {/* Upload Button and Process */}
      {data.length > 0 && projectName && phase && siteResolved && (
        <section className="mb-6 bg-[#014e56] p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">4. Upload to SharePoint</h3>
          <SharePointUploader
            data={data}
            phase={phase}
            projectName={projectName}
            onLog={log}
            onUploadComplete={handleUploadComplete}
          />
        </section>
      )}

      {/* Log Viewer */}
      <section className="bg-[#022b30] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Logs</h3>
        <div className="bg-white text-black rounded p-4 max-h-64 overflow-y-auto">
          <LogsViewer logs={logs} />
        </div>
      </section>
    </div>
  );
};

export default SharePointUploaderPage;
