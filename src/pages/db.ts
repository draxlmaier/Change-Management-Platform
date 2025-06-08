import Dexie, { Table } from 'dexie';
import { CarImage } from './types';

class AppDatabase extends Dexie {
  carImages!: Table<CarImage, number>;

  constructor() {
    super('CarImageDB');
    this.version(1).stores({
      carImages: '++id,name,data,createdAt',
    });
  }
}

export const db = new AppDatabase();
