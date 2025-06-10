// File: src/pages/FollowCostKPIEditor.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";
// ★ 1) Make sure each field can be string OR number if you actually allow that in your UI
//    If you need strictly numbers for certain fields, keep them as "number" but make sure you
//    handle them properly where you convert strings from <input> to numbers.
interface IFollowCostFields {
  Project: string;
  Area: string;
  Followupcost_x002f_BudgetPA: number; // adjust if you allow strings
  InitiationReasons: string;
  BucketID: string;
  Date: string; // e.g., "YYYY-MM-DD"
  BucketResponsible: string;
  Postname_x002f_ID: string;
}

// Each item returned by Graph
interface IFollowCostKPIItem {
  id: string;
  fields: IFollowCostFields;
}

// Inline editing row structure
interface IEditorRow {
  isEditing: boolean;
  draft: IFollowCostFields;
}

const LISTS_CONFIG_KEY = "cmConfigLists";

const FollowCostKPIEditor: React.FC = () => {
  const [siteId, setSiteId] = useState("");
  const [listId, setListId] = useState("");
  const [items, setItems] = useState<IFollowCostKPIItem[]>([]);
  const [editorState, setEditorState] = useState<Record<string, IEditorRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  // Load site configs
  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (config?.siteId) setSiteId(config.siteId);
        if (config?.followCostListId) setListId(config.followCostListId);
      } catch (err) {
        console.error("Error reading config from localStorage:", err);
      }
    }
  }, []);

  // Load items from the "FollowCostKPI" list
  useEffect(() => {
    if (!siteId || !listId) return;

    async function loadItems() {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
        if (!token) {
          throw new Error("Could not get access token.");
        }

        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setItems(response.data.value || []);
      } catch (err: any) {
        console.error("Error loading FollowCostKPI items:", err);
        setError(err.message || "Failed to load FollowCostKPI items.");
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, [siteId, listId]);

  // Enter edit mode
  const handleRowDoubleClick = (item: IFollowCostKPIItem) => {
    setEditorState((prev) => ({
      ...prev,
      [item.id]: {
        isEditing: true,
        draft: { ...item.fields },
      },
    }));
  };

  // Cancel edit
  const handleCancel = (itemId: string) => {
    setEditorState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], isEditing: false },
    }));
  };

  // ★ 2) Save changes: Build a Partial<IFollowCostFields> to keep TS from complaining.
  const handleSave = async (itemId: string) => {
  const rowState = editorState[itemId];
  if (!rowState) return;

  try {
    const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
    if (!token) throw new Error("Could not get access token.");

    const allowedFields: (keyof IFollowCostFields)[] = [
      "Project",
      "Area",
      "Followupcost_x002f_BudgetPA",
      "InitiationReasons",
      "BucketID",
      "Date",
      "BucketResponsible",
      "Postname_x002f_ID",
    ];

    const rawDraft = rowState.draft;

    const updatedFields = allowedFields.reduce((acc, field) => {
      const value = rawDraft[field];
      if (value !== undefined) {
        (acc as any)[field] = value;
      }
      return acc;
    }, {} as Partial<IFollowCostFields>);

    // Ensure only YYYY-MM-DD for date
    if (updatedFields.Date && updatedFields.Date.includes("T")) {
      updatedFields.Date = updatedFields.Date.substring(0, 10);
    }

    // Send PATCH request to update item
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

    // Update local state
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
      [itemId]: { ...prev[itemId], isEditing: false },
    }));
  } catch (err: any) {
    alert("Error saving changes: " + (err.response?.data?.error?.message || err.message));
  }
};



  // Delete item
  const handleDelete = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Could not get access token.");

      await axios.delete(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Remove from local state
      setItems((prev) => prev.filter((itm) => itm.id !== itemId));
      setEditorState((prev) => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    } catch (err: any) {
      alert("Error deleting item: " + (err.response?.data?.error?.message || err.message));
    }
  };

  // Handle field changes while editing
  const handleEditFieldChange = (
    itemId: string,
    field: keyof IFollowCostFields,
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
            // If you want certain fields to always be numbers, parse them here:
            // [field]: typeof value === "string" ? parseFloat(value) : value,
            [field]: value,
          },
        },
      };
    });
  };

  // Pagination
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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          ← Back
        </button>
      </div>

      {/* Content container */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pb-8">
        <h1 className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition">FollowCost KPI Editor</h1>

        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-xl shadow-xl">
          {loading && <p>Loading items...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!loading && !error && items.length === 0 && <p>No FollowCostKPI items found.</p>}

          {paginatedItems.length > 0 && (
            <table className="w-full border border-white/20 text-sm text-white">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-2 border border-white/20">Actions</th>
                  <th className="p-2 border border-white/20">Project</th>
                  <th className="p-2 border border-white/20">Area</th>
                  <th className="p-2 border border-white/20">Follow up cost / Budget PA</th>
                  <th className="p-2 border border-white/20">Initiation Reasons</th>
                  <th className="p-2 border border-white/20">Bucket ID</th>
                  <th className="p-2 border border-white/20">Date</th>
                  <th className="p-2 border border-white/20">Bucket Responsible</th>
                  <th className="p-2 border border-white/20">Post name / ID</th>
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
                            className="border p-1 w-24 text-black"
                            value={rowState?.draft.Project || ""}
                            onChange={(e) => handleEditFieldChange(itm.id, "Project", e.target.value)}
                          />
                        ) : (
                          itm.fields.Project
                        )}
                      </td>

                      {/* Area */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="text"
                            className="border p-1 w-24 text-black"
                            value={rowState?.draft.Area || ""}
                            onChange={(e) => handleEditFieldChange(itm.id, "Area", e.target.value)}
                          />
                        ) : (
                          itm.fields.Area
                        )}
                      </td>

                      {/* Followupcost_x002f_BudgetPA */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="number"
                            className="border p-1 w-24 text-black"
                            value={rowState?.draft.Followupcost_x002f_BudgetPA ?? 0}
                            onChange={(e) =>
                              handleEditFieldChange(
                                itm.id,
                                "Followupcost_x002f_BudgetPA",
                                Number(e.target.value)
                              )
                            }
                          />
                        ) : (
                          itm.fields.Followupcost_x002f_BudgetPA
                        )}
                      </td>

                      {/* InitiationReasons */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="text"
                            className="border p-1 w-32 text-black"
                            value={rowState?.draft.InitiationReasons || ""}
                            onChange={(e) =>
                              handleEditFieldChange(itm.id, "InitiationReasons", e.target.value)
                            }
                          />
                        ) : (
                          itm.fields.InitiationReasons
                        )}
                      </td>

                      {/* BucketID */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="text"
                            className="border p-1 w-20 text-black"
                            value={rowState?.draft.BucketID || ""}
                            onChange={(e) => handleEditFieldChange(itm.id, "BucketID", e.target.value)}
                          />
                        ) : (
                          itm.fields.BucketID
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="date"
                            className="border p-1 w-28 text-black"
                            value={rowState?.draft.Date || ""}
                            onChange={(e) => handleEditFieldChange(itm.id, "Date", e.target.value)}
                          />
                        ) : (
                          itm.fields.Date
                        )}
                      </td>

                      {/* BucketResponsible */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="text"
                            className="border p-1 w-28 text-black"
                            value={rowState?.draft.BucketResponsible || ""}
                            onChange={(e) =>
                              handleEditFieldChange(itm.id, "BucketResponsible", e.target.value)
                            }
                          />
                        ) : (
                          itm.fields.BucketResponsible
                        )}
                      </td>

                      {/* Postname_x002f_ID */}
                      <td className="p-2 border border-white/20">
                        {isEditing ? (
                          <input
                            type="text"
                            className="border p-1 w-28 text-black"
                            value={rowState?.draft.Postname_x002f_ID || ""}
                            onChange={(e) =>
                              handleEditFieldChange(itm.id, "Postname_x002f_ID", e.target.value)
                            }
                          />
                        ) : (
                          itm.fields.Postname_x002f_ID
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {pageCount > 1 && (
            <div className="flex mt-4 space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur rounded
                           disabled:opacity-50 transition"
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
                className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur rounded
                           disabled:opacity-50 transition"
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

export default FollowCostKPIEditor;
