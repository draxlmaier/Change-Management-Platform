// types.ts
export interface CarImage {
  id?: number;
  name: string;
  data: string;
  carline?: string;
  projectId: string;
  createdAt: string;
}
export interface AreaImage {
  id?: number;
  projectId: string;
  area: string;
  imageData: string;
  createdAt: string;
  name?: string; // <-- add this line
}

