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

  // Email subject/body: generated + personalized
  const [customSubjectPart, setCustomSubjectPart] = useState("");
  const [customBodyPart, setCustomBodyPart] = useState("");

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

          // If previously saved, split subject/body into generated and personalized parts
          if (loaded.emailsubject) {
            const generated = getGeneratedSubject(
              loaded.changeNumber,
              carline,
              processNumber
            );
            if (
              loaded.emailsubject.startsWith(generated) &&
              loaded.emailsubject.length > generated.length
            ) {
              setCustomSubjectPart(
                loaded.emailsubject.slice(generated.length).trim()
              );
            }
          }
          if (loaded.emailbody) {
            const generated = getGeneratedBody(loaded.description);
            if (
              loaded.emailbody.startsWith(generated) &&
              loaded.emailbody.length > generated.length
            ) {
              setCustomBodyPart(
                loaded.emailbody.slice(generated.length).trim()
              );
            }
          }
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
    // eslint-disable-next-line
  }, [projectKey, itemId, questionId]);

  // Utility: generated subject/body
  function getGeneratedSubject(changeNumber: string, carline: string, processNumber: string) {
    return `q1${processNumber ? " " + processNumber : ""}${carline ? " " + carline : ""}${changeNumber ? " " + changeNumber : ""} -`;
  }
  function getGeneratedBody(desc: string) {
    return desc || "Vérification le besoin de création ou modification des WI et procéder à actualiser";
  }

  if (!question)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-white">
        Loading question…
      </div>
    );

  // These values update in real-time as you type/edit
  const generatedSubject = getGeneratedSubject(
    question.changeNumber,
    carline,
    processNumber
  );
  const generatedBody = getGeneratedBody(description);

  // Final subject/body that will be saved
  const finalSubject = `${generatedSubject} ${customSubjectPart}`.trim();
  const finalBody = `${generatedBody}\n\n${customBodyPart}`.trim();

  // Save handler
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
        emailsubject:      finalSubject,
        emailbody:         finalBody,
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
            emailsubject:      finalSubject,
            emailbody:         finalBody,
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
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <TopMenu />
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white/90 mb-2">Edit Question</h1>
          <div className="text-md text-blue-200">
            Process: <span className="font-bold">{processNumber}</span>
            {carline && <> | Carline: <span className="font-bold">{carline}</span></>}
            {area && <> | Area: <span className="font-bold">{area}</span></>}
          </div>
        </div>
        {/* Glassy Card */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Question */}
            <div>
              <label className="block font-semibold mb-1 text-white">Question</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {/* Action */}
            <div>
              <label className="block font-semibold mb-1 text-white">Action</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              />
            </div>
            {/* Trigger On */}
            <div>
              <label className="block font-semibold mb-1 text-white">Trigger On</label>
              <select
                className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                value={triggerOn}
                onChange={(e) => setTriggerOn(e.target.value)}
              >
                <option>Oui</option>
                <option>Non</option>
              </select>
            </div>
            {/* Responsible Email */}
            <div>
              <label className="block font-semibold mb-1 text-white">
                Responsible Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                value={responsibleEmail}
                onChange={(e) => setResponsibleEmail(e.target.value)}
              />
            </div>
            {/* Responsible's Role */}
            <div>
              <label className="block font-semibold mb-1 text-white">
                Responsible's Role
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                value={responsibleRole}
                onChange={(e) => setResponsibleRole(e.target.value)}
              />
            </div>
            {/* Two-column grid for interval fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1 text-white">
                  Send Interval Value
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                  value={sendIntervalValue}
                  onChange={(e) =>
                    setSendIntervalValue(parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-white">
                  Send Interval Unit
                </label>
                <select
                  className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
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

            {/* Email Subject */}
            <div>
              <label className="block font-semibold mb-1 text-white">Email Subject</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white/60 text-black rounded-xl shadow-sm"
                  value={generatedSubject}
                  disabled
                  readOnly
                />
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                  placeholder="Personalized subject part"
                  value={customSubjectPart}
                  onChange={e => setCustomSubjectPart(e.target.value)}
                />
              </div>
            </div>
            {/* Email Body */}
            <div>
              <label className="block font-semibold mb-1 text-white">Email Body</label>
              <textarea
                className="w-full px-4 py-2 mb-3 bg-white/60 text-black rounded-xl shadow-sm"
                value={generatedBody}
                disabled
                readOnly
                rows={3}
              />
              <textarea
                className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                placeholder="Personalized message (optional)"
                value={customBodyPart}
                onChange={e => setCustomBodyPart(e.target.value)}
                rows={4}
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xl shadow-lg mt-8 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-8 flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-base transition mx-auto"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
