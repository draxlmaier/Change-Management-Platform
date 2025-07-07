// src/services/EmailgraphService.ts

// 🔥 Module‐load

import axios from "axios";
import { getGraphToken } from "../hooks/useGraphAuth";
import { ListsConfig, QuestionState } from "../pages/types";
console.log("🛠️ [EGS] EmailgraphService module loaded");

const MS_PER_UNIT: Record<"Minutes"|"Hours"|"Days", number> = {
  Minutes: 60_000,
  Hours:   3_600_000,
  Days:   86_400_000,
};

export const graphService = {
  /** Load & merge ChangeQuestionStatus + QuestionTemplates */
  async listQuestions(projectKey: string, itemId: string): Promise<QuestionState[]> {
    console.log("🛠️ [EGS] listQuestions", { projectKey, itemId });

    // — 1) Config & Project
    const raw = localStorage.getItem("cmConfigLists");
    if (!raw) throw new Error("Configuration missing");
    const config: ListsConfig = JSON.parse(raw);
    const proj = config.projects.find(p => p.id === projectKey);
    if (!proj) throw new Error(`No project for key "${projectKey}"`);

    // — 2) Auth
    const token = await getGraphToken();
    if (!token) throw new Error("No Graph token");
    const headers = { Authorization: `Bearer ${token}` };

    // — 3) Fetch implementation item
    const implListId = proj.mapping.implementation;
    console.log("  → fetching impl item", implListId, itemId);
    const itemResp = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
      `/lists/${implListId}/items/${itemId}?expand=fields`,
      { headers }
    );
    const implFields = itemResp.data.fields;
    const processNum = implFields["Processnumber"] || "";
    const sheetArea  = implFields["SheetName"]    || "";

    // — 4) Fetch ChangeQuestionStatus
    const statusListId = proj.mapping.changeQuestionStatusListId;
    if (!statusListId) throw new Error("Missing ChangeQuestionStatus mapping");
    console.log("  → fetching status items", statusListId);

    let statusItems: any[] = [];
    let url = `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
              `/lists/${statusListId}/items?$top=5000&expand=fields`;
    while (url) {
      console.log("    • GET", url);
      const res = await axios.get(url, { headers });
      statusItems.push(...res.data.value);
      url = res.data["@odata.nextLink"] || null;
    }
    statusItems = statusItems.filter(it =>
      it.fields["ChangeNumber"] === processNum &&
      it.fields["Area"]         === sheetArea
    );

    // — 5) Fetch all QuestionTemplates
    console.log("  → fetching templates list", config.questionsListId);
    let templates: any[] = [];
    let tUrl = `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
               `/lists/${config.questionsListId}/items?$top=5000&expand=fields`;
    while (tUrl) {
      console.log("    • GET", tUrl);
      const tres = await axios.get(tUrl, { headers });
      templates.push(...tres.data.value);
      tUrl = tres.data["@odata.nextLink"] || null;
    }

    // — 6) Normalize + merge
    const normalized = templates.map((item: any) => {
      const lc: Record<string, any> = {};
      for (const k in item.fields) lc[k.toLowerCase()] = item.fields[k];
      return { questionId: (lc["questionid"]||"").toLowerCase(), fields: lc };
    });

    const merged: QuestionState[] = statusItems.map((st: any) => {
      const s = st.fields as Record<string, any>;
      const qid = (s["QuestionId"]||"").toLowerCase();
      const tpl = normalized.find(t => t.questionId === qid);

      let resp = false;
      if (typeof s["responseReceived"] === "boolean") resp = s["responseReceived"];
      else if (typeof s["responseReceived"] === "string")
        resp = s["responseReceived"].toLowerCase() === "true";

      return {
        id:                 st.id,
        changeNumber:       s["ChangeNumber"]       || "",
        area:               s["Area"]               || "",
        questionId:         s["QuestionId"]         || "",
        description:        tpl?.fields["question"] || "",
        action:             tpl?.fields["action"]   || "",
        responsibleEmail:   tpl?.fields["responsableemail"] || "",
        cc:                 s["cc"]                 || "",
        responsibleRole:    s["responsiblerole"]    || "",
        triggerOn:          tpl?.fields["triggeron"] || "Oui",
        triggerChoice:      "",
        sendIntervalValue:  tpl?.fields["sendintervalvalue"] ?? 3,
        sendIntervalUnit:   (tpl?.fields["sendintervalunit"] || "Days") as any,
        emailbody:          tpl?.fields["emailbody"]    || "",
        emailsubject:       tpl?.fields["emailsubject"] || "",
        lastSent:           s["lastSent"]           || "",
        responseReceived:   resp,
        conversationId:     s["conversationId"]     || "",
        internetMessageId:  s["internetMessageId"]  || "",
        lastChecked:        s["lastChecked"]        || "",
      };
    });

    console.log("🛠️ [EGS] listQuestions →", merged.length, "questions");
    return merged;
  },

  /** Fetch a single question by its status-item ID */
  async getQuestion(
    projectKey: string,
    _phase: string,
    itemId: string,
    questionId: string
  ): Promise<QuestionState> {
    console.log("🛠️ [EGS] getQuestion", { projectKey, itemId, questionId });
    const all = await this.listQuestions(projectKey, itemId);
    const q = all.find(x => x.id === questionId);
    if (!q) throw new Error(`No question found id="${questionId}"`);
    console.log("🛠️ [EGS] getQuestion → found", q);
    return q;
  },

  // ——————————————————————————————————————————————
  //  patchField
  // ——————————————————————————————————————————————
  async patchField(
    questionStatusItemId: string,
    key: string,
    val: any
  ): Promise<void> {
    console.log("🛠️ [EGS] patchField start", { questionStatusItemId, key, val });

    // 1) read config
    const raw = localStorage.getItem("cmConfigLists");
    if (!raw) {
      console.warn("[EGS] patchField aborted—missing cmConfigLists");
      return;
    }
    const config: ListsConfig = JSON.parse(raw);

    // 2) extract projectKey from hash
    const hash = window.location.hash;              // "#/send-email/mercedes-benz/feasibility/1/1"
    const path = hash.startsWith("#") ? hash.slice(1) : hash;
    const parts = path.split("/");                  // ["","send-email","mercedes-benz",...]
    const projectKey = parts[2];
    console.log("  → parsed projectKey from hash:", projectKey);

    // 3) find listId
    const proj = config.projects.find(p => p.id === projectKey);
    const listId = proj?.mapping.changeQuestionStatusListId;
    if (!listId) {
      console.warn("[EGS] patchField aborted—no listId for project", projectKey);
      return;
    }

    // 4) auth
    const token = await getGraphToken();
    if (!token) throw new Error("No Graph token for patchField");
    const headers = { Authorization: `Bearer ${token}` };

    // 5) PATCH
    const url =
      `https://graph.microsoft.com/v1.0/sites/${config.siteId}` +
      `/lists/${listId}/items/${questionStatusItemId}/fields`;
    try {
      const res = await axios.patch(url, { [key]: val }, { headers });
      console.log("🛠️ [EGS] patchField success", res.status, key);
    } catch (err: any) {
      console.error("🛠️ [EGS] patchField FAILED", { url, key, val, err });
      throw err;
    }
  },

  /** Save question (delegates to patchField) */
  async saveQuestion(q: QuestionState): Promise<void> {
    console.log("🛠️ [EGS] saveQuestion", q.id);
    await this.patchField(q.id, "ResponsableEmail",   q.responsibleEmail);
    await this.patchField(q.id, "Responsiblerole",    q.responsibleRole);
    await this.patchField(q.id, "SendIntervalValue",  q.sendIntervalValue);
    await this.patchField(q.id, "SendIntervalUnit",   q.sendIntervalUnit);
    await this.patchField(q.id, "Action",             q.action);
    await this.patchField(q.id, "emailbody",          q.emailbody  || "");
    await this.patchField(q.id, "emailsubject",       q.emailsubject || "");
    await this.patchField(q.id, "cc",                 q.cc         || "");
    console.log("🛠️ [EGS] saveQuestion complete", q.id);
  },

  /** Send the email, then patch status fields back to SharePoint */
  async sendMail(q: QuestionState, fixedSubject: string): Promise<QuestionState> {
    console.log("🛠️ [EGS] sendMail start", { id: q.id, fixedSubject });

    // a) POST /me/sendMail
    const token = await getGraphToken();
    if (!token) throw new Error("No Graph token for sendMail");
    const headers = { Authorization: `Bearer ${token}` };

    const toRecipients = [{ emailAddress: { address: q.responsibleEmail }}];
    const ccRecipients = (q.cc||"").split(",")
      .map(e => e.trim())
      .filter(Boolean)
      .map(address => ({ emailAddress: { address }}));

    const subject = fixedSubject + (q.emailsubject||"");
    const body    = `${q.action}\n\n${q.responsibleEmail}\n\n${q.emailbody||""}`;

    console.log("  → POST /me/sendMail", { subject, toRecipients, ccRecipients });
    await axios.post(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      { message: { subject, body: { contentType: "text", content: body }, toRecipients, ccRecipients }, saveToSentItems: true },
      { headers }
    );
    console.log("🛠️ [EGS] sendMail: mail sent");

    // b) GET last sent
    const sentResp = await axios.get(
      "https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=1&$orderby=sentDateTime desc",
      { headers }
    );
    const message = sentResp.data.value[0];
    console.log("🛠️ [EGS] sendMail: fetched sent message", message.id);

    const now = new Date().toISOString();

    // c) patch status fields
    console.log("  → patch lastSent, lastChecked, responseReceived");
    await this.patchField(q.id, "lastSent",         now);
    await this.patchField(q.id, "lastChecked",      now);
    await this.patchField(q.id, "responseReceived", false);
    await this.patchField(q.id, "conversationId",   message.conversationId);
    await this.patchField(q.id, "internetMessageId", message.internetMessageId);

    console.log("🛠️ [EGS] sendMail complete for", q.id);

    // d) return updated copy
    return { ...q,
      lastSent:         now,
      lastChecked:      now,
      responseReceived: false,
      conversationId:   message.conversationId,
      internetMessageId: message.internetMessageId
    };
  },

  /** Poll for a “Re:” reply */
  async pollInbox(q: QuestionState, fixedSubject: string): Promise<QuestionState> {
    console.log("🛠️ [EGS] pollInbox start", { id: q.id, fixedSubject });

    const token = await getGraphToken();
    if (!token) throw new Error("No Graph token for pollInbox");
    const headers = { Authorization: `Bearer ${token}` };

    if (!q.lastSent) {
      console.warn("[EGS] pollInbox: no lastSent, skipping");
      return q;
    }

    let url = "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=100&$orderby=receivedDateTime desc";
    let matched = false, updatedQ = q;

    while (url && !matched) {
      console.log("    • GET", url);
      const res = await axios.get(url, { headers });
      for (const msg of res.data.value) {
        const s = msg.sender?.emailAddress?.address||"";
        const subj = (msg.subject||"").toLowerCase();
        if (
          ["re:","re ","ré:","ré "].some(p => subj.startsWith(p)) &&
          subj.includes(fixedSubject.trim().toLowerCase()) &&
          s.toLowerCase() === q.responsibleEmail.toLowerCase() &&
          new Date(msg.receivedDateTime) > new Date(q.lastSent!)
        ) {
          console.log("  → pollInbox: matched reply", msg.id);
          const now = new Date().toISOString();
          await this.patchField(q.id, "responseReceived", true);
          await this.patchField(q.id, "lastChecked", now);
          updatedQ = { ...q, responseReceived: true, lastChecked: now };
          matched = true;
          break;
        }
      }
      url = !matched ? res.data["@odata.nextLink"] : null;
    }

    console.log("🛠️ [EGS] pollInbox complete for", q.id);
    return updatedQ;
  }
};
