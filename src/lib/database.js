// Database operations using API endpoints
export class Database {
  static async init() {
    // Initialize database through API
    await fetch('/api/categories');
  }

  // Categories
  static async getCategories() {
    const response = await fetch('/api/categories');
    return await response.json();
  }

  static async createCategory(name) {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return await response.json();
  }

  static async updateCategory(id, updates) {
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    return await response.json();
  }

  static async deleteCategory(id) {
    const response = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await response.json();
  }

  // Subcategories
  static async getSubcategories(categoryId = null) {
    const url = categoryId ? `/api/subcategories?categoryId=${categoryId}` : '/api/subcategories';
    const response = await fetch(url);
    return await response.json();
  }

  static async createSubcategory(categoryId, name) {
    const response = await fetch('/api/subcategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, name })
    });
    return await response.json();
  }

  static async updateSubcategory(id, updates) {
    const response = await fetch('/api/subcategories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    return await response.json();
  }

  static async deleteSubcategory(id) {
    const response = await fetch('/api/subcategories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await response.json();
  }

  // Questions
  static async getQuestions(subcategoryId = null) {
    const url = subcategoryId ? `/api/questions?subcategoryId=${subcategoryId}` : '/api/questions';
    const response = await fetch(url);
    return await response.json();
  }

  static async createQuestion(subcategoryId, name, url = '', solution = '') {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subcategoryId, name, url, solution })
    });
    return await response.json();
  }

  static async updateQuestion(id, updates) {
    const response = await fetch('/api/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    return await response.json();
  }

  static async updateQuestionOrder(subcategoryId, questionIds) {
    const response = await fetch('/api/questions/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subcategoryId, questionIds })
    });
    return await response.json();
  }

  static async deleteQuestion(id) {
    const response = await fetch('/api/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await response.json();
  }

  // Utility methods
  static async getStats() {
    const response = await fetch('/api/stats');
    return await response.json();
  }

  static async searchQuestions(query) {
    const response = await fetch('/api/questions');
    const questions = await response.json();
    const lowerQuery = query.toLowerCase();
    return questions.filter(q => 
      q.name.toLowerCase().includes(lowerQuery) ||
      q.solution.toLowerCase().includes(lowerQuery)
    );
  }
}