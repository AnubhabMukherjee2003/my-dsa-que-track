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
  const { categoryIds } = await request.json();
  
  // Update the order of categories based on the new array order
  categoryIds.forEach((categoryId, index) => {
    const categoryIndex = db.data.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex !== -1) {
      db.data.categories[categoryIndex].order = index;
    }
  });
  
  await db.write();
  
  // Return the updated categories
  const updatedCategories = db.data.categories.sort((a, b) => a.order - b.order);
  
  return json(updatedCategories);
}