import React, { useState, useEffect } from "react";
import ProjectCarousel from "../ProjectCarousel";

interface FollowUpCostInputProps {
  siteId: string;
  listId: string;
}

interface FollowUpForm {
  project: string;
  area: string;
  followUpCost: number;
  initiationReason: string;
  bucketId: string;
  entryDate: string;
  bucketResponsible: string;
  postName: string;
}

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
}

const LISTS_CONFIG_KEY = "cmConfigLists";

const FollowUpCostInput: React.FC<FollowUpCostInputProps> = ({ siteId, listId }) => {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [form, setForm] = useState<FollowUpForm>({
    project: "",
    area: "Innenraum",
    followUpCost: 0,
    initiationReason: "demande suite à un changement technique (aeb)",
    bucketId: "",
    entryDate: new Date().toISOString().slice(0, 10),
    bucketResponsible: "",
    postName: "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (Array.isArray(config.projects)) {
          setProjects(config.projects);
          // Set the first project as the default selected project
          if (config.projects.length > 0) {
            setForm((f) => ({ ...f, project: config.projects[0].id }));
          }
        }
      } catch (err) {
        console.error("Error parsing projects from localStorage:", err);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you can handle the form submission logic as needed
    console.log("Form submitted:", form);
    setMsg("Enregistrement réussi !");
  };

  return (
    <div>
      {/* Project Carousel for Project Selection */}
      {projects.length > 0 ? (
        <ProjectCarousel
          projects={projects} // Pass the projects loaded from localStorage
          selectedProject={form.project} // Use the project from the form state
          onProjectSelect={(projectId) => {
            setForm((f) => ({ ...f, project: projectId })); // Update the form with the selected project
          }}
        />
      ) : (
        <p className="text-center text-gray-500">
          No projects found. Please add some in the Config Page first!
        </p>
      )}

      {/* Follow-Up Cost Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {msg && <div className="text-sm text-green-700">{msg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">Zone</label>
            <select
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option>Innenraum</option>
              <option>Autarke</option>
              <option>Cockpit</option>
              <option>Motorblick</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block">Coût suivi / Budget PA (€)</label>
          <input
            type="number"
            value={form.followUpCost}
            onChange={(e) =>
              setForm((f) => ({ ...f, followUpCost: +e.target.value }))
            }
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block">Raison de l’initiation</label>
          <select
            value={form.initiationReason}
            onChange={(e) =>
              setForm((f) => ({ ...f, initiationReason: e.target.value }))
            }
            className="w-full p-2 border rounded"
          >
            <option>demande suite à un changement technique (aeb)</option>
            <option>demande suite une optimisation</option>
            <option>demande suite mail/réunion d'analyse de réclamation</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block">Identifiant Panier</label>
            <input
              type="text"
              value={form.bucketId}
              onChange={(e) =>
                setForm((f) => ({ ...f, bucketId: e.target.value }))
              }
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Date</label>
            <input
              type="date"
              value={form.entryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, entryDate: e.target.value }))
              }
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Responsable du Panier</label>
            <input
              type="text"
              value={form.bucketResponsible}
              onChange={(e) =>
                setForm((f) => ({ ...f, bucketResponsible: e.target.value }))
              }
              required
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block">Poste / Identifiant</label>
          <input
            type="text"
            value={form.postName}
            onChange={(e) =>
              setForm((f) => ({ ...f, postName: e.target.value }))
            }
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
};

export default FollowUpCostInput;
