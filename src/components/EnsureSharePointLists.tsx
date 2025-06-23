// File: src/components/EnsureSharePointLists.tsx

import React, { useState } from "react";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import { getConfig, saveConfig } from "../services/configService";

interface Props {
  siteId: string;
  onLog: (msg: string) => void;
}

const REQUIRED_LISTS = [
  {
    name: "MonthlyKPIs",
    fields: [
      { name: "Project", type: "Text" },
      { name: "year", type: "Text" },
      { name: "Month", type: "Text" },
      { name: "Monthid", type: "Text" },
      { name: "DRXIdeasubmittedIdea", type: "Number" },
      { name: "DRXIdeasubmittedIdeaGoal", type: "Number" },
      { name: "productionminutes", type: "Number" },
      { name: "downtime", type: "Number" },
      { name: "rateofdowntime", type: "Number" },
      { name: "Targetdowntime", type: "Number" },
      { name: "seuildinterventiondowntime", type: "Number" },
      { name: "Budgetdepartment", type: "Number" },
      { name: "Budgetdepartmentplanified", type: "Number" },
    ],
  },
  {
    name: "QuestionTemplates",
    fields: [
      { name: "Questions", type: "Text" },
      { name: "TriggerOn", type: "Text" },
      { name: "ResponsableEmail", type: "Text" },
      { name: "SendIntervalValue", type: "Number" },
      { name: "SendIntervalUnit", type: "Text" },
      { name: "Action", type: "Text" },
      { name: "Responsible's role", type: "Text" },
      { name: "lastSent", type: "Text" },
      { name: "responseReceived", type: "Text" },
      { name: "emailbody", type: "Text" },
      { name: "emailsubject", type: "Text" },
      { name: "conversationId", type: "Text" },
      { name: "internetMessageId", type: "Text" },
      { name: "lastChecked", type: "Text" },
    ],
  },
  {
    name: "FollowCostKPI",
    fields: [
      { name: "Project", type: "Text" },
      { name: "Area", type: "Text" },
      { name: "Followupcost_x002f_BudgetPA", type: "Number" },
      { name: "InitiationReasons", type: "Text" },
      { name: "BucketID", type: "Text" },
      { name: "Date", type: "Text" },
      { name: "BucketResponsible", type: "Text" },
      { name: "Postname_x002f_ID", type: "Text" },
    ],
  },
  {
    name: "users",
    fields: [
      { name: "email", type: "Text" },
      { name: "role", type: "Text" },
      { name: "name", type: "Text" },
      { name: "permissions", type: "Text" },
    ],
  },
];

const EnsureSharePointLists: React.FC<Props> = ({ siteId, onLog }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLists = async () => {
    try {
      setIsCreating(true);
      const token = await getAccessToken(msalInstance, ["Sites.Manage.All"]);
      const existingLists = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$select=displayName`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const existingNames = existingLists.data.value.map((list: { displayName: string }) => list.displayName);

      const currentConfig = getConfig();
      const updatedConfig = { ...currentConfig };

      for (const list of REQUIRED_LISTS) {
        if (!existingNames.includes(list.name)) {
          const createdList = await axios.post(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
            {
              displayName: list.name,
              columns: list.fields.map((f) => ({
                name: f.name,
                text: f.type === "Text" ? {} : undefined,
                number: f.type === "Number" ? {} : undefined,
              })),
              list: { template: "genericList" },
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const listId = createdList.data.id;
          switch (list.name) {
            case "MonthlyKPIs":
              updatedConfig.monthlyListId = listId;
              break;
            case "QuestionTemplates":
              updatedConfig.questionsListId = listId;
              break;
            case "FollowCostKPI":
              updatedConfig.followCostListId = listId;
              break;
            case "users":
              updatedConfig.usersListId = listId;
              break;
          }

          onLog(`✅ Created list '${list.name}'`);
        } else {
          onLog(`ℹ️ List '${list.name}' already exists.`);
        }
      }

      updatedConfig.siteId = siteId;
      saveConfig(updatedConfig);
      onLog("✅ Configuration saved to localStorage.");
    } catch (err: any) {
      onLog(`❌ Error: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="my-6">
      <button
        disabled={isCreating}
        onClick={handleCreateLists}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isCreating ? "Checking/Creating Lists..." : "🔧 Ensure Required SharePoint Lists Exist"}
      </button>
    </div>
  );
};

export default EnsureSharePointLists;
