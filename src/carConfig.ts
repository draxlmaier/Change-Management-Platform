// src/config/carConfig.ts

export const CARS_CONFIG_KEY = "cmConfigCars";

export interface CarsConfig {
  carImages: string[];
}

export const loadCarConfig = (): CarsConfig => {
  const raw = localStorage.getItem(CARS_CONFIG_KEY);
  if (!raw) return { carImages: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { carImages: [] };
  }
};

export const saveCarConfig = (cfg: CarsConfig) => {
  const filtered = cfg.carImages.filter(
    (img) => typeof img === "string" && img.startsWith("data:image/")
  );
  localStorage.setItem(CARS_CONFIG_KEY, JSON.stringify({ carImages: filtered }));
};
