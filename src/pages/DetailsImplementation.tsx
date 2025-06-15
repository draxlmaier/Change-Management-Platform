// src/pages/DetailsImplementation.tsx

import React from "react";
import DetailsPage from "../components/DetailsPage";

export default function DetailsImplementation() {
  const fieldsConfig = {
    generalFields: [
      { label: "Process number", key: "Processnumber" },
      { label: "OEM Offer Change number", key: "OEMOfferChangenumber" },
      { label: "Status", key: "Status" },
      { label: "OEM", key: "OEM" },
      { label: "Carline", key: "Carline" },
      { label: "Constructed space", key: "Constructedspace" },
      { label: "Hand drivers", key: "Handdrivers" },
      { label: "Project phase", key: "Projectphase" },
      { label: "Area", key: "SheetName" },
      { label: "Reason for changes", key: "Reasonforchanges" }
    ],
    editableFields: [
      { label: "Deadline TBT", key: "DeadlineTBT" },
      { label: "Model year", key: "Modelyear" },
      { label: "OEM Change number", key: "OEMChangenumber" },
      { label: "Realization planned", key: "Realizationplanned" },
      { label: "Approx realization date", key: "Approxrealizationdate" },
      { label: "PAV Phase 4 Estimated costs", key: "EstimatedcostsPAVPhase4" },
      { label: "PAV Phase 4 Tools utilities available", key: "ToolsutilitiesavailablePAVPhase4" },
      { label: "PAV Phase 4 Process FMEA", key: "ProcessFMEAPAVPhase4" },
      { label: "PAV Phase 4 PLP Relevant", key: "PLPRelevantPAVPhase4" },
      { label: "PAV Phase4 Risk level actual", key: "RisklevelactualPAVPhase4" },
      { label: "Actual scrap", key: "Actualscrap" },
      { label: "Actual cost", key: "Actualcost" },
      { label: "Actual downtime", key: "Actualdowntime" },
      { label: "Change date", key: "Changedate" }
    ],
    startEndWorkingGroup : [
      { label: "Process Start date", key: "StartdateProcessinfo" },
      { label: "Process End date", key: "EnddateProcessinfo" },
      { label: "Process Working Days", key: "WorkingDaysProcess" },
      { label: "Phase 4 Start date", key: "StartdatePhase4" },
      { label: "Phase 4 End date", key: "EnddatePhase4" },
      { label: "Phase 4 Working Days", key: "WorkingDaysPhase4" },
      { label: "PAV Phase 4 Start date", key: "StartdatePAVPhase4" },
      { label: "PAV Phase 4 End date", key: "EnddatePAVPhase4" },
      { label: "PAV Phase 4 Working Days", key: "WorkingDaysPAVPhase4" },
      { label: "Phase 8 Start date", key: "StartdatePhase8" },
      { label: "Phase 8 End date", key: "EnddatePhase8" },
      { label: "Phase 8 Working Days", key: "WorkingDaysPAVPhase8" }
    ],
  };

  return <DetailsPage fieldsConfig={fieldsConfig} />;
}
