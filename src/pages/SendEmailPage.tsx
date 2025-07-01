import React, { useEffect, useState, useRef } from "react";
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

type IntervalUnit = "Minutes" | "Hours" | "Days";

interface QuestionState {
  changeNumber: string;
  area: string;
  id: string;
  questionId: string;
  description: string;
  action: string;
  responsibleEmail: string;
  cc?: string;
  responsibleRole: string;
  triggerOn: string;
  triggerChoice: string;
  sendIntervalValue: number;
  sendIntervalUnit: IntervalUnit;
  emailbody?: string;
  emailsubject?: string;
  lastSent?: string;
  responseReceived: boolean;
  conversationId?: string;
  internetMessageId?: string;
  lastChecked?: string;
}

const MS_PER_UNIT: Record<IntervalUnit, number> = {
  Minutes: 60000,
  Hours: 3600000,
  Days: 86400000,
};
const INTERVAL_UNITS: IntervalUnit[] = ["Minutes", "Hours", "Days"];

const SendEmailPage: React.FC = () => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [processnumber, setProcessNumber] = useState("");
  const [carline, setCarline] = useState("");
  const [area, setArea] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const intervalRefs = useRef<{ [qid: string]: any }>({});

  // --- Data loading effect ---
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
        setProjectName(foundProject.displayName);

        const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
        if (!token) throw new Error("No Graph token");
        const headers = { Authorization: `Bearer ${token}` };

        // Get user email
        const profile = await axios.get("https://graph.microsoft.com/v1.0/me", { headers });
        if (mounted) setUserEmail(profile.data.mail || profile.data.userPrincipalName);

        // Fetch the change item (to get carline, area, processnumber)
        const itemResp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${foundProject.mapping.implementation}/items/${itemId}?expand=fields`,
          { headers }
        );
        const fields = itemResp.data.fields;
        const processNum = fields["Processnumber"] || "";
        const sheetArea = fields["SheetName"] || "";
        if (mounted) {
          setProcessNumber(processNum);
          setCarline(fields["Carline"] || "");
          setArea(sheetArea);
        }

        // Fetch ChangeQuestionStatus entries for this change+area
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
            it.fields["Area"] === sheetArea
        );

        // Fetch all QuestionTemplates
        let templates: any[] = [];
        let tUrl = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${config.questionsListId}/items?$top=5000&expand=fields`;
        while (tUrl) {
          const tres = await axios.get(tUrl, { headers });
          templates.push(...tres.data.value);
          tUrl = tres.data["@odata.nextLink"] || null;
        }

        // Normalize templates by lowercase QuestionId
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

          let resp = false;
          if (typeof s["responseReceived"] === "boolean") resp = s["responseReceived"];
          else if (typeof s["responseReceived"] === "string") resp = s["responseReceived"].toLowerCase() === "true";

          return {
            id: st.id,
            changeNumber: s["ChangeNumber"] || "",
            area: s["Area"] || "",
            questionId: s["QuestionId"] || "",
            description: tpl?.fields["question"] || "",
            action: tpl?.fields["action"] || "",
            responsibleEmail: tpl?.fields["responsableemail"] || "",
            cc: s["cc"] || "",
            responsibleRole: tpl?.fields["responsiblerole"] || "",
            triggerOn: tpl?.fields["triggeron"] || "Oui",
            triggerChoice: "",
            sendIntervalValue: tpl?.fields["sendintervalvalue"] ?? 3,
            sendIntervalUnit: tpl?.fields["sendintervalunit"] || "Days",
            emailbody: tpl?.fields["emailbody"] || "",
            emailsubject: tpl?.fields["emailsubject"] || "",
            lastSent: s["lastSent"] || "",
            responseReceived: resp,
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
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, [projectKey, itemId]);

  // --- AUTO-SEND INTERVAL LOGIC ---
  useEffect(() => {
    Object.values(intervalRefs.current).forEach(clearInterval);
    intervalRefs.current = {};

    questions.forEach((q) => {
      if (
        q.triggerChoice === q.triggerOn &&
        q.responsibleEmail &&
        q.sendIntervalValue > 0 &&
        q.sendIntervalUnit &&
        !q.responseReceived
      ) {
        const ms = q.sendIntervalValue * MS_PER_UNIT[q.sendIntervalUnit];
        intervalRefs.current[q.id] = setInterval(async () => {
          const lastSent = q.lastSent ? new Date(q.lastSent).getTime() : 0;
          const now = Date.now();
          if (!q.lastSent || now - lastSent >= ms) {
            const fixedSubject = `${q.questionId} ${projectName} ${carline} ${q.changeNumber} - `;
            await sendMail(q, fixedSubject, setQuestions);
          }
        }, 60 * 1000);
      }
    });

    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
      intervalRefs.current = {};
    };
  }, [questions, carline, projectName]);

  // ---- RENDER ----
  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <TopMenu />
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 px-8 pt-6">
        <button
          onClick={() => navigate(`/details/${projectKey}/Feasibility/${itemId}`)}
          className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
        >
          ← Back
        </button>
      </div>
      {error && <div className="text-red-500 px-8 mb-4">{error}</div>}

      <div className="relative z-20 w-full px-2 py-6 overflow-x-auto" style={{ maxWidth: "100vw" }}>
        <div style={{ minWidth: 900 }}>
          {/* Header row for 2 main columns */}
          <div className="grid grid-cols-2 gap-6 px-4 py-2 font-semibold bg-black/30 rounded-xl shadow-lg">
            <div>Question</div>
            <div>Action</div>
          </div>
          {questions.map((q) => {
            const isExpanded = expandedId === q.id;
            const isSent = !!q.lastSent;
            const fixedSubject = `${q.questionId} ${projectName} ${carline} ${q.changeNumber} - `;
            const fixedBody = `${q.action}\n\n${userEmail}\n\n`;
            return (
              <React.Fragment key={q.id}>
                <div
                  className={`
                    grid grid-cols-2 gap-6 bg-white/20 rounded-2xl shadow-md p-4 text-white
                    hover:shadow-xl transition mt-2 cursor-pointer
                  `}
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  <div>
                    <span className="font-bold">{q.description || "–"}</span>
                  </div>
                  <div>
                    <span className="font-bold">{q.action || "–"}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="bg-white/20 backdrop-blur rounded-b-2xl px-8 py-4 mb-2 ml-2 mr-2 flex flex-col gap-4 max-w-2xl shadow-inner border-l-4 border-blue-300">
                    {isSent ? (
                      // Show info/check/edit, never trigger again
                      <div className="flex flex-col gap-3 mt-2">
                        <div className="flex flex-wrap gap-6">
                          <span>
                            <span className="font-semibold">Last Sent:</span>{" "}
                            {q.lastSent ? new Date(q.lastSent).toLocaleString() : "–"}
                          </span>
                          <span>
                            <span className="font-semibold">Last Checked:</span>{" "}
                            {q.lastChecked ? new Date(q.lastChecked).toLocaleString() : "–"}
                          </span>
                          <span>
                            <span className="font-semibold">Response Received:</span>{" "}
                            <span className={`font-bold ${q.responseReceived ? "text-green-600" : "text-yellow-500"}`}>
                              {q.responseReceived ? "Yes" : "No"}
                            </span>
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <button
                            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
                            onClick={() => pollInboxForQuestion(q, fixedSubject)}
                          >
                            Check Response
                          </button>
                          <button
                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            onClick={() =>
                              navigate(`/send-email/${projectKey}/implementation/${itemId}/edit-question/${q.id}`)
                            }
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Trigger Radio */}
                        <div>
                          <span className="mr-4 font-semibold">Response (Trigger):</span>
                          {["Oui", "Non"].map((opt) => (
                            <label key={opt} className="inline-flex items-center space-x-1 mr-6">
                              <input
                                type="radio"
                                name={`trigger-${q.id}`}
                                value={opt}
                                checked={q.triggerChoice === opt}
                                onChange={() => {
                                  setQuestions((curr) =>
                                    curr.map((x) =>
                                      x.id === q.id ? { ...x, triggerChoice: opt } : x
                                    )
                                  );
                                }}
                                disabled={isSent}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                        {/* Show send form if trigger matches */}
                        {q.triggerChoice === q.triggerOn && (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block font-semibold mb-1">Responsible Email <span className="text-red-500">*</span></label>
                                <input
                                  className="w-full rounded-xl bg-gray-100 px-4 py-3 text-lg border border-transparent focus:border-blue-400 focus:bg-white outline-none transition"
                                  value={q.responsibleEmail}
                                  onChange={e =>
                                    setQuestions(curr =>
                                      curr.map(x =>
                                        x.id === q.id ? { ...x, responsibleEmail: e.target.value } : x
                                      )
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <label className="block font-semibold mb-1">CC (optional)</label>
                                <input
                                  className="w-full rounded-xl bg-gray-100 px-4 py-3 text-lg border border-transparent focus:border-blue-400 focus:bg-white outline-none transition"
                                  value={q.cc || ""}
                                  onChange={e =>
                                    setQuestions(curr =>
                                      curr.map(x =>
                                        x.id === q.id ? { ...x, cc: e.target.value } : x
                                      )
                                    )
                                  }
                                  placeholder="Comma-separated emails"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block font-semibold mb-1">Send Interval Value</label>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-full rounded-xl bg-gray-100 px-4 py-3 text-lg border border-transparent focus:border-blue-400 focus:bg-white outline-none transition"
                                  value={q.sendIntervalValue}
                                  onChange={e =>
                                    setQuestions(curr =>
                                      curr.map(x =>
                                        x.id === q.id
                                          ? { ...x, sendIntervalValue: Number(e.target.value) }
                                          : x
                                      )
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="block font-semibold mb-1">Send Interval Unit</label>
                                <select
                                  className="w-full rounded-xl bg-gray-100 px-4 py-3 text-lg border border-transparent focus:border-blue-400 focus:bg-white outline-none transition"
                                  value={q.sendIntervalUnit}
                                  onChange={e =>
                                    setQuestions(curr =>
                                      curr.map(x =>
                                        x.id === q.id
                                          ? { ...x, sendIntervalUnit: e.target.value as IntervalUnit }
                                          : x
                                      )
                                    )
                                  }
                                >
                                  {INTERVAL_UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {/* Subject */}
                            <div>
                              <label className="block font-semibold mb-1">Email Subject</label>
                              <div className="flex flex-col md:flex-row gap-2">
                                <span className="bg-gray-200 text-black px-3 py-2 rounded-l-xl font-mono">{fixedSubject}</span>
                                <input
                                  className="flex-1 rounded-r-xl bg-gray-100 px-4 py-3 text-lg border border-transparent focus:border-blue-400 focus:bg-white outline-none transition"
                                  value={q.emailsubject || ""}
                                  onChange={e =>
                                    setQuestions(curr =>
                                      curr.map(x =>
                                        x.id === q.id ? { ...x, emailsubject: e.target.value } : x
                                      )
                                    )
                                  }
                                  placeholder="Personalized subject part"
                                />
                              </div>
                            </div>
                            {/* Email Body */}
                            <div>
                              <label className="block font-semibold mb-1">Email Body</label>
                              <div className="flex flex-col gap-2">
                                <textarea
                                  className="w-full rounded-xl bg-gray-200 px-4 py-3 text-base text-black font-mono"
                                  value={fixedBody}
                                  readOnly
                                />
                                <textarea
                                  className="w-full rounded-xl bg-gray-100 px-4 py-3 text-base text-black border border-transparent focus:border-blue-400 focus:bg-white outline-none transition"
                                  value={q.emailbody || ""}
                                  onChange={e =>
                                    setQuestions(curr =>
                                      curr.map(x =>
                                        x.id === q.id ? { ...x, emailbody: e.target.value } : x
                                      )
                                    )
                                  }
                                  placeholder="Personalized message (optional)"
                                  rows={4}
                                />
                              </div>
                            </div>
                            {/* Buttons */}
                            <div className="flex gap-4 mt-4">
                              <button
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                onClick={() => saveQuestion({ ...q, emailsubject: q.emailsubject || "", emailbody: q.emailbody || "" })}
                              >
                                Save
                              </button>
                              <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => sendMail(q, fixedSubject, setQuestions)}
                                disabled={!q.responsibleEmail}
                              >
                                Send Email
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Patch a single field in ChangeQuestionStatus list for a question
async function patchField(questionId: string, key: string, val: any) {
  try {
    const raw = localStorage.getItem("cmConfigLists");
    if (!raw) return;
    const config: ListsConfig = JSON.parse(raw);
    const proj = config.projects.find((p) => p.id === (window.location.pathname.split('/')[2]));
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
}

// Save all editable fields to SharePoint
async function saveQuestion(q: QuestionState) {
  await patchField(q.id, "ResponsableEmail", q.responsibleEmail);
  await patchField(q.id, "Responsiblerole", q.responsibleRole);
  await patchField(q.id, "SendIntervalValue", q.sendIntervalValue);
  await patchField(q.id, "SendIntervalUnit", q.sendIntervalUnit);
  await patchField(q.id, "Action", q.action);
  await patchField(q.id, "emailbody", q.emailbody || "");
  await patchField(q.id, "emailsubject", q.emailsubject || "");
  await patchField(q.id, "cc", q.cc || "");
}

// Send Email (with CC, fixed + personalized subject/body)
async function sendMail(
  q: QuestionState,
  fixedSubject: string,
  setQuestions: React.Dispatch<React.SetStateAction<QuestionState[]>>
) {
  try {
    const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
    const headers = { Authorization: `Bearer ${token}` };

    const toRecipients = [{ emailAddress: { address: q.responsibleEmail } }];
    let ccRecipients: any[] = [];
    if (q.cc && q.cc.trim()) {
      ccRecipients = q.cc.split(",").map(email => ({
        emailAddress: { address: email.trim() }
      })).filter(x => !!x.emailAddress.address);
    }

    const subject = fixedSubject + (q.emailsubject || "");
    const body = `${q.action}\n\n${q.responsibleEmail}\n\n${q.emailbody || ""}`;

    await axios.post(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        message: {
          subject,
          body: {
            contentType: "text",
            content: body,
          },
          toRecipients,
          ccRecipients,
        },
        saveToSentItems: true,
      },
      { headers }
    );

    // Find the sent message for tracking fields
    const sentResponse = await axios.get(
      "https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=1&$orderby=sentDateTime desc",
      { headers }
    );
    const message = sentResponse.data.value[0];
    const now = new Date().toISOString();

    await patchField(q.id, "lastSent", now);
    await patchField(q.id, "lastChecked", now);
    await patchField(q.id, "responseReceived", false);
    await patchField(q.id, "conversationId", message.conversationId);
    await patchField(q.id, "internetMessageId", message.internetMessageId);

    // Update UI immediately
    setQuestions(curr =>
      curr.map(x =>
        x.id === q.id
          ? {
              ...x,
              lastSent: now,
              lastChecked: now,
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
}

// Check for response (Re: or RE: or re:), fixed subject, after lastSent, correct sender
async function pollInboxForQuestion(q: QuestionState, fixedSubject: string) {
  try {
    const token = await getAccessToken(msalInstance, graphTokenRequest.scopes);
    const headers = { Authorization: `Bearer ${token}` };

    if (!q.lastSent) return;

    let url = `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=100&$orderby=receivedDateTime desc`;
    let matched = false;

    while (url && !matched) {
      const res = await axios.get(url, { headers });
      const messages = res.data.value;

      for (const msg of messages) {
        const sender = msg.sender?.emailAddress?.address || "";
        const subject = msg.subject || "";
        const rePrefixes = ["re:", "re ", "ré:", "ré "];
        const lowerSubj = subject.trim().toLowerCase();
        const expected = fixedSubject.trim().toLowerCase();
        const hasRe = rePrefixes.some(prefix => lowerSubj.startsWith(prefix));
        const subjMatches = lowerSubj.includes(expected);
        const isCorrectSender =
          sender.toLowerCase() === q.responsibleEmail.toLowerCase();
        const isAfterLastSent =
          new Date(msg.receivedDateTime) > new Date(q.lastSent!);

        if (hasRe && subjMatches && isCorrectSender && isAfterLastSent) {
          const now = new Date().toISOString();
          await patchField(q.id, "responseReceived", true);
          await patchField(q.id, "lastChecked", now);
          matched = true;
          break;
        }
      }
      url = !matched ? res.data["@odata.nextLink"] : null;
    }
  } catch (err) {
    console.error("Error polling inbox:", err);
  }
}

export default SendEmailPage;
