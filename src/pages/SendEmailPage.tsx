// src/pages/SendEmailPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopMenu from "../components/TopMenu";
import EmailSettings from "../components/email/EmailSettings";
import harnessBg from "../assets/images/harness-bg.png";
import { QuestionState } from "./types";
import { graphService } from "../services/EmailgraphService";

const SendEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectKey, phase, itemId, questionId } = useParams<{
    projectKey: string;
    phase:      string;
    itemId:     string;
    questionId: string;
  }>();

  const [q, setQ] = useState<QuestionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectKey || !phase || !itemId || !questionId) return;
    setLoading(true);
    graphService
      .getQuestion(projectKey, phase, itemId, questionId)
      .then(setQ)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectKey, phase, itemId, questionId]);

  if (loading) return <div className="p-8 text-white">Loading…</div>;
  if (!q)      return <div className="p-8 text-red-400">Question not found</div>;

  const fixedSubject = `${q.questionId} ${q.changeNumber} - `;

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <ToastContainer />
      <TopMenu />

      {/* ← Back */}
      <button
        onClick={() => navigate(`/send-email/${projectKey}/${phase}/${itemId}`)} 
        className="absolute top-4 left-4 z-20 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-2xl shadow-md transition"
      >
        ← Back
      </button>

      {/* Glass‐card wrapper */}
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Send Email</h1>
          <h2 className="text-xl text-white/80 mb-6">
            Question: {q.questionId}
          </h2>
          <EmailSettings
            q={q}
            onSaveOrSend={async (updated, action) => {
              const latest = await graphService.sendMail(
                updated,
                fixedSubject
              );
              setQ(latest);
              navigate(`/send-email/${projectKey}/${phase}/${itemId}`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SendEmailPage;
