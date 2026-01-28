import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { json } from '@sveltejs/kit';

const adapter = new JSONFileSync('data/db.json');
const db = new Low(adapter, {});

const defaultData = {
  categories: [],
  subcategories: [],
  questions: []
};

async function initDB() {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

export async function PUT({ request }) {
  await initDB();
  const { categoryId, subcategoryIds } = await request.json();
  
  // Update the order of subcategories based on the new array order
  subcategoryIds.forEach((subcategoryId, index) => {
    const subcategoryIndex = db.data.subcategories.findIndex(s => s.id === subcategoryId);
    if (subcategoryIndex !== -1) {
      db.data.subcategories[subcategoryIndex].order = index;
    }
  });
  
  await db.write();
  
  // Return the updated subcategories for this category
  const updatedSubcategories = db.data.subcategories
    .filter(s => s.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);
  
  return json(updatedSubcategories);
}