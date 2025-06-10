import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "./db";
import { getAccessToken } from "../auth/getToken";
import { CarImage } from "./types";
import { msalInstance } from "../auth/msalInstance";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    feasibility: string;
    implementation: string;
    feasibilityExtra?: string;
    implementationExtra?: string;
  };
}

interface CarConfigProps {
  projects: IProject[];
  siteId: string | null;
}

// Helper to parse the Carline substring out of "Parameters: ..."
function extractCarline(parameters: string): string {
  // e.g. "OEM: Mercedes | Carline: MBM282, MBM256 | Start..."
  const match = parameters.match(/Carline:\s*([^|]+)/i);
  return match ? match[1].trim() : "";
}

const CarConfigurationComponent: React.FC<CarConfigProps> = ({ projects, siteId }) => {
  // State
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [carName, setCarName] = useState<string>("");
  const [carFile, setCarFile] = useState<File | null>(null);
  const [carlines, setCarlines] = useState<string[]>([]);
  const [chosenCarline, setChosenCarline] = useState<string>("");
  const [carList, setCarList] = useState<CarImage[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Load existing CarImages from DB (e.g. on mount)
  useEffect(() => {
    const loadCarList = async () => {
      const allCars = await db.carImages.toArray();
      setCarList(allCars);
    };
    loadCarList();
  }, []);

  // Fetch items from Feasibility list => parse "Carline:" from "Parameters"
  useEffect(() => {
    const fetchCarlineValues = async () => {
      if (!siteId || !selectedProject) return;

      const project = projects.find((p) => p.id === selectedProject);
      if (!project?.mapping?.feasibility) return;

      try {

        const account = msalInstance.getActiveAccount();
          if (!account) {
            throw new Error("User not authenticated. Please log in first.");
          }
          
        const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);

        if (!token) throw new Error("No token available");

        const listId = project.mapping.feasibility;

        // Call Graph API to get "Parameters" from feasibility items
        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields($select=Parameters)`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // For each item => parse out "Carline: ...", if present
        const data: string[] = response.data.value
          .map((item: any) => {
            const rawParams = String(item.fields?.Parameters ?? "").trim();
            return extractCarline(rawParams);
          })
          .filter((c: string) => c.length > 0);

        // Deduplicate & sort
        const uniqueCarlines = Array.from(new Set(data)).sort();
        setCarlines(uniqueCarlines);
      } catch (error) {
        setMessage("Error fetching carlines");
        console.error("API error:", error);
      }
    };

    fetchCarlineValues();
  }, [siteId, selectedProject, projects]);

  // Upload image handler, storing chosen carline in Dexie as well
  const handleImageUpload = async () => {
    if (!selectedProject || !carFile) {
      setMessage("Please select a project and upload an image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const imageData = reader.result as string;

        await db.carImages.add({
          name: carName || "",
          data: imageData,
          projectId: selectedProject,
          createdAt: new Date().toISOString(),
          carline: chosenCarline, // store selected Carline
        });

        // Reset form
        setCarName("");
        setCarFile(null);
        setSelectedProject("");
        setChosenCarline("");

        // Refresh list
        const updatedCars = await db.carImages.toArray();
        setCarList(updatedCars);

        setMessage("Car image uploaded successfully!");
      } catch (error) {
        setMessage("Error uploading car image");
        console.error(error);
      }
    };

    reader.readAsDataURL(carFile);
  };

  // Delete a car from Dexie
  const handleDeleteCar = async (id?: number) => {
    if (!id) return;
    try {
      await db.carImages.delete(id);
      const updatedCars = await db.carImages.toArray();
      setCarList(updatedCars);
      setMessage("Car image deleted successfully!");
    } catch (error) {
      setMessage("Error deleting car image");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <div>
        <label className="block text-lg mb-2">Select Project</label>
        <select
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            setCarlines([]);     // reset carline list
            setChosenCarline("");          
          }}
          className="w-full p-2 rounded bg-white/80 text-gray-900"
        >
          <option value="">-- Select a Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Car Upload Section */}
      {selectedProject && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Car Name (Optional)"
            value={carName}
            onChange={(e) => setCarName(e.target.value)}
            className="w-full p-2 rounded bg-white/80 text-gray-900"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) setCarFile(e.target.files[0]);
            }}
            className="w-full"
          />

          {/* If you want the user to pick a single Carline out of the list */}
          {carlines.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Available Carlines</h3>
              <select
                value={chosenCarline}
                onChange={(e) => setChosenCarline(e.target.value)}
                className="w-full p-2 rounded bg-white/80 text-gray-900"
              >
                <option value="">-- Select a Carline --</option>
                {carlines.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleImageUpload}
            disabled={!carFile}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            Upload Car Image
          </button>
        </div>
      )}

      {/* Saved Cars Display */}
      <div className="mt-6">
        <h3 className="text-xl font-medium mb-4">Saved Cars</h3>
        {carList.length === 0 ? (
          <p>No car images saved yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {carList.map((car) => {
              const associatedProject = projects.find((p) => p.id === car.projectId);
              return (
                <div key={car.id} className="bg-white/20 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    {associatedProject && (
                      <div className="flex items-center gap-2">
                        <img
                          src={associatedProject.logo}
                          alt={associatedProject.displayName}
                          className="w-8 h-8 object-contain"
                        />
                        <span>{associatedProject.displayName}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  <img
                    src={car.data}
                    alt={car.name || "Car"}
                    className="w-full h-40 object-contain bg-white/10 rounded"
                  />

                  {/* Car name */}
                  {car.name && <p className="text-center font-medium">{car.name}</p>}

                  {/* Display whichever Carline was stored */}
                  {car.carline && (
                    <p className="text-sm text-center text-white/90">
                      Carline: {car.carline}
                    </p>
                  )}
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

export default CarConfigurationComponent;
