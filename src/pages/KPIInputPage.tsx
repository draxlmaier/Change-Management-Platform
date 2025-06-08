import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MonthlyKPIInput from '../components/dashboard/MonthlyKPIInput';
import FollowUpKPIInput from '../components/dashboard/FollowUpKPIInput';
// import ScrapFollowingInput from '../components/dashboard/ScrapFollowingInput'; // <-- future component

function useConfig() {
  const cfgJson = localStorage.getItem('cmConfig');
  return cfgJson ? JSON.parse(cfgJson) : null;
}

const tabs = [
  { id: 'monthly', label: 'Monthly KPI Entry' },
  { id: 'followup', label: 'Follow-up Cost & Budget PA' },
  { id: 'scrap', label: 'Scrap Following' },
];

const KPIInputPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useConfig();
  const [activeTab, setActiveTab] = useState('monthly');

  if (!config) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center justify-center">
        <p className="mb-4 text-lg">Configuration missing. Please configure lists first.</p>
        <button
          onClick={() => navigate('/config')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go to Config
        </button>
      </div>
    );
  }

  const { siteId, monthlyListId, followCostListId } = config;

  return (
    <div
      className="min-h-screen bg-cover bg-center p-8"
      style={{
        backgroundImage: "url('/background-cables.jpg')", // Replace with your background image path
      }}
    >
      <button onClick={() => navigate(-1)} className="mb-6 px-4 py-2 bg-blue-600 text-white rounded">
        ← Back
      </button>

      {/* Tab Menu */}
      <div className="flex justify-center space-x-6 mb-12 text-lg font-semibold border-b border-gray-300 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 ${
              activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-xl max-w-4xl mx-auto">
        {activeTab === 'monthly' && <MonthlyKPIInput siteId={siteId} listId={monthlyListId} />}
        {activeTab === 'followup' && <FollowUpKPIInput siteId={siteId} listId={followCostListId} />}
        {activeTab === 'scrap' && (
          <div className="text-center">
            {/* <ScrapFollowingInput siteId={siteId} listId={someListId} /> */}
            <h2 className="text-xl font-semibold mb-2">Scrap Following</h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIInputPage;
