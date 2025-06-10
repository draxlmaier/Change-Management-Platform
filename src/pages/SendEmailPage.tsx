import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { graphTokenRequest } from "../authConfig";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";

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
  action: string;
  responsibleEmail: string;
  responsibleRole: string;
  triggerOn: string;
  triggerChoice: string;
  sendIntervalValue: number;
  sendIntervalUnit: string;
  lastSent?: string;
  responseReceived?: boolean;
  conversationId?: string;
  internetMessageId?: string;
}

const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 min

const SendEmailPage: React.FC = () => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [processnumber, setProcessNumber] = useState("");
  const [carline, setCarline] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) throw new Error("Configuration missing");
        const config: ListsConfig = JSON.parse(raw);

        const foundProject = config.projects.find((p) => p.id === projectKey);
        if (!foundProject) throw new Error(`No project found for key "${projectKey}"`);
        setProject(foundProject);

        const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
        if (!token) throw new Error("No Graph token acquired");

        const profile = await axios.get("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mounted) setUserEmail(profile.data.mail || profile.data.userPrincipalName);

        const itemResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${foundProject.mapping.implementation}/items/${itemId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const fields = itemResp.data.fields;
        if (mounted) {
          setProcessNumber(fields["Processnumber"] || "");
          setCarline(fields["Carline"] || "");
        }

        const qsResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items?$top=5000&expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const qsData: QuestionState[] = qsResp.data.value.map((item: any) => {
          const f = item.fields;
          return {
            id: item.id,
            description: f["field_0"] || "",
            action: f["field_7"] || "",
            responsibleEmail: f["field_4"] || "",
            responsibleRole: f["field_8"] || "",
            triggerOn: f["field_2"] || "Oui",
            triggerChoice: "",
            sendIntervalValue: f["field_5"] ?? 3,
            sendIntervalUnit: f["field_6"] || "Days",
            lastSent: f["lastSent"] || "",
            responseReceived: f["responseReceived"] || false,
          };
        });

        if (mounted) setQuestions(qsData);
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [projectKey, itemId]);

  // Polling logic to check SharePoint for updates
  useEffect(() => {
    const pollResponses = async () => {
      try {
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw || !project) return;
        const config: ListsConfig = JSON.parse(raw);
        const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);

        const updatedQsResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items?$top=5000&expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedData: QuestionState[] = updatedQsResp.data.value.map((item: any) => {
          const f = item.fields;
          return {
            id: item.id,
            description: f["field_0"] || "",
            action: f["field_7"] || "",
            responsibleEmail: f["field_4"] || "",
            responsibleRole: f["field_8"] || "",
            triggerOn: f["field_2"] || "Oui",
            triggerChoice: "",
            sendIntervalValue: f["field_5"] ?? 3,
            sendIntervalUnit: f["field_6"] || "Days",
            lastSent: f["lastSent"] || "",
            responseReceived: f["responseReceived"] || false,
          };
        });

        setQuestions((prev) =>
          prev.map((q) => {
            const updated = updatedData.find((u) => u.id === q.id);
            return updated ? { ...q, responseReceived: updated.responseReceived } : q;
          })
        );
      } catch (err) {
        console.error("Polling failed:", err);
      }
    };

    pollTimerRef.current = setInterval(pollResponses, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [project]);

  const patchField = async (questionId: string, key: string, val: any) => {
    try {
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) return;
      const config: ListsConfig = JSON.parse(raw);
      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items/${questionId}/fields`,
        { [key]: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Patch field error:", err);
    }
  };

  const sendMail = async (q: QuestionState) => {
  try {
    const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        message: {
          subject: `Update – ${processnumber}`,
          body: {
            contentType: "text",
            content: `Hello,\n\n${q.description}\nCarline: ${carline}\n\nRegards,\n${userEmail}`,
          },
          toRecipients: [{ emailAddress: { address: q.responsibleEmail } }],
        },
        saveToSentItems: true,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Extract Message ID from response headers (Graph returns nothing, so we fetch sent items)
    const sentResponse = await axios.get(
      "https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=1&$orderby=sentDateTime desc",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const message = sentResponse.data.value[0];
    const conversationId = message.conversationId;
    const internetMessageId = message.internetMessageId;

    const now = new Date().toISOString();
    await patchField(q.id, "lastSent", now);
    await patchField(q.id, "responseReceived", false);
    await patchField(q.id, "conversationId", conversationId);
    await patchField(q.id, "internetMessageId", internetMessageId);

    setQuestions((curr) =>
      curr.map((x) =>
        x.id === q.id
          ? {
              ...x,
              lastSent: now,
              responseReceived: false,
            }
          : x
      )
    );
  } catch (err: any) {
    alert(`Send mail failed: ${err.message}`);
  }
};

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 z-10 pointer-events-none" />
      <button
        onClick={() => navigate(`/details/${projectKey}/implementation/${itemId}`)}
        className="px-3 py-2 bg-white/20 rounded text-white"
      >
        ← Back
      </button>

      <div className="relative z-20 w-full p-8 space-y-6 text-white">
        <h1 className="text-2xl font-bold">Automatic Mail</h1>
        <p>Process Number: {processnumber}</p>
        <p>Carline: {carline}</p>
        <p>Logged in as: {userEmail}</p>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2 font-semibold">
          <div>Question</div>
          <div>Action</div>
          <div>Responsable Email</div>
          <div>Responsible's Role</div>
          <div>Response</div>
          <div>Interval</div>
          <div>Unit</div>
          <div>Last Sent</div>
          <div>Response Received</div>
          <div>Edit</div>
        </div>

        {questions.map((q) => (
          <div
            key={q.id}
            className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md p-4"
          >
            <div>{q.description}</div>
            <div>{q.action}</div>
            <div>{q.responsibleEmail}</div>
            <div>{q.responsibleRole}</div>
            <div>
              {["Oui", "Non"].map((opt) => (
                <label key={opt} className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name={`trigger-${q.id}`}
                    value={opt}
                    checked={q.triggerChoice === opt}
                    onChange={async () => {
                      setQuestions((curr) =>
                        curr.map((item) =>
                          item.id === q.id ? { ...item, triggerChoice: opt } : item
                        )
                      );
                      if (opt === q.triggerOn) await sendMail(q);
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div>{q.sendIntervalValue}</div>
            <div>{q.sendIntervalUnit}</div>
            <div>{q.lastSent || "-"}</div>
            <div>{q.responseReceived ? "Yes" : "No"}</div>
            <div>
              <button
                onClick={() =>
                  navigate(`/send-email/${projectKey}/implementation/${itemId}/edit-question/${q.id}`)
                }
                className="px-3 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SendEmailPage;
