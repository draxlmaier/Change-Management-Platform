// src/pages/SendEmailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { graphTokenRequest } from "../authConfig";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";
import TopMenu from "../components/TopMenu";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    implementation: string;
    changeQuestionStatusListId?: string;
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
  changeNumber: string;
  area: string;
  id: string;
  questionId: string;
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
  lastChecked?: string;
}

const SendEmailPage: React.FC = () => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [processnumber, setProcessNumber] = useState("");
  const [carline, setCarline] = useState("");
  const [area, setArea]     = useState(""); 
  const [userEmail, setUserEmail] = useState("");
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [, setProject] = useState<IProject | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) throw new Error("Configuration missing");
        const config: ListsConfig = JSON.parse(raw);

        const foundProject = config.projects.find((p) => p.id === projectKey);
        if (!foundProject) throw new Error(`No project for key "${projectKey}"`);
        setProject(foundProject);

        const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
        if (!token) throw new Error("No Graph token");
        const headers = { Authorization: `Bearer ${token}` };

        const profile = await axios.get("https://graph.microsoft.com/v1.0/me", { headers });
        if (mounted) {
          setUserEmail(profile.data.mail || profile.data.userPrincipalName);
        }

        // Fetch the change item to get Processnumber, Carline & Area
        const itemResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${foundProject.mapping.implementation}/items/${itemId}?expand=fields`,
          { headers }
        );
        const fields = itemResp.data.fields;
        const processNum = fields["Processnumber"] || "";
        const sheetArea  = fields["SheetName"]     || "";
        if (mounted) {
          setProcessNumber(processNum);
          setCarline(fields["Carline"] || "");
          setArea(sheetArea);
        }

        // Fetch & filter ChangeQuestionStatus entries for this change+area
        const questionListId = foundProject.mapping.changeQuestionStatusListId;
        if (!questionListId) throw new Error("Missing ChangeQuestionStatus mapping");

        let statusItems: any[] = [];
        let url = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${questionListId}/items?$top=5000&expand=fields`;
        while (url) {
          const res = await axios.get(url, { headers });
          statusItems.push(...res.data.value);
          url = res.data["@odata.nextLink"] || null;
        }
        statusItems = statusItems.filter(
          (it) =>
            it.fields["ChangeNumber"] === processNum &&
            it.fields["Area"]         === sheetArea
        );

        // Fetch all QuestionTemplates
        let templates: any[] = [];
        let tUrl = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items?$top=5000&expand=fields`;
        while (tUrl) {
          const tres = await axios.get(tUrl, { headers });
          templates.push(...tres.data.value);
          tUrl = tres.data["@odata.nextLink"] || null;
        }

        // Normalize templates by lowercase Questionid
        const normalizedTemplates = templates.map((item: any) => {
          const orig = item.fields;
          const lc: Record<string, any> = {};
          for (const k in orig) lc[k.toLowerCase()] = orig[k];
          return {
            questionId: (lc["questionid"] || "").toLowerCase(),
            fields: lc,
          };
        });

        // Merge status + template into QuestionState[]
        const merged: QuestionState[] = statusItems.map((st) => {
          const s = st.fields;
          const qid = (s["QuestionId"] || "").toLowerCase();
          const tpl = normalizedTemplates.find((t) => t.questionId === qid);

          return {
            id: st.id,
            changeNumber: s["ChangeNumber"] || "",
            area: s["Area"] || "",
            questionId: s["QuestionId"] || "",
            description: tpl?.fields["question"] || "",
            action: tpl?.fields["action"] || "",
            responsibleEmail: tpl?.fields["responsableemail"] || "",
            responsibleRole: tpl?.fields["responsiblerole"] || "",
            triggerOn: tpl?.fields["triggeron"] || "Oui",
            triggerChoice: "",
            sendIntervalValue: tpl?.fields["sendintervalvalue"] ?? 3,
            sendIntervalUnit: tpl?.fields["sendintervalunit"] || "Days",
            lastSent: s["lastSent"] || "",
            responseReceived: !!s["responseReceived"],
            conversationId: s["conversationId"] || "",
            internetMessageId: s["internetMessageId"] || "",
            lastChecked: s["lastChecked"] || "",
          };
        });

        if (mounted) setQuestions(merged);
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [projectKey, itemId]);

  // Patch a single field in ChangeQuestionStatus
  const patchField = async (questionId: string, key: string, val: any) => {
    try {
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) return;
      const config: ListsConfig = JSON.parse(raw);
      const proj = config.projects.find((p) => p.id === projectKey);
      if (!proj?.mapping.changeQuestionStatusListId) return;

      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${proj.mapping.changeQuestionStatusListId}/items/${questionId}/fields`,
        { [key]: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Patch field error:", err);
    }
  };

  // Send an email for a question
  const sendMail = async (q: QuestionState) => {
    try {
      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
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
        { headers }
      );

      const sentResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=1&$orderby=sentDateTime desc",
        { headers }
      );
      const message = sentResponse.data.value[0];
      const now = new Date().toISOString();

      // Patch fields in CQS
      await patchField(q.id, "lastSent", now);
      await patchField(q.id, "responseReceived", false);
      await patchField(q.id, "conversationId", message.conversationId);
      await patchField(q.id, "internetMessageId", message.internetMessageId);

      // Update local state
      setQuestions((curr) =>
        curr.map((x) =>
          x.id === q.id
            ? {
                ...x,
                lastSent: now,
                responseReceived: false,
                conversationId: message.conversationId,
                internetMessageId: message.internetMessageId,
              }
            : x
        )
      );
    } catch (err: any) {
      alert(`Send mail failed: ${err.message}`);
    }
  };

  // Poll inbox for a reply
  const pollInboxForQuestion = async (question: QuestionState) => {
    try {
      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
      const headers = { Authorization: `Bearer ${token}` };

      if (!question.lastSent || question.responseReceived) return;

      let url = `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=100&$orderby=receivedDateTime desc`;
      let matched = false;

      while (url && !matched) {
        const res = await axios.get(url, { headers });
        const messages = res.data.value;

        for (const msg of messages) {
          const sender = msg.sender?.emailAddress?.address || "";
          const subject = msg.subject || "";
          const expectedSubject = `re: update – ${processnumber}`.toLowerCase();
          const isReply = subject.trim().toLowerCase().startsWith(expectedSubject);
          const isCorrectSender =
            sender.toLowerCase() === question.responsibleEmail.toLowerCase();
          const isAfterLastSent =
            new Date(msg.receivedDateTime) > new Date(question.lastSent!);

          if (isReply && isCorrectSender && isAfterLastSent) {
            const now = new Date().toISOString();
            await patchField(question.id, "responseReceived", true);
            await patchField(question.id, "lastChecked", now);

            setQuestions((prev) =>
              prev.map((q) =>
                q.id === question.id
                  ? { ...q, responseReceived: true, lastChecked: now }
                  : q
              )
            );

            matched = true;
            break;
          }
        }

        url = !matched ? res.data["@odata.nextLink"] : null;
      }
    } catch (err) {
      console.error("Error polling inbox:", err);
    }
  };

  // Debug helper: list last 3 emails
  const listLast3Emails = async () => {
    try {
      const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
      const headers = { Authorization: `Bearer ${token}` };

      const url =
        "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=3&$orderby=receivedDateTime desc";
      const res = await axios.get(url, { headers });
      res.data.value.forEach((msg: any, idx: number) => {
        console.log(`#${idx + 1}`, msg.subject, msg.sender?.emailAddress?.address, msg.receivedDateTime);
      });
    } catch (err: any) {
      console.error("Failed to fetch emails:", err.message);
    }
  };

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <TopMenu />

      {/* Header Buttons */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 px-8 pt-6">
        <button
          onClick={() =>
            navigate(`/details/${projectKey}/Feasibility/${itemId}`)
          }
          className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
        >
          ← Back
        </button>
        <button
          onClick={listLast3Emails}
          className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          Debug: List Last 3 Emails
        </button>
      </div>

      {/* Interactive Email‐Sending UI */}
      <div className="relative z-20 w-full p-8 space-y-6 text-white max-w-6xl mx-auto">
        <p className="text-lg">
          Process Number: <strong>{processnumber}</strong>
        </p>
        <p className="text-lg">
          Carline: <strong>{carline}</strong>
        </p>
        <p className="text-lg">
          Area: <strong>{area}</strong>
        </p>
        <p className="text-lg">
          Logged in as: <strong>{userEmail}</strong>
        </p>

        {/* … */}
{/* header row */}
<div
  className="
    mt-6 grid grid-cols-1
    md:grid-cols-[2fr_1fr_1fr_3fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]
    gap-4 px-4 py-2 font-semibold
    bg-black/30 rounded-xl shadow-lg
  "
>
  <div>Question</div>
  <div>Action</div>
  <div>Responsable Email</div>
  <div>Responsible’s Role</div>
  <div>Response</div>
  <div>Interval</div>
  <div>Unit</div>
  <div>Last Sent</div>
  <div>Response Received</div>
  <div>Last Checked</div>
  <div>Edit</div>
  <div>Check</div>
</div>

{/* data rows */}
{questions.map((q) => (
  <div
    key={q.id}
    className="
      grid grid-cols-1
      md:grid-cols-[2fr_1fr_1fr_3fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]
      gap-4 bg-white/20 backdrop-blur-md
      rounded-2xl shadow-md p-4 text-white
      hover:shadow-xl transition
    "
  >
    <div>{q.description || "–"}</div>  {/* ← maps to Question */}
    <div>{q.action || "–"}</div>       {/* ← maps to Action */}
    <div>{q.responsibleEmail || "–"}</div>
    <div>{q.responsibleRole || "–"}</div>
    <div className="flex flex-col gap-1">
      {["Oui","Non"].map((opt) => (
        <label key={opt} className="inline-flex items-center space-x-1">
          <input
            type="radio"
            name={`trigger-${q.id}`}
            value={opt}
            checked={q.triggerChoice===opt}
            onChange={async ()=>{
              setQuestions((curr)=>
                curr.map(x=> x.id===q.id?{...x,triggerChoice:opt}:x)
              );
              if(opt===q.triggerOn) await sendMail(q);
            }}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
    <div>{q.sendIntervalValue}</div>
    <div>{q.sendIntervalUnit}</div>
    <div title={q.lastSent||""}>
      {q.lastSent? new Date(q.lastSent).toLocaleString():"–"}
    </div>
    <div className="flex items-center space-x-1">
      <span className={`text-sm ${q.responseReceived?"text-green-300":"text-yellow-200"}`}>
        {q.responseReceived?"Yes":"No"}
      </span>
      <span className="text-xl">{q.responseReceived?"🟢":"🟡"}</span>
    </div>
    <div title={q.lastChecked||""}>
      {q.lastChecked? new Date(q.lastChecked).toLocaleString():"–"}
    </div>

    <div>
      <button
        onClick={()=>navigate(
          `/send-email/${projectKey}/implementation/${itemId}/edit-question/${q.id}`
        )}
        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mb-2"
      >
        Edit
      </button>
    </div>
    <div>
      <button
        onClick={()=>pollInboxForQuestion(q)}
        className="px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
      >
        Check ↻
      </button>
    </div>
  </div>
))}
      </div>
    </div>
  );
};

export default SendEmailPage;
