import React from "react";
import DetailsPage2 from "../components/DetailsPage2";

export default function DetailsFeasibility() {
  const fieldsConfig = {
    generalFields: [
      { label: "Process Number", key: "Processnumber" },
      { label: "OEM Offer Change number", key: "OEMOfferChangenumber" },
      { label: "OEM", key: "OEM" },
      { label: "Carline", key: "Carline" },
      { label: "Area", key: "SheetName" },
      { label: "Constructed space", key: "Constructedspace" },
      { label: "Hand drivers", key: "Handdrivers" },
      { label: "Project phase", key: "Projectphase" },
      { label: "Deadline TBT", key: "DeadlineTBT" },
      { label: "Model year", key: "Modelyear" },
      { label: "Realization planned", key: "Realizationplanned" },
      { label: "Approx realization date", key: "Approxrealizationdate" },
      { label: "Process Start date", key: "StartdateProcessinfo" },
      { label: "Process End date", key: "EnddateProcessinfo" },
      { label: "Process Working Days", key: "WorkingDaysProcess" },
        { label: "OEM Change number", key: "OEMChangenumber" },
        { label: "Reason for changes", key: "Reasonforchanges" },
    ],
    editableFields: [
      // Phase 4
      { label: "Phase 4 Start date", key: "StartdatePhase4" },
      { label: "Phase 4 End date", key: "EnddatePhase4" },
      { label: "Phase 4 Working Days", key: "WorkingDaysPhase4" },

      // PAV Phase 4 Subsection
      { label: "PAV Phase 4 Start date", key: "StartdatePAVPhase4" },
      { label: "PAV Phase 4 End date", key: "EnddatePAVPhase4" },
      { label: "PAV Phase 4 Working Days", key: "WorkingDaysPAVPhase4" },
      { label: "PAV Phase 4 Estimated costs", key: "EstimatedcostsPAVPhase4" },
      { label: "PAV Phase 4 Tools utilities available", key: "ToolsutilitiesavailablePAVPhase4" },
      { label: "PAV Phase 4 Process FMEA", key: "ProcessFMEAPAVPhase4" },
      { label: "PAV Phase 4 PLP Relevant", key: "PLPRelevantPAVPhase4" },
      { label: "PAV Phase4 Risk level actual", key: "RisklevelactualPAVPhase4" },

      // Phase 4 additional
      { label: "Estimated Scrap in € ", key: "Estimatedscrap" }, 
      { label: "Estimated Cost in € ", key: "Estimatedcost" },
      { label: "Estimated Downtime in minutes ", key: "Estimateddowntime" },
      { label: "Estimated Change Date", key: "estimatedchangedate" },
    ],
    startEndWorkingGroup: [], // moved all relevant fields to above sections
  };

  return <DetailsPage2 fieldsConfig={fieldsConfig} />;
}
