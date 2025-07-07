// src/components/email/EmailSettings.tsx
import React, { useState } from "react";
import { IntervalUnit, QuestionState } from "../../pages/types";

export interface EmailSettingsProps {
  q: QuestionState;
  onSaveOrSend: (
    updated: QuestionState,
    action: "save" | "send"
  ) => Promise<any>;
}

const INTERVAL_UNITS: IntervalUnit[] = ["Minutes", "Hours", "Days"];

const EmailSettings: React.FC<EmailSettingsProps> = ({ q, onSaveOrSend }) => {
  const [respEmail, setRespEmail]     = useState(q.responsibleEmail);
  const [cc, setCc]                   = useState(q.cc || "");
  const [value, setValue]             = useState(q.sendIntervalValue);
  const [unit, setUnit]               = useState<IntervalUnit>(q.sendIntervalUnit);
  const [subjectPart, setSubjectPart] = useState(q.emailsubject || "");
  const [bodyPart, setBodyPart]       = useState(q.emailbody || "");

  const updatedQ: QuestionState = {
    ...q,
    responsibleEmail: respEmail,
    cc,
    sendIntervalValue: value,
    sendIntervalUnit: unit,
    emailsubject: subjectPart,
    emailbody: bodyPart,
  };

  return (
    <div className="space-y-4 text-white">
      {/* Responsible & CC */}
      <div className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-400">
        <div>
          <label>Responsible Email</label>
          <input
            type="email"
            className="w-full p-2 rounded"
            value={respEmail}
            onChange={e => setRespEmail(e.target.value)}
          />
        </div>
        <div>
          <label>CC (optional)</label>
          <input
            className="w-full p-2 rounded"
            value={cc}
            onChange={e => setCc(e.target.value)}
          />
        </div>
      </div>

      {/* Interval */}
      <div className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-400">
        <div>
          <label>Interval Value</label>
          <input
            type="number"
            min={1}
            className="w-full p-2 rounded"
            value={value}
            onChange={e => setValue(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Interval Unit</label>
          <select
            className="w-full p-2 rounded"
            value={unit}
            onChange={e =>
              setUnit(e.target.value as IntervalUnit)
            }
          >
            {INTERVAL_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject & Body */}
      <div>
        <label>Subject</label>
        <input
          className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
          value={subjectPart}
          onChange={e => setSubjectPart(e.target.value)}
        />
      </div>
      <div>
        <label>Body</label>
        <textarea
          className="w-full px-4 py-2 bg-white/80 text-black rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
          rows={4}
          value={bodyPart}
          onChange={e => setBodyPart(e.target.value)}
        />
      </div>

      {/* Save/Send */}
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-green-600 rounded"
          onClick={() => onSaveOrSend(updatedQ, "save")}
        >
          Save
        </button>
        <button
          className="px-4 py-2 bg-blue-600 rounded"
          onClick={() => onSaveOrSend(updatedQ, "send")}
        >
          Send Email
        </button>
      </div>
    </div>
  );
};

export default EmailSettings;
