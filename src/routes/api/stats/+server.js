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

export async function GET() {
  await initDB();
  const stats = {};
  
  for (const category of db.data.categories) {
    const subcategories = db.data.subcategories.filter(s => s.categoryId === category.id);
    const subcategoryIds = subcategories.map(s => s.id);
    const questions = db.data.questions.filter(q => subcategoryIds.includes(q.subcategoryId));
    const doneQuestions = questions.filter(q => q.isDone);
    
    stats[category.id] = {
      total: questions.length,
      done: doneQuestions.length,
      percentage: questions.length > 0 ? Math.round((doneQuestions.length / questions.length) * 100) : 0
    };
  }
  
  return json(stats);
}