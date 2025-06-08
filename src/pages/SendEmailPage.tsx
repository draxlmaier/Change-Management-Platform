// src/pages/SendEmailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { graphTokenRequest } from "../authConfig";
import harnessBg from "../assets/images/harness-bg.png";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    feasibility: string;
    implementation: string;
  };
}

interface ListsConfig {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  projects: IProject[];
}

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

const SendEmailPage: React.FC = () => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [processNumber, setProcessNumber] = useState("");
  const [carline, setCarline] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For displaying the project logo
  const [project, setProject] = useState<IProject | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) {
          setError("Configuration missing");
          setLoading(false);
          return;
        }
        const config: ListsConfig = JSON.parse(raw);

        // find the matching project
        const foundProject = config.projects.find((p) => p.id === projectKey);
        if (!foundProject) {
          setError(`No project found for key "${projectKey}"`);
          setLoading(false);
          return;
        }
        setProject(foundProject);

        const listId = foundProject.mapping.implementation;
        if (!listId) {
          setError("No implementation list assigned");
          setLoading(false);
          return;
        }

        const token = await getAccessToken(instance, graphTokenRequest.scopes);
        if (!token) throw new Error("No Graph token");

        // Load item to get ProcessNumber / Carline
        const itemResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const f = itemResp.data.fields;
        setProcessNumber(f["Process_x0020_number_x0020__x002"] || "");
        setCarline(f["Carline_x0020__x002d__x0020_Proc"] || "");

        // Load questions
        const qsResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items?$top=5000&expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const qsData: QuestionState[] = qsResp.data.value
          .map((item: any) => ({
            id: item.id,
            description: item.fields["field_0"],
            receiverEmail: item.fields["field_3"] || "",
            responsibleEmail: item.fields["field_4"] || "",
            triggerOn: item.fields["field_2"] || "Oui",
            triggerChoice: "",
            sendIntervalValue: item.fields["field_6"] || 3,
            sendIntervalUnit: item.fields["field_7"] || "Days",
            lastSent: item.fields["field_8"],
            responseReceived: item.fields["field_9"],
          }))
          .sort((a: QuestionState, b: QuestionState) =>
            a.description.localeCompare(b.description)
          );
        setQuestions(qsData);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [instance, projectKey, itemId]);

  const patchField = async (id: string, name: string, val: any) => {
    const raw = localStorage.getItem("cmConfigLists");
    if (!raw) return;
    const config: ListsConfig = JSON.parse(raw);
    const token = await getAccessToken(instance, graphTokenRequest.scopes);
    if (!token) return;

    await axios.patch(
      `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items/${id}/fields`,
      { [name]: val },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const sendMail = async (q: QuestionState) => {
    const token = await getAccessToken(instance, graphTokenRequest.scopes);
    if (!token) return;

    // Send mail
    await axios.post(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        message: {
          subject: `Update – ${processNumber}`,
          body: { contentType: "text", content: q.description },
          toRecipients: [{ emailAddress: { address: q.receiverEmail } }],
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Update "field_8" with last sent time
    await patchField(q.id, "field_8", new Date().toISOString());
  };

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />

      {/* Fixed header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-30 px-4">
        <button
          onClick={() => navigate(`/details/${projectKey}/implementation/${itemId}`)}
          className="px-3 py-2 bg-white/20 rounded text-white"
        >
          ← Back
        </button>
      </div>

      {/* Content panel */}
      <div className="relative z-20 w-full p-8 space-y-6 text-white">
        {/* Show project logo if present */}
        {project?.logo && (
          <img
            src={project.logo}
            alt={`${project.displayName} logo`}
            className="h-16 w-auto mb-4"
          />
        )}
        <h1 className="text-2xl font-bold">Automatic Mail</h1>
        <p>
          <strong>Process Number:</strong> {processNumber}
        </p>
        <p>
          <strong>Carline:</strong> {carline}
        </p>

        {/* Headers */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_4fr_2fr_2fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-white font-semibold">
          <div>Trigger</div>
          <div>Description</div>
          <div>Receiver</div>
          <div>Responsible</div>
          <div>Interval</div>
          <div>Last Sent</div>
          <div>Response?</div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_4fr_2fr_2fr_1fr_1fr_1fr] gap-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md p-4 text-white"
            >
              {/* Trigger */}
              <div className="flex items-center space-x-2">
                {["Oui", "Non"].map((opt) => (
                  <label key={opt} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`trigger-${q.id}`}
                      value={opt}
                      checked={q.triggerChoice === opt}
                      onChange={async () => {
                        setQuestions((curr) =>
                          curr.map((x) => (x.id === q.id ? { ...x, triggerChoice: opt } : x))
                        );
                        if (opt === q.triggerOn) await sendMail(q);
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {/* Description */}
              <div className="font-semibold">{q.description}</div>

              {/* Receiver Email */}
              <div>{q.receiverEmail}</div>

              {/* Responsible Email */}
              <div>{q.responsibleEmail}</div>

              {/* Interval */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  min={1}
                  value={q.sendIntervalValue}
                  onChange={async (e) => {
                    const v = +e.target.value;
                    setQuestions((curr) =>
                      curr.map((x) => (x.id === q.id ? { ...x, sendIntervalValue: v } : x))
                    );
                    await patchField(q.id, "field_6", v);
                  }}
                  className="w-16 bg-white bg-opacity-80 rounded px-2 py-1 text-black"
                />
                <select
                  value={q.sendIntervalUnit}
                  onChange={async (e) => {
                    const u = e.target.value;
                    setQuestions((curr) =>
                      curr.map((x) => (x.id === q.id ? { ...x, sendIntervalUnit: u } : x))
                    );
                    await patchField(q.id, "field_7", u);
                  }}
                  className="bg-white bg-opacity-80 rounded px-2 py-1 text-black"
                >
                  <option>Seconds</option>
                  <option>Minutes</option>
                  <option>Days</option>
                </select>
              </div>

              {/* Last Sent */}
              <div className="text-center">{q.lastSent || "-"}</div>

              {/* Response Received */}
              <div className="text-center">{q.responseReceived ? "Yes" : "No"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SendEmailPage;
