// src/pages/AddQuestionPage.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import { graphTokenRequest } from "../authConfig";
import { msalInstance } from "../auth/msalInstance";

interface QuestionState {
  id: string;
  description: string;
  receiverEmail: string;
  responsibleEmail: string;
  triggerOn: string;
  triggerChoice: string;
  sendIntervalValue: number;
  sendIntervalUnit: string;
  lastSent?: string;
  responseReceived?: boolean;
}

interface ListsConfig {
  siteId: string;
  questionsListId: string;
  // add other configs if necessary
}

export default function AddQuestionPage() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");

  const handleAddQuestion = async () => {
    try {
      // load stored config
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) throw new Error("Configuration missing in localStorage");
      const config: ListsConfig = JSON.parse(raw);

      // request token
      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);


      if (!token) throw new Error("No Graph token acquired");

      // fields to POST
      const newQuestionPayload = {
        fields: {
          field_0: description,      // maps to "description"
          field_3: receiverEmail,    // maps to "receiverEmail"
          field_4: responsibleEmail, // maps to "responsibleEmail"
          // any other fields you’d like to store
        },
      };

      await axios.post(
        `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items`,
        newQuestionPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // After creation, navigate back or show a success message
      navigate("/send-email/someProject/someItemId"); // adjust as needed
    } catch (err: any) {
      console.error("AddQuestion failed:", err.message);
      alert(err.message || "Add question failed");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add a New Question</h2>
      <div className="mb-2">
         <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 px-3 py-2 bg-white/20 hover:bg-white/30
                   rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>
        <label>Description</label>
        <input
          type="text"
          className="border p-1 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <label>Receiver Email</label>
        <input
          type="text"
          className="border p-1 w-full"
          value={receiverEmail}
          onChange={(e) => setReceiverEmail(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <label>Responsible Email</label>
        <input
          type="text"
          className="border p-1 w-full"
          value={responsibleEmail}
          onChange={(e) => setResponsibleEmail(e.target.value)}
        />
      </div>
      <button
        onClick={handleAddQuestion}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save
      </button>
    </div>
  );
}
