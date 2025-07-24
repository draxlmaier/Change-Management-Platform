// src/components/dashboard/followupcost/CombinedTargetChart.tsx

import React from "react";

import { ProjectCostChart } from "./ProjectCostChart";

interface Props {
  siteId: string;
  followListId: string;
  targetListId: string;
  year: number;
}

export const CombinedTargetChart: React.FC<Props> = ({
  siteId,
  followListId,
  targetListId,
  year,
}) => {
  // just wrap ProjectCostChart with projectId="draxlmaeir"
  return (
    <ProjectCostChart
      siteId={siteId}
      followListId={followListId}
      targetListId={targetListId}
      projectId="draxlmaeir"
      year={year}
    />
  );
};
