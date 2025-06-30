// src/pages/EditQuestionPage.tsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import { graphTokenRequest } from "../authConfig";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";
import TopMenu from "../components/TopMenu";

interface QuestionState {
  id: string;
  changeNumber: string;
  area: string;
  questionId: string;
  description: string;
  action: string;
  triggerOn: string;
  responsibleEmail: string;
  responsibleRole: string;
  sendIntervalValue: number;
  sendIntervalUnit: string;
  emailsubject?: string;
  emailbody?: string;
}

interface ListsConfig {
  siteId: string;
  questionsListId: string;
  projects: {
    id: string;
    displayName: string;
    logo?: string;
    mapping: {
      feasibility: string;
      implementation: string;
      changeQuestionStatusListId?: string;
    };
  }[];
}

export default function EditQuestionPage() {
  const { projectKey, itemId, questionId } = useParams<{
    projectKey: string;
    itemId: string;
    questionId: string;
  }>();
  const navigate = useNavigate();

  // form state
  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  const [triggerOn, setTriggerOn] = useState("Oui");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [responsibleRole, setResponsibleRole] = useState("");
  const [sendIntervalValue, setSendIntervalValue] = useState<number>(3);
  const [sendIntervalUnit, setSendIntervalUnit] = useState("Days");
  const [emailsubject, setEmailsubject] = useState("");
  const [emailbody, setEmailbody] = useState("");

  // change/item context & user
  const [processNumber, setProcessNumber] = useState("");
  const [carline, setCarline] = useState("");
  const [area, setArea] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // 1️⃣ Load config
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) throw new Error("Configuration missing");
        const config: ListsConfig = JSON.parse(raw);
        const proj = config.projects.find((p) => p.id === projectKey);
        if (!proj) throw new Error(`No project for key "${projectKey}"`);

        // 2️⃣ Get Graph token + headers
        const token = await getAccessToken(
          msalInstance,
          graphTokenRequest.scopes
        );
        if (!token) throw new Error("No Graph token acquired");
        const headers = { Authorization: `Bearer ${token}` };

        // 3️⃣ Fetch the change item (to grab Processnumber, Carline & Area)
        const implListId = proj.mapping.implementation;
        const changeResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
            `/lists/${implListId}/items/${itemId}?expand=fields`,
          { headers }
        );
        const f = changeResp.data.fields;
        if (mounted) {
          setProcessNumber(f["Processnumber"] || "");
          setCarline(f["Carline"] || "");
          setArea(f["SheetName"] || "");
        }

        // 4️⃣ Fetch the CQS item
        const cqsListId = proj.mapping.changeQuestionStatusListId;
        if (!cqsListId) throw new Error("Missing ChangeQuestionStatus mapping");
        const cqsResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
            `/lists/${cqsListId}/items/${questionId}?expand=fields`,
          { headers }
        );
        const qf = cqsResp.data.fields;
        const loaded: QuestionState = {
          id: questionId!,
          changeNumber:       qf["ChangeNumber"]       || "",
          area:               qf["Area"]               || "",
          questionId:         qf["QuestionId"]         || "",
          description:        qf["Question"]           || "",
          action:             qf["Action"]             || "",
          triggerOn:          qf["TriggerOn"]          || "Oui",
          responsibleEmail:   qf["ResponsableEmail"]   || "",
          responsibleRole:    qf["Responsiblerole"]    || "",
          sendIntervalValue:  Number(qf["SendIntervalValue"]) || 3,
          sendIntervalUnit:   qf["SendIntervalUnit"]   || "Days",
          emailsubject:       qf["emailsubject"]       || "",
          emailbody:          qf["emailbody"]          || "",
        };
        if (mounted) {
          setQuestion(loaded);
          setDescription(loaded.description);
          setAction(loaded.action);
          setTriggerOn(loaded.triggerOn);
          setResponsibleEmail(loaded.responsibleEmail);
          setResponsibleRole(loaded.responsibleRole);
          setSendIntervalValue(loaded.sendIntervalValue);
          setSendIntervalUnit(loaded.sendIntervalUnit);
          setEmailsubject(loaded.emailsubject || "");
          setEmailbody(loaded.emailbody || "");
        }

        // 5️⃣ Fetch user profile (for default email signature)
        const profile = await axios.get(
          "https://graph.microsoft.com/v1.0/me",
          { headers }
        );
        if (mounted)
          setUserEmail(
            profile.data.mail || profile.data.userPrincipalName
          );
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectKey, itemId, questionId]);

  if (!question) return <div className="p-4">Loading question…</div>;

  // Defaults for email previews
  const defaultSubject = `Update – ${processNumber}`;
  const defaultBody = `Hello,\n\n${description}\nCarline: ${carline}\n\nRegards,\n${userEmail}`;

  // 🔧 Save back to the CQS list AND sync to QuestionTemplates
  // …
  const handleSave = async () => {
    try {
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) throw new Error("Configuration missing");
      const config: ListsConfig = JSON.parse(raw);

      const proj = config.projects.find((p) => p.id === projectKey)!;
      const cqsListId = proj.mapping.changeQuestionStatusListId!;
      const qtplListId = config.questionsListId;

      const token = await getAccessToken(
        msalInstance,
        graphTokenRequest.scopes
      );
      if (!token) throw new Error("No Graph token acquired");
      const headers = { Authorization: `Bearer ${token}` };

      // 1️⃣ Patch the per-project ChangeQuestionStatus
      const cqsPayload: Record<string, any> = {
        Question:          description,
        Action:            action,
        TriggerOn:         triggerOn,
        ResponsableEmail:  responsibleEmail,
        Responsiblerole:   responsibleRole,
        SendIntervalValue: sendIntervalValue,
        SendIntervalUnit:  sendIntervalUnit,
        emailsubject,
        emailbody,
      };
      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
          `/lists/${cqsListId}/items/${questionId}/fields`,
        cqsPayload,
        { headers }
      );

      // 2️⃣ Sync back into central QuestionTemplates **without a $filter**
      if (qtplListId) {
        // fetch all templates once
        const tplRes = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
            `/lists/${qtplListId}/items?$top=5000&expand=fields`,
          { headers }
        );
        const allTpls = tplRes.data.value;

        // find matching template by its Questionid field
        const match = allTpls.find(
          (it: any) =>
            String(it.fields.Questionid).toLowerCase() ===
            question!.questionId.toLowerCase()
        );
        if (match) {
          const tmplId = match.id;
          const tplPayload: Record<string, any> = {
            Question:          description,
            Action:            action,
            ResponsableEmail:  responsibleEmail,
            Responsiblerole:   responsibleRole,
            TriggerOn:         triggerOn,
            SendIntervalValue: sendIntervalValue,
            SendIntervalUnit:  sendIntervalUnit,
            emailsubject,
            emailbody,
          };
          await axios.patch(
            `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
              `/lists/${qtplListId}/items/${tmplId}/fields`,
            tplPayload,
            { headers }
          );
        }
      }

      alert("Question updated successfully");
      navigate(-1);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Update failed");
    }
  };

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 z-10 pointer-events-none" />
      <div className="relative z-20 w-full p-8 space-y-6 text-white max-w-3xl mx-auto">
        <TopMenu />
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 bg-gray-300 rounded text-black hover:bg-gray-400"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-center">Edit Question</h2>

        <div className="space-y-4">
          <label className="block font-semibold">Question</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="block font-semibold">Action</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />

          <label className="block font-semibold">Trigger On</label>
          <select
            className="w-full p-2 rounded-lg text-black bg-white"
            value={triggerOn}
            onChange={(e) => setTriggerOn(e.target.value)}
          >
            <option>Oui</option>
            <option>Non</option>
          </select>

          <label className="block font-semibold">Responsible Email</label>
          <input
            type="email"
            className="w-full p-2 rounded-lg text-black bg-white"
            value={responsibleEmail}
            onChange={(e) => setResponsibleEmail(e.target.value)}
          />

          <label className="block font-semibold">Responsible's Role</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white"
            value={responsibleRole}
            onChange={(e) => setResponsibleRole(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Interval Value</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg text-black bg-white"
                value={sendIntervalValue}
                onChange={(e) =>
                  setSendIntervalValue(parseInt(e.target.value, 10) || 0)
                }
              />
            </div>
            <div>
              <label className="block font-semibold">Interval Unit</label>
              <select
                className="w-full p-2 rounded-lg text-black bg-white"
                value={sendIntervalUnit}
                onChange={(e) => setSendIntervalUnit(e.target.value)}
              >
                <option>Seconds</option>
                <option>Minutes</option>
                <option>Days</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-400" />

          <label className="block font-semibold">Email Subject</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white"
            value={emailsubject}
            onChange={(e) => setEmailsubject(e.target.value)}
            placeholder="Custom subject"
          />
          <p className="text-sm text-white">Default: {defaultSubject}</p>

          <label className="block font-semibold">Email Body</label>
          <textarea
            className="w-full h-40 p-2 rounded-lg text-black bg-white"
            value={emailbody}
            onChange={(e) => setEmailbody(e.target.value)}
            placeholder="Custom body"
          />
          <p className="text-sm text-white whitespace-pre-line">
            Default: {defaultBody}
          </p>

          <button
            onClick={handleSave}
            className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
