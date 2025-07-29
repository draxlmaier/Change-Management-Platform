import React, { useEffect, useState } from "react";
import { msalInstance } from "../auth/msalInstance";
import { getAccessToken } from "../auth/getToken";
import { getConfig, saveConfig } from "../services/configService";
import { getResolvedSiteId } from "../utils/getResolvedSiteId";

interface Plant {
  id: string;
  name: string;
}

interface AssignedRole {
  email: string;
  role: string;
  plantId?: string;
}

export default function SuperAdminPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [admins, setAdmins] = useState<AssignedRole[]>([]);

  const siteId = getResolvedSiteId();
  const siteUrl = `https://uittunis.sharepoint.com/sites/${siteId}`;

  useEffect(() => {
    const cfg = getConfig();
    setPlants(cfg.projects.map((p: any) => ({ id: p.id, name: p.displayName })));
    const rolesWithPlant = (cfg.assignedRoles || []).map((r: any) => ({
      email: r.email,
      role: r.role,
      plantId: r.plantId || "",
    }));
    setAdmins(rolesWithPlant);
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const token = await getAccessToken(msalInstance, ["Sites.Read.All"]);
    const res = await fetch(`${siteUrl}/_api/web/sitegroups`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json;odata=verbose" },
    });
    const data = await res.json();
    setGroups(data.d.results);
  };

  const createGroup = async (title: string) => {
    const token = await getAccessToken(msalInstance, ["Sites.Manage.All"]);
    await fetch(`${siteUrl}/_api/web/sitegroups`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
      },
      body: JSON.stringify({
        __metadata: { type: "SP.Group" },
        Title: title,
        Description: `Group for ${title}`,
      }),
    });
    fetchGroups();
  };

  const deleteGroup = async (groupId: number) => {
    const token = await getAccessToken(msalInstance, ["Sites.Manage.All"]);
    await fetch(`${siteUrl}/_api/web/sitegroups/removebyid('${groupId}')`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json;odata=verbose"},
    });
    fetchGroups();
  };

  const addPlant = () => {
    const id = prompt("Enter Plant ID (e.g. METS):");
    const name = prompt("Enter Plant Name:");
    if (!id || !name) return;

    const cfg = getConfig();
    cfg.projects.push({ id: id.toLowerCase(), displayName: name, mapping: { implementation: "" } });
    saveConfig(cfg);
    setPlants(cfg.projects.map((p: any) => ({ id: p.id, name: p.displayName })));
  };

  const editPlant = (id: string) => {
    const newName = prompt("Enter new name for this plant:");
    if (!newName) return;
    const cfg = getConfig();
    cfg.projects = cfg.projects.map((p: any) =>
      p.id === id ? { ...p, displayName: newName } : p
    );
    saveConfig(cfg);
    setPlants(cfg.projects.map((p: any) => ({ id: p.id, name: p.displayName })));
  };

  const deletePlant = (id: string) => {
    const cfg = getConfig();
    cfg.projects = cfg.projects.filter((p: any) => p.id !== id);
    saveConfig(cfg);
    setPlants(cfg.projects.map((p: any) => ({ id: p.id, name: p.displayName })));
  };

  const assignAdmin = (plantId: string) => {
    const email = prompt("Enter Admin Email:");
    if (!email) return;
    const cfg = getConfig();
    cfg.assignedRoles = cfg.assignedRoles || [];
    const newRole: AssignedRole = { email, role: "plant-admin", plantId };
    cfg.assignedRoles.push(newRole);
    saveConfig(cfg);
    setAdmins(cfg.assignedRoles.map((r: any) => ({ ...r, plantId: r.plantId || "" })));
  };

  const removeAdmin = (email: string, plantId: string) => {
    const cfg = getConfig();
    cfg.assignedRoles = (cfg.assignedRoles || []).filter(
      (a: any) => !(a.email === email && a.plantId === plantId)
    );
    saveConfig(cfg);
    setAdmins(cfg.assignedRoles.map((r: any) => ({ ...r, plantId: r.plantId || "" })));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Super Admin – Manage Plants & Groups</h1>

      <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={addPlant}>
        ➕ Add Plant
      </button>

      <div className="mt-6">
        {plants.map((p) => (
          <div key={p.id} className="border p-3 my-2 rounded">
            <h2 className="font-bold">{p.name}</h2>
            <button className="bg-yellow-500 text-white px-3 py-1 mr-2" onClick={() => editPlant(p.id)}>
              ✏ Edit
            </button>
            <button className="bg-red-500 text-white px-3 py-1 mr-2" onClick={() => deletePlant(p.id)}>
              🗑 Delete
            </button>
            <button
              className="bg-blue-500 text-white px-3 py-1 mr-2"
              onClick={() => createGroup(`Plant_${p.id}_Users`)}
            >
              Create Group
            </button>
            <button
              className="bg-purple-500 text-white px-3 py-1"
              onClick={() => assignAdmin(p.id)}
            >
              Assign Admin
            </button>

            <div className="mt-2">
              <h3 className="font-semibold">Admins:</h3>
              <ul>
                {admins
                  .filter((a) => a.plantId === p.id)
                  .map((a) => (
                    <li key={a.email}>
                      {a.email}
                      <button
                        className="ml-2 bg-red-400 px-2 py-1 text-white"
                        onClick={() => removeAdmin(a.email, p.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-8">Existing SharePoint Groups</h2>
      <ul className="mt-2">
        {groups.map((g) => (
          <li key={g.Id}>
            {g.Title} (ID: {g.Id})
            <button
              className="ml-2 bg-red-500 text-white px-2 py-1"
              onClick={() => deleteGroup(g.Id)}
            >
              Delete Group
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
