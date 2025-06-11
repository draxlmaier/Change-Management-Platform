import React from "react";
import DetailsPage from "../components/DetailsPage";

export default function DetailsImplementation() {
  const fieldsConfig = {
    generalFields: [
      { label: "Process number", key: "Processnumber" },
      { label: "Status", key: "Status" },
      { label: "OEM", key: "OEM" },
      { label: "Carline", key: "Carline" },
      { label: "Constructed space", key: "Constructedspace" },
      { label: "Projectphase", key: "Projectphase" },
      { label: "DeadlineTBT", key: "DeadlineTBT" },
      { label: "Modelyear", key: "Modelyear" },
      { label: "Realizationplanned", key: "Realizationplanned" },
      { label: "Approxrealizationdate", key: "Approxrealizationdate" },
      { label: "Hand drivers", key: "Handdrivers" },
      { label: "OEMOfferChangenumber", key: "OEMOfferChangenumber" },
      { label: "Reason for changes", key: "Reasonforchanges" },
    ],
    editableFields: [
      { label: "Process start date", key: "StartdateProcessinfo" },
      { label: "Process end date", key: "EnddateProcessinfo" },
      { label: "Estimated cost", key: "Estimatedcost" },
      { label: "Estimated downtime", key: "Estimateddowntime" },
      { label: "Actual Downtime", key: "ActualDowntimecausedbythischange" },
      { label: "Actual Cost", key: "Actualcost" },
      { label: "Actual Scrap", key: "Actualscrap" },
    ],
  };

  return <DetailsPage fieldsConfig={fieldsConfig} listType="implementation" />;
}
