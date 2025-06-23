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
  description: string;        // field_0
  action: string;             // field_7
  triggerOn: string;          // field_2
  receiverEmail: string;      // field_3
  responsibleEmail: string;   // field_4
  responsibleRole: string;    // field_8
  sendIntervalValue: number;  // field_5
  sendIntervalUnit: string;   // field_6
  customSubject?: string;     // emailsubject
  customBody?: string;        // emailbody
}

interface ListsConfig {
  siteId: string;
  questionsListId: string;
}

export default function EditQuestionPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<QuestionState | null>(null);

  // Local form state
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  const [triggerOn, setTriggerOn] = useState("Oui");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [responsibleRole, setResponsibleRole] = useState("");
  const [sendIntervalValue, setSendIntervalValue] = useState<number>(3);
  const [sendIntervalUnit, setSendIntervalUnit] = useState("Days");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");

  // Load existing question
  useEffect(() => {
    (async () => {
      if (!questionId) return;
      try {
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) throw new Error("Configuration missing in localStorage");
        const config: ListsConfig = JSON.parse(raw);

        const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);

        if (!token) throw new Error("No Graph token acquired");

        const itemResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items/${questionId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const f = itemResp.data.fields;
        const loaded: QuestionState = {
          id: questionId,
          description: f["field_0"] || "",
          action: f["field_7"] || "",
          triggerOn: f["field_2"] || "Oui",
          receiverEmail: f["field_3"] || "",
          responsibleEmail: f["field_4"] || "",
          responsibleRole: f["field_8"] || "",
          sendIntervalValue: f["field_5"] ?? 3,
          sendIntervalUnit: f["field_6"] || "Days",
          customSubject: f["emailsubject"] || "",
          customBody: f["emailbody"] || "",
        };

        setQuestion(loaded);
        // populate form
        setDescription(loaded.description);
        setAction(loaded.action);
        setTriggerOn(loaded.triggerOn);
        setReceiverEmail(loaded.receiverEmail);
        setResponsibleEmail(loaded.responsibleEmail);
        setResponsibleRole(loaded.responsibleRole);
        setSendIntervalValue(loaded.sendIntervalValue);
        setSendIntervalUnit(loaded.sendIntervalUnit);
        setCustomSubject(loaded.customSubject || "");
        setCustomBody(loaded.customBody || "");
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Could not load question");
      }
    })();
  }, [questionId]);

  // Save & optionally send email
  const handleSave = async () => {
    if (!questionId) return;
    try {
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) throw new Error("Configuration missing in localStorage");
      const config: ListsConfig = JSON.parse(raw);

      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);

      if (!token) throw new Error("No Graph token acquired");

      // Patch fields
      const patchPayload: Record<string, any> = {
        field_0: description,
        field_7: action,
        field_2: triggerOn,
        field_4: responsibleEmail,
        field_8: responsibleRole,
        field_5: sendIntervalValue,
        field_6: sendIntervalUnit,
        emailsubject: customSubject,
        emailbody: customBody,
      };

      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items/${questionId}/fields`,
        patchPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optionally send a preview email immediately
      if (customSubject && customBody) {
        await axios.post(
          "https://graph.microsoft.com/v1.0/me/sendMail",
          {
            message: {
              subject: customSubject,
              body: { contentType: "text", content: customBody },
              toRecipients: [{ emailAddress: { address: responsibleEmail } }],
            },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert("Question updated successfully");
      navigate(-1);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Edit question failed");
    }
  };

  if (!question) return <div className="p-4">Loading question...</div>;

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 z-10 pointer-events-none" />
      <div className="relative z-20 w-full p-8 space-y-6 text-white max-w-2xl mx-auto">
        {/* Back button */}
        <TopMenu />
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-black"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold text-center">Edit Question</h2>

        <div className="space-y-4">
          <label className="block font-semibold">Question</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="block font-semibold">Action</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />

          <label className="block font-semibold">Trigger On</label>
          <select
            className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
            value={triggerOn}
            onChange={(e) => setTriggerOn(e.target.value)}
          >
            <option>Oui</option>
            <option>Non</option>
          </select>

          <label className="block font-semibold">Responsible Email</label>
          <input
            type="email"
            className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
            value={responsibleEmail}
            onChange={(e) => setResponsibleEmail(e.target.value)}
          />

          <label className="block font-semibold">Responsible's Role</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
            value={responsibleRole}
            onChange={(e) => setResponsibleRole(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Interval Value</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
                value={sendIntervalValue}
                onChange={(e) => setSendIntervalValue(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block font-semibold">Interval Unit</label>
              <select
                className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
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

          <label className="block font-semibold">Custom Email Subject</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Optional custom subject"
          />

          <label className="block font-semibold">Custom Email Body</label>
          <textarea
            className="w-full p-2 rounded-lg text-black bg-white placeholder-gray-500"
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            placeholder="Write your personalized email body here..."
          />

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
