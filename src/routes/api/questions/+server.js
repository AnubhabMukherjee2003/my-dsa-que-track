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
  const subcategoryId = url.searchParams.get('subcategoryId');
  
  let questions = db.data.questions;
  if (subcategoryId) {
    questions = questions.filter(q => q.subcategoryId === subcategoryId);
  }
  
  return json(questions.sort((a, b) => a.order - b.order));
}

export async function POST({ request }) {
  await initDB();
  const { subcategoryId, name, url, solution } = await request.json();
  
  const question = {
    id: uuidv4(),
    subcategoryId,
    name,
    url: url || '',
    solution: solution || '',
    isDone: false,
    order: db.data.questions.filter(q => q.subcategoryId === subcategoryId).length
  };
  
  db.data.questions.push(question);
  await db.write();
  
  return json(question);
}

export async function PUT({ request }) {
  await initDB();
  const { id, updates } = await request.json();
  
  const index = db.data.questions.findIndex(q => q.id === id);
  if (index !== -1) {
    db.data.questions[index] = { ...db.data.questions[index], ...updates };
    await db.write();
    return json(db.data.questions[index]);
  }
  
  return json({ error: 'Question not found' }, { status: 404 });
}

export async function DELETE({ request }) {
  await initDB();
  const { id } = await request.json();
  
  db.data.questions = db.data.questions.filter(q => q.id !== id);
  await db.write();
  
  return json({ success: true });
}