// src/components/dashboard/KPIInput.tsx

import React, { useState } from "react";
import { getGraphClient } from "../../utils/graphClient";
import "isomorphic-fetch";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";


interface KPIInputProps {
  siteId: string;
  listId: string;
}
interface KPIForm {
  project: string;
  area: string;
  followUpCost: number;
  initiationReason: string;
  basketId: string;
  entryDate: string;
  responsible: string;
  postName: string;
}

export default function KPIInput({ siteId, listId }: KPIInputProps) {
  const [form, setForm] = useState<KPIForm>({
    project: "Lamborghini",
    area: "Innenraum",
    followUpCost: 0,
    initiationReason: "demande suite à un changement technique (aeb)",
    basketId: "",
    entryDate: new Date().toISOString().slice(0, 10),
    responsible: "",
    postName: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const account = msalInstance.getActiveAccount();
      if (!account) {
        throw new Error("No active MSAL account. Please log in first.");
      }

      
    const graphClient = getGraphClient(msalInstance, account);
      await graphClient.api(`/sites/${siteId}/lists/${listId}/items`).post({
        fields: {
          Project: form.project,
          Area: form.area,
          Followupcost_x002f_BudgetPA: form.followUpCost,
          InitiationReasons: form.initiationReason,
          BucketID: form.basketId,
          Date: form.entryDate,
          BucketResponsible: form.responsible,
          Postname_x002f_ID: form.postName,
        },
      });

      setMsg("Record saved!");
      setForm((prev) => ({
        ...prev,
        followUpCost: 0,
        basketId: "",
        responsible: "",
        postName: "",
      }));
    } catch (error) {
      console.error(error);
      setMsg("Error saving record");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && <div className="text-sm">{msg}</div>}

      {/*
        Put your actual input fields here, similar to the approach in
        FollowUpKPIInput or MonthlyKPIInput, updating the `form` state
      */}

      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
