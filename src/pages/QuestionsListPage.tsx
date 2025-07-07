// src/pages/QuestionsListPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopMenu from "../components/TopMenu";
import { useQuestions } from "../hooks/useQuestions";
import harnessBg from "../assets/images/harness-bg.png";
import { QuestionState } from "./types";
import { graphService } from "../services/EmailgraphService";

const QuestionsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectKey, phase, itemId } = useParams<{
    projectKey: string;
    phase:      string;
    itemId:     string;
  }>();

  // load & merge from Graph
  const { questions, loading, error } = useQuestions(projectKey!, itemId!);
  const [qs, setQs] = useState<QuestionState[]>([]);

  // track which question is currently checking
  const [checkingMap, setCheckingMap] = useState<Record<string, boolean>>({});

  // sync whenever questions change
  useEffect(() => {
    setQs(questions);
  }, [questions]);

  const goBack = () => navigate(`/details/${projectKey}/${phase}/${itemId}`);
  const onSend  = (q: QuestionState) =>
    navigate(`/send-email/${projectKey}/${phase}/${itemId}/${q.id}`);

  // poll inbox & set spinner
  const onCheck = async (q: QuestionState) => {
    const fixedSubject = `${q.questionId} ${q.changeNumber} - `;
    setCheckingMap(prev => ({ ...prev, [q.id]: true }));
    try {
      const updated = await graphService.pollInbox(q, fixedSubject);
      setQs(curr => curr.map(x => (x.id === q.id ? updated : x)));
    } catch (err) {
      console.error("Check response failed:", err);
    } finally {
      setCheckingMap(prev => ({ ...prev, [q.id]: false }));
    }
  };

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <TopMenu />

      {/* ← Back */}
      <button
        onClick={goBack}
        className="absolute top-4 left-4 z-20 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-2xl shadow-md transition"
      >
        ← Back
      </button>

      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-center">Questions for Change</h1>
          <p className="text-center text-white/70 mb-4">
            {projectKey} / {phase} / {itemId}
          </p>

          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <div className="space-y-4">
              {qs.map((q) => (
                <div
                  key={q.id}
                  className="bg-white/20 p-4 rounded-xl shadow-md"
                >
                  {/* Question + Send */}
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-lg truncate">
                      {q.description}
                    </div>
                    <button
                      onClick={() => onSend(q)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Send
                    </button>
                  </div>

                  {/* If it’s been sent, show last-sent / response / check */}
                  {q.lastSent && (
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-white/80">
                      {/* Last Sent */}
                      <div>
                        <strong>Last Sent:</strong>{" "}
                        {new Date(q.lastSent).toLocaleString()}
                      </div>

                      {/* Response Yes/No */}
                      <div>
                        <strong>Response:</strong>{" "}
                        <span
                          className={
                            q.responseReceived
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {q.responseReceived ? "Yes" : "No"}
                        </span>
                      </div>

                      {/* Check Response button or spinner */}
                      <div>
                        {checkingMap[q.id] ? (
                          <div className="flex items-center space-x-2">
                            <svg
                              className="animate-spin h-5 w-5 text-green-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                            <span>Checking…</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onCheck(q)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                          >
                            Check Response
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsListPage;
