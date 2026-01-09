import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';

// Database adapter for server-side file operations
const adapter = new JSONFileSync('data/db.json');
const db = new Low(adapter, {});

// Initialize database with default data
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

export async function GET() {
  await initDB();
  const categories = db.data.categories.sort((a, b) => a.order - b.order);
  return json(categories);
}

export async function POST({ request }) {
  await initDB();
  const { name } = await request.json();
  
  const category = {
    id: uuidv4(),
    name,
    order: db.data.categories.length
  };
  
  db.data.categories.push(category);
  await db.write();
  
  return json(category);
}

export async function PUT({ request }) {
  await initDB();
  const { id, updates } = await request.json();
  
  const index = db.data.categories.findIndex(c => c.id === id);
  if (index !== -1) {
    db.data.categories[index] = { ...db.data.categories[index], ...updates };
    await db.write();
    return json(db.data.categories[index]);
  }
  
  return json({ error: 'Category not found' }, { status: 404 });
}

export async function DELETE({ request }) {
  await initDB();
  const { id } = await request.json();
  
  // Delete related subcategories and questions
  const subcategoryIds = db.data.subcategories
    .filter(s => s.categoryId === id)
    .map(s => s.id);
  
  db.data.questions = db.data.questions.filter(q => 
    !subcategoryIds.includes(q.subcategoryId)
  );
  db.data.subcategories = db.data.subcategories.filter(s => s.categoryId !== id);
  db.data.categories = db.data.categories.filter(c => c.id !== id);
  await db.write();
  
  return json({ success: true });
}