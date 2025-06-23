import React, { useState } from "react";
import ExcelParser from "../components/ExcelParser";
import SiteResolver from "../components/SiteResolver";
import SharePointUploader from "../components/SharePointUploader";
import LogsViewer from "../components/LogsViewer";
import ExpectedColumnsDisplay from "../components/ExpectedColumnsDisplay";
import ColumnValidator from "../components/ColumnValidator";
import { useNavigate } from "react-router-dom";
import projectsIcon from "../assets/images/projectsIcon.png";
import EnsureSharePointLists from "../components/EnsureSharePointLists";
import harnessBg from "../assets/images/harness-bg.png";

const SharePointUploaderPage: React.FC = () => {
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [, setUploadComplete] = useState<boolean>(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isPersonalSite] = useState<boolean>(false);
  const [siteUrl, setSiteUrl] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [columnsCleaned, setColumnsCleaned] = useState<string[]>([]);
  const [columnsRaw, setColumnsRaw] = useState<string[]>([]);
  const [columnsValid, setColumnsValid] = useState(false);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  const handleUploadComplete = () => {
    setUploadComplete(true);
    log("✅ Upload complete.");
  };

  const handleSiteResolved = (id: string, resolvedUrl: string) => {
    setSiteId(id);
    setSiteUrl(resolvedUrl);
    log(`✅ Using SharePoint Site ID: ${id}`);
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center text-white text-lg" style={{ backgroundImage: `url(${harnessBg})` }}>
      <div className="absolute inset-0 z-10 pointer-events-none" />

      <div className="relative z-20 max-w-6xl mx-auto py-10 px-6 space-y-8">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#00f0cc]">Excel → SharePoint List Converter</h2>
          <p className="text-lg text-white/80 mt-2">Change Management Platform – Data Extraction Tool</p>
        </div>

        <ExpectedColumnsDisplay />

        {/* Excel Upload and Parse */}
        <section className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/20">
          <h3 className="text-xl font-semibold mb-4">1. Upload Excel File</h3>
          <ExcelParser
            onDataParsed={(parsed, cleaned, raw) => {
              setData(parsed);
              setColumnsCleaned(cleaned);
              setColumnsRaw(raw);
              log(`✅ Excel parsed: ${parsed.length} rows, ${cleaned.length} columns`);
            }}
            onProjectNameDetected={setProjectName}
            onLog={log}
          />

          {columnsCleaned.length > 0 && (
            <ColumnValidator
              actualColumnsRaw={columnsRaw}
              actualColumnsCleaned={columnsCleaned}
              onValidationResult={(isValid) => setColumnsValid(isValid)}
            />
          )}
        </section>

        {/* SharePoint Site Resolver */}
        <section className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/20">
          <h3 className="text-xl font-semibold mb-4">2. Resolve SharePoint Site</h3>
          <SiteResolver onResolved={handleSiteResolved} onLog={log} />
          {!siteId && (
            <p className="mt-2 text-sm text-yellow-100 italic">Please resolve the site before continuing.</p>
          )}
        </section>

        {siteId && <EnsureSharePointLists siteId={siteId} onLog={log} />}

        {/* Upload + Redirect Buttons */}
        {data.length > 0 && projectName && siteId && (
          <section className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/20">
            <h3 className="text-xl font-semibold mb-4">3. Upload to SharePoint</h3>

            {!columnsValid ? (
              <p className="text-red-400 font-medium">
                ❌ Upload blocked: Please fix missing columns before uploading.
              </p>
            ) : (
              <>
                <SharePointUploader
                  data={data}
                  phase={"phase8"}
                  projectName={projectName}
                  siteId={siteId}
                  isPersonal={isPersonalSite}
                  siteUrl={siteUrl}
                  onLog={log}
                  onUploadComplete={handleUploadComplete}
                />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-10 mt-10">
                  <button
                    onClick={() => navigate("/project-selection")}
                    className="w-72 h-72 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg hover:bg-white/30 hover:scale-105 transition transform duration-300 ease-in-out flex flex-col items-center justify-center text-white"
                  >
                    <img src={projectsIcon} alt="Projects" className="h-48 w-38 mb-6 object-contain" />
                    <span className="text-xl font-semibold">Check Projects</span>
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {/* Log Viewer */}
        <section className="bg-[#022b30] p-6 rounded-2xl shadow-md border border-white/20">
          <h3 className="text-xl font-semibold mb-4">Logs</h3>
          <div className="bg-white text-black rounded p-4 max-h-64 overflow-y-auto">
            <LogsViewer logs={logs} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default SharePointUploaderPage;
