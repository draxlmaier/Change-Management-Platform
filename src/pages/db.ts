import Dexie, { Table } from 'dexie';
import { CarImage } from './types';
import { AreaImage } from './types'; // <-- Import AreaImage

class AppDatabase extends Dexie {
  carImages!: Table<CarImage, number>;
  areaImages!: Table<AreaImage, number>; // <-- Add this

  constructor() {
    super('CarImageDB');
    this.version(2).stores({ // bump version to 2 for schema change
      carImages: '++id,name,data,createdAt',
      areaImages: '++id,projectId,area,imageData,createdAt', // <-- new table
    });
  }
}

export const db = new AppDatabase();
