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
  const { subcategoryId, questionIds } = await request.json();
  
  // Update the order of questions based on the new array order
  questionIds.forEach((questionId, index) => {
    const questionIndex = db.data.questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      db.data.questions[questionIndex].order = index;
    }
  });
  
  await db.write();
  
  // Return the updated questions for this subcategory
  const updatedQuestions = db.data.questions
    .filter(q => q.subcategoryId === subcategoryId)
    .sort((a, b) => a.order - b.order);
  
  return json(updatedQuestions);
}