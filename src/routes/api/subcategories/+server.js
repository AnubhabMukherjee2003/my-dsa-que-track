import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
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

export async function GET({ url }) {
  await initDB();
  const categoryId = url.searchParams.get('categoryId');
  
  let subcategories = db.data.subcategories;
  if (categoryId) {
    subcategories = subcategories.filter(s => s.categoryId === categoryId);
  }
  
  return json(subcategories.sort((a, b) => a.order - b.order));
}

export async function POST({ request }) {
  await initDB();
  const { categoryId, name } = await request.json();
  
  const subcategory = {
    id: uuidv4(),
    categoryId,
    name,
    order: db.data.subcategories.filter(s => s.categoryId === categoryId).length
  };
  
  db.data.subcategories.push(subcategory);
  await db.write();
  
  return json(subcategory);
}

export async function PUT({ request }) {
  await initDB();
  const { id, updates } = await request.json();
  
  const index = db.data.subcategories.findIndex(s => s.id === id);
  if (index !== -1) {
    db.data.subcategories[index] = { ...db.data.subcategories[index], ...updates };
    await db.write();
    return json(db.data.subcategories[index]);
  }
  
  return json({ error: 'Subcategory not found' }, { status: 404 });
}

export async function DELETE({ request }) {
  await initDB();
  const { id } = await request.json();
  
  // Delete related questions
  db.data.questions = db.data.questions.filter(q => q.subcategoryId !== id);
  db.data.subcategories = db.data.subcategories.filter(s => s.id !== id);
  await db.write();
  
  return json({ success: true });
}