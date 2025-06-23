// File: src/pages/MonthlyKPIEditor.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";
import TopMenu from "../components/TopMenu";

// Represents the fields in "MonthlyKPIs"
interface IMonthlyKPIFields {
  year:string;
  Month: string; 
  Project: string;
  DRXIdeasubmittedIdea: number;
  DRXIdeasubmittedIdeaGoal: number;
  UnplanneddowntimecausedbyTechnic: number;
  rateofdowntime: number;
  Targetdowntime: number;
  seuildinterventiondowntime: number;
}

interface IMonthlyKPIItem {
  id: string;
  fields: IMonthlyKPIFields;
}

// Editor row state
interface IEditorRow {
  isEditing: boolean;
  draft: IMonthlyKPIFields;
}

const LISTS_CONFIG_KEY = "cmConfigLists";

const MonthlyKPIEditor: React.FC = () => {
  const [siteId, setSiteId] = useState("");
  const [listId, setListId] = useState("");
  const [items, setItems] = useState<IMonthlyKPIItem[]>([]);
  const [editorState, setEditorState] = useState<Record<string, IEditorRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // adjust as desired

  const navigate = useNavigate();

  // 1) Load site/list IDs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LISTS_CONFIG_KEY);
      if (raw) {
        const config = JSON.parse(raw);
        if (config?.siteId) setSiteId(config.siteId);
        if (config?.monthlyListId) setListId(config.monthlyListId);
      }
    } catch (err) {
      console.error("Error reading config from localStorage:", err);
    }
  }, []);

  // 2) Fetch items once we have siteId & listId
  useEffect(() => {
    if (!siteId || !listId) return;
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken(msalInstance,["https://graph.microsoft.com/Sites.Manage.All"]);
        if (!token) throw new Error("Could not get access token.");

        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setItems(response.data.value || []);
      } catch (err: any) {
        setError(err.message || "Failed to load monthly KPI items.");
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [siteId, listId]);

  // 3) Handle row double-click to enter editing mode
  const handleRowDoubleClick = (item: IMonthlyKPIItem) => {
    setEditorState((prev) => ({
      ...prev,
      [item.id]: {
        isEditing: true,
        draft: { ...item.fields },
      },
    }));
  };

  // Cancel editing
  const handleCancel = (itemId: string) => {
    setEditorState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], isEditing: false },
    }));
  };

  // Save changes (PATCH to Graph)
  const handleSave = async (itemId: string) => {
    const rowInfo = editorState[itemId];
    if (!rowInfo) return;

    try {
      const token = await getAccessToken(msalInstance,["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Could not get access token.");

      // ────────────────────────────────────────────────────────────
      // Build updatedFields by whitelisting only valid internal names
      // ────────────────────────────────────────────────────────────
      const allowedFields = [
        "year",
        "Month",
        "Project",
        "DRXIdeasubmittedIdea",
        "DRXIdeasubmittedIdeaGoal",
        "UnplanneddowntimecausedbyTechnic",
        "rateofdowntime",
        "Targetdowntime",
        "seuildinterventiondowntime",
        "BudgetDepartment"
      ];

      // Extract only the allowed keys from draft
      const rawDraft = rowInfo.draft;
      const updatedFields = allowedFields.reduce((acc, field) => {
        if (rawDraft[field as keyof IMonthlyKPIFields] !== undefined) {
          acc[field] = rawDraft[field as keyof IMonthlyKPIFields];
        }
        return acc;
      }, {} as Record<string, any>);

      // If the "Month" column must be strictly "YYYY-MM", remove day/time if present
      if (updatedFields.Month && updatedFields.Month.includes("T")) {
        // e.g. "2025-06-01T12:00:00Z" → "2025-06"
        updatedFields.Month = updatedFields.Month.substring(0, 7);
      }
      // ────────────────────────────────────────────────────────────

      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}/fields`,
        updatedFields,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local items with the new values
      setItems((prev) =>
        prev.map((itm) =>
          itm.id === itemId
            ? { ...itm, fields: { ...itm.fields, ...updatedFields } }
            : itm
        )
      );

      // Exit edit mode
      setEditorState((prev) => ({
        ...prev,
        [itemId]: { ...rowInfo, isEditing: false },
      }));
    } catch (err: any) {
      alert("Error saving changes: " + (err.response?.data?.error?.message || err.message));
    }
  };

  // Delete item
  const handleDelete = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = await getAccessToken(msalInstance,["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Could not get access token.");

      await axios.delete(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from local state
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setEditorState((prev) => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    } catch (err: any) {
      alert("Error deleting item: " + (err.response?.data?.error?.message || err.message));
    }
  };

  // Handle field changes in editing mode
  const handleEditFieldChange = (
    itemId: string,
    field: keyof IMonthlyKPIFields,
    value: string | number
  ) => {
    setEditorState((prev) => {
      const row = prev[itemId];
      if (!row) return prev;

      return {
        ...prev,
        [itemId]: {
          ...row,
          draft: {
            ...row.draft,
            [field]: typeof value === "string" ? value : +value,
          },
        },
      };
    });
  };

  // 4) Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  const pageCount = Math.ceil(items.length / itemsPerPage);

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-20 max-w-6xl mx-auto p-4 flex items-center space-x-4">
        <TopMenu />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          ← Back
        </button>
      </div>

      {/* Content Container */}
      <div className="relative z-20 max-w-8xl mx-auto px-4 pb-8">
        <h1 className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition">Monthly KPI Editor</h1>

        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-xl shadow-xl">
          {loading && <p>Loading items...</p>}
          {error && <p className="text-red-300">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p>No Monthly KPI items found.</p>
          )}

          {paginatedItems.length > 0 && (
            <table className="w-full border border-white/20 text-sm text-white">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-2 border border-white/20">Actions</th>
                  <th className="p-2 border border-white/20">Project</th>
                  <th className="p-2 border border-white/20">Year</th>
                  <th className="p-2 border border-white/20">Month</th>
                  <th className="p-2 border border-white/20">DRX Idea submitted Idea</th>
                  <th className="p-2 border border-white/20">DRX Idea submitted Idea Goal</th>
                  <th className="p-2 border border-white/20">Unplanned downtime caused by Technical Change</th>
                  <th className="p-2 border border-white/20">Rate of Downtime</th>
                  <th className="p-2 border border-white/20">Target Downtime</th>
                  <th className="p-2 border border-white/20">Seuil d'intervention Downtime</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((itm) => {
                  const rowState = editorState[itm.id];
                  const isEditing = rowState?.isEditing;

                  return (
                    <tr
                      key={itm.id}
                      onDoubleClick={() => handleRowDoubleClick(itm)}
                      className="hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      {/* Actions */}
                      <td className="p-2 border border-white/20 whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave(itm.id);
                              }}
                              className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(itm.id);
                              }}
                              className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowDoubleClick(itm);
                              }}
                              className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(itm.id);
                              }}
                              className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                      {/* Project */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="text"
                            className="border p-1 text-black w-32"
                            value={rowState?.draft.Project || ""}
                            onChange={(e) =>
                              handleEditFieldChange(itm.id, "Project", e.target.value)
                            }
                          />
                        ) : (
                          itm.fields.Project
                        )}
                      </td>
                       {/* Year */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="year"
                            className="border p-1 text-black w-24"
                            value={rowState?.draft.year || ""}
                            onChange={(e) =>
                              handleEditFieldChange(itm.id, "year", e.target.value)
                            }
                          />
                        ) : (
                          itm.fields.year
                        )}
                      </td>

                      {/* Month */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="month"
                            className="border p-1 text-black w-24"
                            value={rowState?.draft.Month || ""}
                            onChange={(e) =>
                              handleEditFieldChange(itm.id, "Month", e.target.value)
                            }
                          />
                        ) : (
                          itm.fields.Month
                        )}
                      </td>
                       {/* DRX Submitted Idea  */}
                      <td className="p-2 border border-white/20">
                      {isEditing ? (
                        <input
                          type="number"
                          className="border p-1 text-black w-16"
                          value={rowState?.draft.DRXIdeasubmittedIdea ?? 0}
                          onChange={(e) =>
                            handleEditFieldChange(itm.id, "DRXIdeasubmittedIdea", e.target.value)
                          }
                        />
                      ) : (
                        itm.fields.DRXIdeasubmittedIdea
                      )}
                    </td>

                      {/* DRX Submitted Idea Goal */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="number"
                            className="border p-1 text-black w-16"
                            value={rowState?.draft.DRXIdeasubmittedIdeaGoal ?? 0}
                            onChange={(e) =>
                              handleEditFieldChange(
                                itm.id,
                                "DRXIdeasubmittedIdeaGoal",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          itm.fields.DRXIdeasubmittedIdeaGoal
                        )}
                      </td>

                      {/* Unplanned Tech Downtime */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="number"
                            className="border p-1 text-black w-16"
                            value={rowState?.draft.UnplanneddowntimecausedbyTechnic ?? 0}
                            onChange={(e) =>
                              handleEditFieldChange(
                                itm.id,
                                "UnplanneddowntimecausedbyTechnic",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          itm.fields.UnplanneddowntimecausedbyTechnic
                        )}
                      </td>

                      {/* Rate of Downtime */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="number"
                            className="border p-1 text-black w-16"
                            value={rowState?.draft.rateofdowntime ?? 0}
                            onChange={(e) =>
                              handleEditFieldChange(
                                itm.id,
                                "rateofdowntime",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          itm.fields.rateofdowntime
                        )}
                      </td>

                      {/* Target Downtime */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="number"
                            className="border p-1 text-black w-16"
                            value={rowState?.draft.Targetdowntime ?? 0}
                            onChange={(e) =>
                              handleEditFieldChange(
                                itm.id,
                                "Targetdowntime",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          itm.fields.Targetdowntime
                        )}
                      </td>

                      {/* Seuil d'interv. Downtime */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="number"
                            className="border p-1 text-black w-16"
                            value={rowState?.draft.seuildinterventiondowntime ?? 0}
                            onChange={(e) =>
                              handleEditFieldChange(
                                itm.id,
                                "seuildinterventiondowntime",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          itm.fields.seuildinterventiondowntime
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination controls */}
          {pageCount > 1 && (
            <div className="flex mt-4 space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur 
                           rounded disabled:opacity-50 transition"
              >
                Prev
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded transition ${
                    page === currentPage
                      ? "bg-blue-500 text-white"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur
                           rounded disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyKPIEditor;
