import { useMsal } from "@azure/msal-react";
import axios from "axios";
import { useState, useEffect } from "react";
import { getAccessToken } from "../auth/getToken";

const CarlinesList: React.FC<{ listId: string; siteId: string }> = ({ listId, siteId }) => {
  const [carlines, setCarlines] = useState<string[]>([]);
  const { instance } = useMsal();

  useEffect(() => {
    const fetchCarlines = async () => {
      try {
        const token = await getAccessToken(instance, [
          "https://graph.microsoft.com/Sites.Read.All",
        ]);
        
        if (!token) throw new Error("No token");

        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields($select=Carline)`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const carlineData: string[] = response.data.value
          .map((item: any) => String(item.fields?.Carline ?? "").trim())
          .filter((carline: string) => carline.length > 0);

        // Deduplicate and sort
        const uniqueCarlines: string[] = [...new Set(carlineData)].sort();

        setCarlines(uniqueCarlines);
      } catch (error) {
        console.error("Error fetching carlines:", error);
      }
    };

    if (listId) {
      fetchCarlines();
    }
  }, [listId, siteId, instance]);

  return (
    <div className="grid grid-cols-2 gap-2">
      {carlines.map((carline, index) => (
        <div key={index} className="text-sm bg-white/5 p-1 rounded">
          {carline}
        </div>
      ))}
    </div>
  );
};

export default CarlinesList;
