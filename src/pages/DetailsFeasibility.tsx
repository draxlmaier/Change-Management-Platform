import React from "react";
import DetailsPage from "../components/DetailsPage";

export default function DetailsFeasibility() {
  const fieldsConfig = {
    generalFields: [
      { label: "Processnumber", key: "Processnumber" },
      { label: "Status", key: "Status" },
      { label: "OEM", key: "OEM" },
      { label: "Carline", key: "Carline" },
      { label: "Constructedspace", key: "Constructedspace" },
      { label: "Handdrivers", key: "Handdrivers" },
      { label: "Projectphase", key: "Projectphase" },
    ],
    editableFields: [
      { label: "DeadlineTBT", key: "DeadlineTBT" },
      { label: "Modelyear", key: "Modelyear" },
      { label: "Realizationplanned", key: "Realizationplanned" },
      { label: "Approxrealizationdate", key: "Approxrealizationdate" },
      { label: "StartdateProcessinfo", key: "StartdateProcessinfo" },
      { label: "EnddateProcessinfo", key: "EnddateProcessinfo" },
      { label: "OEMOfferChangenumber", key: "OEMOfferChangenumber" },
      { label: "OEMChangenumber", key: "OEMChangenumber" },
      { label: "Reasonforchanges", key: "Reasonforchanges" },
      { label: "StartdatePhase4", key: "StartdatePhase4" },
      { label: "EnddatePhase4", key: "EnddatePhase4" },
      { label: "StartdatePAVPhase4", key: "StartdatePAVPhase4" },
      { label: "EnddatePAVPhase4", key: "EnddatePAVPhase4" },
      { label: "EstimatedcostsPAVPhase4", key: "EstimatedcostsPAVPhase4" },
      { label: "ToolsutilitiesavailablePAVPhase4", key: "ToolsutilitiesavailablePAVPhase4" },
      { label: "ProcessFMEAPAVPhase4", key: "ProcessFMEAPAVPhase4" },
      { label: "PLPRelevantPAVPhase4", key: "PLPRelevantPAVPhase4" },
      { label: "RisklevelactualPAVPhase4", key: "RisklevelactualPAVPhase4" },
      { label: "Parameters", key: "Parameters" },
      { label: "Estimatedscrap", key: "Estimatedscrap" },
      { label: "Estimatedcost", key: "Estimatedcost" },
      { label: "Estimateddowntime", key: "Estimateddowntime" },
      { label: "estimatedchangedate", key: "estimatedchangedate" },
      { label: "SheetName", key: "SheetName" },
      { label: "WorkingDaysProcess", key: "WorkingDaysProcess" },
      { label: "WorkingDaysPhase4", key: "WorkingDaysPhase4" },
      { label: "WorkingDaysPAVPhase4", key: "WorkingDaysPAVPhase4" },
    ],
  };

  return <DetailsPage fieldsConfig={fieldsConfig} listType="feasibility" />;
}
