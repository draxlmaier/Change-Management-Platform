// File: src/pages/AdminUserManager.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import { getResolvedSiteId } from "../utils/getResolvedSiteId";
import { getConfig } from "../services/configService";
import TopMenu from "../components/TopMenu";


const config = getConfig();
const USERS_LIST_ID = config.usersListId;

interface UserEntry {
  id?: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  permissions: string;
}

const AdminUserManager: React.FC = () => {
  const [user, setUser] = useState<UserEntry>({ name: "", email: "", role: "Viewer", permissions: "" });
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);

  const availableProjects: string[] = JSON.parse(localStorage.getItem("availableProjects") || "[]");

  const fetchUsers = async () => {
    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);
      const siteId = getResolvedSiteId();
      const res = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${USERS_LIST_ID}/items?$expand=fields`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.value.map((item: any) => ({ id: item.id, ...item.fields })));
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setUser((prev) => ({ ...prev, permissions: values.join(",") }));
  };

  const handleSubmit = async () => {
  try {
    const token = await getAccessToken(msalInstance, [
      "https://graph.microsoft.com/Sites.ReadWrite.All",
    ]);

    const siteId = getResolvedSiteId(); // Replaces hardcoded SITE_ID

    // Step 1: Load all items in the users list
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${USERS_LIST_ID}/items?$expand=fields`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Step 2: Check if user already exists by email
    const existingUser = response.data.value.find(
      (item: any) =>
        item.fields?.email?.toLowerCase() === user.email.toLowerCase()
    );

    if (existingUser) {
      setMessage("⚠️ A user with this email already exists.");
      return;
    }

    // Step 3: Create new user entry
    await axios.post(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${USERS_LIST_ID}/items`,
      {
        fields: {
          Title: user.email, // to support filtering later via indexed Title
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setMessage("✅ User successfully added.");
    setUser({ name: "", email: "", role: "Viewer", permissions: "" });
  } catch (err: any) {
    console.error(err);
    setMessage("❌ Failed to add user. Check console.");
  }
};

  const handleEdit = (u: UserEntry) => {
    setUser(u);
    setEditId(u.id || null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.ReadWrite.All"]);
      const siteId = getResolvedSiteId();
      await axios.delete(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${USERS_LIST_ID}/items/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("User deleted.");
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-4xl mx-auto text-black">
      <TopMenu />
      <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit User" : "Add New User"}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Full Name"
          value={user.name}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          name="email"
          placeholder="Email Address"
          type="email"
          value={user.email}
          onChange={handleChange}
          className="border p-2"
        />
        <select
          name="role"
          value={user.role}
          onChange={handleChange}
          className="border p-2"
        >
          <option value="">-- Select Role --</option>
          <option value="Admin">Admin</option>
          <option value="Editor">Editor</option>
          <option value="Viewer">Viewer</option>
        </select>

        <select
          multiple
          value={user.permissions.split(",")}
          onChange={handleProjectSelect}
          className="border p-2"
        >
          {availableProjects.map((proj) => (
            <option key={proj} value={proj}>
              {proj}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {isEditing ? "Update User" : "Add User"}
      </button>

      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}

      <hr className="my-6" />

      <h3 className="text-lg font-bold mb-2">User List</h3>
      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Permissions</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.role}</td>
                <td className="p-2 border">{u.permissions}</td>
                <td className="p-2 border">
                  <button onClick={() => handleEdit(u)} className="mr-2 text-blue-600">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(u.id!)} className="text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManager;
