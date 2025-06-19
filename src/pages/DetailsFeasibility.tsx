import React from "react";
import DetailsPage from "../components/DetailsPage";

export default function DetailsFeasibility() {
  const fieldsConfig = {
    generalFields: [
      { label: "Processnumber", key: "Processnumber" },
     { label: " OEM Offer Change number", key: "OEMOfferChangenumber" },
      { label: "Status", key: "Status" },
      { label: "OEM", key: "OEM" },
      { label: "Carline", key: "Carline" },
      { label: "Constructedspace", key: "Constructedspace" },
      { label: "Handdrivers", key: "Handdrivers" },
      { label: "Projectphase", key: "Projectphase" },
       { label: "Area", key: "SheetName" },
      { label: " Reason for changes", key: "Reasonforchanges" }
    ],
    editableFields: [
      { label: " Deadline TBT", key: "DeadlineTBT" },
      { label: " Model year", key: "Modelyear" },
            { label: " OEM Change number", key: "OEMChangenumber" },
      { label: " Realization planned", key: "Realizationplanned" },
      { label: " Approx realization date", key: "Approxrealizationdate" },
      { label: " PAV Phase 4 Estimated costs", key: "EstimatedcostsPAVPhase4" },
      { label: " PAV Phase 4 Tools utilities available", key: "ToolsutilitiesavailablePAVPhase4" },
      { label: " PAV Phase 4 Process FMEA", key: "ProcessFMEAPAVPhase4" },
      { label: " PAV Phase 4 PLP Relevant", key: "PLPRelevantPAVPhase4" },
      { label: " PAV Phase4 Risk level actual", key: "RisklevelactualPAVPhase4" },
      { label: "Estimated Scrap", key: "Estimatedscrap" },
      { label: "Estimated Cost", key: "Estimatedcost" },
      { label: "Estimated Downtime", key: "Estimateddowntime" },
      { label: "estimated Change Date", key: "estimatedchangedate" },
    ],
    startEndWorkingGroup : [
      { label: " Process Start date", key: "StartdateProcessinfo" },
      { label: " Process End date", key: "EnddateProcessinfo" },
      { label: "Process Working Days", key: "WorkingDaysProcess" },
       { label: " Phase 4 Start date", key: "StartdatePhase4" },
      { label: " Phase 4 End date", key: "EnddatePhase4" },
      { label: "Phase 4 Working Days", key: "WorkingDaysPhase4" },
      { label: " PAV Phase 4 Start date", key: "StartdatePAVPhase4" },
      { label: " PAV Phase 4 End date", key: "EnddatePAVPhase4" },
      { label: " PAV Phase 4 Working Days", key: "WorkingDaysPAVPhase4" },
    ],
  };

  return <DetailsPage fieldsConfig={fieldsConfig} />;
}
