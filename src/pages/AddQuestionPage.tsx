// src/pages/AddQuestionPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import { graphTokenRequest } from "../authConfig";
import { msalInstance } from "../auth/msalInstance";
import TopMenu from "../components/TopMenu";
import harnessBg from "../assets/images/harness-bg.png";
interface ListsConfig {
  siteId: string;
  questionsListId?: string;                 // central templates
  projects: {
    id: string;
    mapping: {
      implementation: string;                // your change list
      changeQuestionStatusListId?: string;   // per‐project CQS
    };
  }[];
}

export default function AddQuestionPage() {
  const { projectKey, itemId } = useParams<{
    projectKey: string;
    itemId: string;
  }>();
  const navigate = useNavigate();

  // Change context
  const [processNumber, setProcessNumber] = useState("");
  const [carline,       setCarline]       = useState("");
  const [area,          setArea]          = useState("");

  // New question form
  const [questionId,        setQuestionId]        = useState("");
  const [description,       setDescription]       = useState("");
  const [action,            setAction]            = useState("");
  const [triggerOn,         setTriggerOn]         = useState<"Oui"|"Non">("Oui");
  const [responsibleEmail,  setResponsibleEmail]  = useState("");
  const [responsibleRole,   setResponsibleRole]   = useState("");
  const [sendIntervalValue, setSendIntervalValue] = useState<number>(3);
  const [sendIntervalUnit,  setSendIntervalUnit]  = useState<"Seconds"|"Minutes"|"Days">("Days");
  const [emailSubject,      setEmailSubject]      = useState("");
  const [emailBody,         setEmailBody]         = useState("");

  const [, setLoading] = useState(true);
  const [, setError]   = useState<string | null>(null);

  // 1️⃣ Grab ProcessNumber/Carline/Area from the change item
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) throw new Error("Missing cmConfigLists");
        const cfg: ListsConfig = JSON.parse(raw);
        const proj = cfg.projects.find((p) => p.id === projectKey);
        if (!proj) throw new Error(`No project for "${projectKey}"`);

        const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
        if (!token) throw new Error("No Graph token");
        const headers = { Authorization: `Bearer ${token}` };

        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${cfg.siteId}` +
          `/lists/${proj.mapping.implementation}/items/${itemId}?expand=fields`,
          { headers }
        );
        const f = resp.data.fields;
        if (mounted) {
          setProcessNumber(f.Processnumber  || "");
          setCarline(f.Carline              || "");
          setArea(f.SheetName               || "");
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectKey, itemId]);

  const handleAddQuestion = async () => {
    try {
      setLoading(true);
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) throw new Error("Missing cmConfigLists");
      const cfg: ListsConfig = JSON.parse(raw);
      const proj = cfg.projects.find((p) => p.id === projectKey)!;

      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
      if (!token) throw new Error("No Graph token");
      const headers = { Authorization: `Bearer ${token}` };

      //
      // 2️⃣ Add to central QuestionTemplates (if configured)
      //
      if (cfg.questionsListId) {
        const tplFields = {
          Title:         `Template-${questionId}`,
          Questionid:    questionId,
          Question:      description,
          Action:        action,
          TriggerOn:     triggerOn,
          ResponsableEmail: responsibleEmail,
          Responsiblerole:  responsibleRole,
          SendIntervalValue: String(sendIntervalValue),
          SendIntervalUnit:  sendIntervalUnit,
          emailsubject:     emailSubject,
          emailbody:        emailBody,
        };
        await axios.post(
          `https://graph.microsoft.com/v1.0/sites/${cfg.siteId}` +
          `/lists/${cfg.questionsListId}/items`,
          { fields: tplFields },
          { headers }
        );
      }

      //
      // 3️⃣ Add to per‐project ChangeQuestionStatus_{project} list
      //
      const cqsId = proj.mapping.changeQuestionStatusListId;
      if (cqsId) {
        const cqsFields = {
          Title:            `${processNumber}-${questionId}`,
          ChangeNumber:     processNumber,
          Area:             area,
          QuestionId:       questionId,
          Question:         description,
          Action:           action,
          TriggerOn:        triggerOn,
          ResponsableEmail: responsibleEmail,
          Responsiblerole:  responsibleRole,
          SendIntervalValue: String(sendIntervalValue),
          SendIntervalUnit:  sendIntervalUnit,
          emailsubject:      emailSubject,
          emailbody:         emailBody,
          responseReceived:  "false",
          lastSent:          "",
          lastChecked:       "",
          conversationId:    "",
          internetMessageId: ""
        };
        await axios.post(
          `https://graph.microsoft.com/v1.0/sites/${cfg.siteId}` +
          `/lists/${cqsId}/items`,
          { fields: cqsFields },
          { headers }
        );
      }

      alert("Question added to both lists!");
      navigate(-1);
    } catch (err: any) {
      console.error("AddQuestion failed:", err);
      alert(err.message || "Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${harnessBg})` }}>
      <TopMenu />
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-white"
      >
        ← Back
      </button>
      <div className="relative z-20 max-w-3xl mx-auto p-8 space-y-6 text-white">
        <h2 className="text-2xl font-bold">Add New Question</h2>
        <p>Change: <strong>{processNumber}</strong> | Area: <strong>{area}</strong> | Carline: <strong>{carline}</strong></p>

        <div className="space-y-4">
          <label className="block font-semibold">Question ID</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-white text-black"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            placeholder="e.g. q23"
          />

          <label className="block font-semibold">Description</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-white text-black"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="block font-semibold">Action</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-white text-black"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />

          <label className="block font-semibold">Trigger On</label>
          <select
            className="w-full p-2 rounded bg-white text-black"
            value={triggerOn}
            onChange={(e) => setTriggerOn(e.target.value as "Oui"|"Non")}
          >
            <option>Oui</option>
            <option>Non</option>
          </select>

          <label className="block font-semibold">Responsible Email</label>
          <input
            type="email"
            className="w-full p-2 rounded bg-white text-black"
            value={responsibleEmail}
            onChange={(e) => setResponsibleEmail(e.target.value)}
          />

          <label className="block font-semibold">Responsible's Role</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-white text-black"
            value={responsibleRole}
            onChange={(e) => setResponsibleRole(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Interval Value</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-white text-black"
                value={sendIntervalValue}
                onChange={(e) => setSendIntervalValue(parseInt(e.target.value,10)||0)}
              />
            </div>
            <div>
              <label className="block font-semibold">Interval Unit</label>
              <select
                className="w-full p-2 rounded bg-white text-black"
                value={sendIntervalUnit}
                onChange={(e) => setSendIntervalUnit(e.target.value as any)}
              >
                <option>Seconds</option>
                <option>Minutes</option>
                <option>Days</option>
              </select>
            </div>
          </div>

          <hr className="border-white/40" />

          <label className="block font-semibold">Email Subject</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-white text-black"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="Optional custom subject"
          />

          <label className="block font-semibold">Email Body</label>
          <textarea
            className="w-full h-32 p-2 rounded bg-white text-black"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="Optional custom body"
          />

          <button
            onClick={handleAddQuestion}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
          >
            Save New Question
          </button>
        </div>
      </div>
    </div>
  );
}
