import React, { useState, useEffect } from 'react';
import ProjectCarousel from '../ProjectCarousel';

interface MonthlyKPIInputProps {
  siteId: string;
  listId: string;
}

interface MonthlyForm {
  project: string;
  month: string;
  drxIdea: number;
  budgetDepartment: number;
  unplannedDowntime: number;
}

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
}

const LISTS_CONFIG_KEY = "cmConfigLists";

const MonthlyKPIInput: React.FC<MonthlyKPIInputProps> = ({ siteId, listId }) => {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [form, setForm] = useState<MonthlyForm>({
    project: '',
    month: new Date().toISOString().slice(0, 7),
    drxIdea: 0,
    budgetDepartment: 0,
    unplannedDowntime: 0,
  });
  const [msg, setMsg] = useState<string | null>(null);

  // Load projects from local storage on mount
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
    console.log('Form submitted:', form);
    setMsg('Enregistrement réussi !');
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

      {/* KPI Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {msg && <div className="text-sm text-green-700">{msg}</div>}

        <div>
          <label className="block mb-2">Mois</label>
          <input
            type="month"
            value={form.month}
            onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block">DRX Idea</label>
          <input
            type="number"
            value={form.drxIdea}
            onChange={(e) => setForm((f) => ({ ...f, drxIdea: +e.target.value }))}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block">Budget Department</label>
          <input
            type="number"
            value={form.budgetDepartment}
            onChange={(e) =>
              setForm((f) => ({ ...f, budgetDepartment: +e.target.value }))
            }
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block">Unplanned Downtime</label>
          <input
            type="number"
            value={form.unplannedDowntime}
            onChange={(e) =>
              setForm((f) => ({ ...f, unplannedDowntime: +e.target.value }))
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

export default MonthlyKPIInput;
