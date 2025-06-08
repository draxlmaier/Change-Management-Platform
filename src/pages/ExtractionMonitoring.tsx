// src/pages/ExtractionMonitoring.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import axios from 'axios';
import { getAccessToken } from '../auth/getToken';
import harnessBg from '../assets/images/harness-bg.png';

interface LogItem {
  id: string;
  fields: Record<string, any>;
}

const ExtractionMonitoring: React.FC = () => {
   const navigate = useNavigate();
  const { instance } = useMsal();

  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const fetchData = async () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem('cmConfig');
      if (!raw) throw new Error('Configuration not found');
      const { siteId } = JSON.parse(raw);
      const listId = '5f55603b-dabe-4440-966f-d14453ccbe0f';

      const token = await getAccessToken(instance, [
        'https://graph.microsoft.com/Sites.Read.All',
      ]);
      if (!token) throw new Error('Authentication failed');

      const resp = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields&$top=5000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fetched: LogItem[] = resp.data.value.map((it: any) => ({ id: it.id, fields: it.fields }));
      fetched.sort(
        (a, b) => new Date(b.fields.Created).getTime() - new Date(a.fields.Created).getTime()
      );
      setItems(fetched);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Unable to load log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;;
    if (autoRefresh) interval = setInterval(fetchData, 30000);
    return () => {
    if (interval) clearInterval(interval); 
  };
}, [autoRefresh]);

  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  const latest = items[0]?.fields;
  const start = latest?.ExtractionStart;
  const end   = latest?.ExtractionEnd;
  const duration = (() => {
    if (!start || !end) return '00:00:00';
    const s = new Date(start), e = new Date(end);
    const totalSec = Math.max(0, Math.floor((e.getTime() - s.getTime()) / 1000));
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
  })();

  return (
  <div className="relative w-full overflow-auto">
    {/* Background layers */}
    <div
      className="fixed inset-0 bg-cover bg-center -z-10"
      style={{ backgroundImage: `url(${harnessBg})` }}
    />
    <div className="fixed inset-0 bg-white/10 -z-10" />

    {/* Foreground content */}
    <div className="relative z-10 mx-auto mt-8 p-8 max-w-6xl space-y-12 text-white min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-200/50 hover:bg-gray-200/70 rounded-2xl shadow-md text-gray-900 text-sm transition"
      >
        ← Back
      </button>

      {/* Header */}
      <h1 className="text-3xl font-bold">Extraction Monitoring</h1>

      {/* Status card */}
      <div className="bg-white/95 rounded-2xl shadow-lg p-6 flex flex-col space-y-4 text-gray-800">
        <div className="flex justify-between items-center">
          <span className="bg-green-600 text-white px-4 py-2 rounded-full font-semibold">
            In Progress
          </span>
          <div className="space-y-1 text-right">
            <div>Started at: {start ? new Date(start).toLocaleTimeString() : '--'}</div>
            <div>Duration: {duration}</div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={fetchData} className="flex items-center space-x-1 text-gray-700 hover:text-gray-900">
              🔄 <span>Refresh</span>
            </button>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-600"
              />
              <span>Auto-refresh</span>
            </label>
          </div>
        </div>

        <div className="flex justify-between text-gray-800">
          <span>File: <strong>{latest?.FileName || '-'}</strong></span>
          <span>Detected: <strong>{latest?.TotalRowsDetected ?? 0}</strong> rows</span>
        </div>
      </div>

      {/* Extraction History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Extraction History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-white text-gray-800 rounded-2xl shadow-md">
            <thead>
              <tr className="bg-gray-100 text-gray-800">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">File</th>
                <th className="px-4 py-2 text-left">Detected</th>
                <th className="px-4 py-2 text-left">Inserted</th>
                <th className="px-4 py-2 text-left">Success %</th>
                <th className="px-4 py-2 text-left">Duration (s)</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(item => {
                const f = item.fields;
                return (
                  <tr key={item.id} className="bg-white border-b border-gray-200 hover:bg-gray-100 transition">
                    <td className="px-4 py-2">{new Date(f.Created).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{f.FileName}</td>
                    <td className="px-4 py-2">{f.TotalRowsDetected}</td>
                    <td className="px-4 py-2">{f.RowsInserted}</td>
                    <td className="px-4 py-2">{f.SuccessRate}%</td>
                    <td className="px-4 py-2">{f.ExtractionDurationSeconds}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4 text-gray-700">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-2xl disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-white">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-2xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default ExtractionMonitoring;
