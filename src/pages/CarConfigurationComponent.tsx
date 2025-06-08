import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import axios from 'axios';
import { db } from './db';
import { getAccessToken } from '../auth/getToken';
import { CarImage } from './types';

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
  siteId: string| null;
}

const CarConfigurationComponent: React.FC<CarConfigProps> = ({ 
  projects, 
  siteId 
}) => {
  const { instance } = useMsal();
  
  // State Management
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [carName, setCarName] = useState<string>("");
  const [carFile, setCarFile] = useState<File | null>(null);
  const [carlines, setCarlines] = useState<string[]>([]);
  const [carList, setCarList] = useState<CarImage[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch Carlines when Project is Selected
   // Fetch Carline values when project is selected
  useEffect(() => {
    const fetchCarlineValues = async () => {
      if (!siteId || !selectedProject) return;

      const project = projects.find((p) => p.id === selectedProject);
      if (!project?.mapping?.feasibility) return;

      try {
        const token = await getAccessToken(instance, [
          "https://graph.microsoft.com/Sites.Read.All",
        ]);
        if (!token) throw new Error("No token");

        const listId = project.mapping.feasibility;
        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields($select=Carline)`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("API Response:", response.data); // Log the full response

        const carlineData: string[] = response.data.value
          .map((item: any) => String(item.fields?.Carline ?? "").trim())
          .filter((carline: string) => carline.length > 0);

        const uniqueCarlines: string[] = [...new Set(carlineData)].sort();

setCarlines(uniqueCarlines);
      } catch (error) {
        setMessage("Error fetching carlines");
      }
    };

    fetchCarlineValues();
  }, [siteId, selectedProject, projects, instance]);

  // Image Upload Handler
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
          name: carName || `Car_${Date.now()}`,
          data: imageData,
          projectId: selectedProject,
          createdAt: new Date().toISOString(),
        });

        // Reset form
        setCarName("");
        setCarFile(null);
        setSelectedProject("");
        
        // Refresh car list
        const updatedCars = await db.carImages.toArray();
        setCarList(updatedCars);
        
        setMessage("Car image uploaded successfully!");
      } catch (error) {
        setMessage("Error uploading car image");
      }
    };

    reader.readAsDataURL(carFile);
  };

  // Delete Car Image
  const handleDeleteCar = async (id?: number) => {
    if (!id) return;
    
    try {
      await db.carImages.delete(id);
      const updatedCars = await db.carImages.toArray();
      setCarList(updatedCars);
      setMessage("Car image deleted successfully!");
    } catch (error) {
      setMessage("Error deleting car image");
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <div>
        <label className="block text-lg mb-2">Select Project</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
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
          
          <button
            onClick={handleImageUpload}
            disabled={!carFile}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            Upload Car Image
          </button>
        </div>
      )}

      {/* Carlines Display */}
      {carlines.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Available Carlines</h3>
          <div className="grid grid-cols-3 gap-2">
            {carlines.map((carline, index) => (
              <div 
                key={index} 
                className="bg-white/10 p-2 rounded text-sm text-center"
              >
                {carline}
              </div>
            ))}
          </div>
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
              const associatedProject = projects.find(p => p.id === car.projectId);
              
              return (
                <div 
                  key={car.id} 
                  className="bg-white/20 p-4 rounded-lg space-y-3"
                >
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
                    alt={car.name}
                    className="w-full h-40 object-contain bg-white/10 rounded"
                  />
                  
                  {car.name && (
                    <p className="text-center font-medium">{car.name}</p>
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
