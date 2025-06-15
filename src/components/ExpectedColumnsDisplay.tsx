// src/components/ExpectedColumnsDisplay.tsx

import React from "react";

const expectedHeadersRaw = [
  "Status - Process information",
  "OEM - Process information",
  "Carline - Process information",
  "Constructed space - Process information",
  "Realization planned - Process information",
  "Approx. realization date - Process information",
  "Start date - Process information",
  "End date - Process information",
  "Process number - Process information",
  "OEM-Offer-/ Change number - Process information",
  "Reason for changes - Process information",
  "Start date - Phase4",
  "End date - Phase4",
  "Start date - PAV - Phase4",
  "End date - PAV - Phase4",
  "Estimated costs - PAV - Phase4",
  "Tools / utilities available - PAV - Phase4",
  "Process - FMEA - PAV - Phase4",
  "PLP Relevant - PAV - Phase4",
  "Risk level actual - PAV - Phase4",
  "Start date - Phase8",
  "End date - Phase8",
  "Name - Change packages - Phase8"
];

const ExpectedColumnsDisplay: React.FC = () => {
  return (
    <div className="bg-[#014e56] p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-xl font-semibold mb-4 text-[#00f0cc]">Required Columns in Excel File</h3>
      <p className="text-sm mb-4 text-white/80">
        Please make sure your Excel file includes the following column headers exactly as shown below:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {expectedHeadersRaw.map((header, idx) => (
          <div key={idx} className="bg-white text-black rounded p-2 shadow">
            {header}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpectedColumnsDisplay;
