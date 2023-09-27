import { Database } from 'bun:sqlite';

export const db = new Database(':memory:');
const initalizeDatabase = () => {
  const table = db.query('CREATE TABLE spotify (id INTEGER PRIMARY KEY, access_key TEXT);');
  table.run();
};
initalizeDatabase();
