import React, { useEffect, useState } from "react";
import { AreaImage } from "../pages/types";
import { db } from "../pages/db";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
}

const AREAS = ["MR", "Innenraum", "Autarke", "Cockpit"];

interface Props {
  projects: IProject[];
}

const AreaImageUploadComponent: React.FC<Props> = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [areaFiles, setAreaFiles] = useState<{ [area: string]: File | null }>({});
  const [areaNames, setAreaNames] = useState<{ [area: string]: string }>({});
  const [areaImages, setAreaImages] = useState<AreaImage[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [editImageId, setEditImageId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");

  // Load saved area images
  useEffect(() => {
    const load = async () => {
      const images = await db.areaImages.toArray();
      setAreaImages(images);
    };
    load();
  }, []);

  // Handle file selection
  const handleFileChange = (area: string, file: File | null) => {
    setAreaFiles(prev => ({ ...prev, [area]: file }));
  };

  const handleNameChange = (area: string, value: string) => {
    setAreaNames(prev => ({ ...prev, [area]: value }));
  };

  // Upload selected images
  const handleUpload = async () => {
    if (!selectedProject) {
      setMessage("Please select a project.");
      return;
    }
    const uploadAreas = AREAS.filter(area => areaFiles[area]);
    if (uploadAreas.length === 0) {
      setMessage("Please select at least one area image to upload.");
      return;
    }
    try {
      await Promise.all(
        uploadAreas.map(area => {
          const file = areaFiles[area];
          if (!file) return null;
          return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                await db.areaImages.add({
                  projectId: selectedProject,
                  area,
                  imageData: reader.result as string,
                  createdAt: new Date().toISOString(),
                  name: areaNames[area] || "", // store name if you want
                });
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            reader.readAsDataURL(file);
          });
        })
      );
      setMessage("Images uploaded successfully!");
      setAreaFiles({});
      setAreaNames({});
      setSelectedProject("");
      // reload images
      const images = await db.areaImages.toArray();
      setAreaImages(images);
    } catch (err) {
      setMessage("Error uploading area images.");
    }
  };

  // Delete an image
  const handleDelete = async (id?: number) => {
    if (!id) return;
    await db.areaImages.delete(id);
    setAreaImages(await db.areaImages.toArray());
  };

  // Start editing a name
  const handleEdit = (image: AreaImage) => {
    setEditImageId(image.id!);
    setEditName(image.name || "");
  };

  // Save edited name
  const handleSaveEdit = async () => {
    if (!editImageId) return;
    await db.areaImages.update(editImageId, { name: editName });
    setEditImageId(null);
    setEditName("");
    setAreaImages(await db.areaImages.toArray());
  };

  // Get project info
  const getProject = (pid: string) => projects.find(p => p.id === pid);

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <div>
        <label className="block text-lg mb-2">Select Project</label>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="w-full p-2 rounded bg-white/80 text-gray-900"
        >
          <option value="">-- Select a Project --</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.displayName}
            </option>
          ))}
        </select>
      </div>
      {/* Area Uploads */}
      {selectedProject && (
        <div className="space-y-4">
          {AREAS.map(area => (
            <div key={area} className="flex flex-col md:flex-row items-center gap-4">
              <label className="w-32">{area}:</label>
              <input
                type="text"
                placeholder="Image name (optional)"
                value={areaNames[area] || ""}
                onChange={e => handleNameChange(area, e.target.value)}
                className="w-48 p-2 rounded bg-white/80 text-gray-900"
              />
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileChange(area, e.target.files ? e.target.files[0] : null)}
                className="w-full"
              />
            </div>
          ))}
          <button
            onClick={handleUpload}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Upload Selected Images
          </button>
        </div>
      )}
      {/* Saved Area Images */}
      <div className="mt-6">
        <h3 className="text-xl font-medium mb-4">Saved Area Images</h3>
        {areaImages.length === 0 ? (
          <p>No area images saved yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {areaImages.map(img => {
              const project = getProject(img.projectId);
              return (
                <div key={img.id} className="bg-white/20 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    {project && (
                      <div className="flex items-center gap-2">
                        {project.logo && (
                          <img
                            src={project.logo}
                            alt={project.displayName}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <span>{project.displayName}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <img
                    src={img.imageData}
                    alt={img.name || img.area}
                    className="w-full h-40 object-contain bg-white/10 rounded"
                  />
                  {/* Image name */}
                  {editImageId === img.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 p-2 rounded bg-white/80 text-gray-900"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{img.name || img.area}</p>
                      <button
                        onClick={() => handleEdit(img)}
                        className="text-sm text-blue-300 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {/* Display area */}
                  <p className="text-sm text-center text-white/90">
                    Area: {img.area}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Message Display */}
      {message && (
        <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default AreaImageUploadComponent;
