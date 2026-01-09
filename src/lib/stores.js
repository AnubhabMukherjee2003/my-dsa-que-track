import { writable } from 'svelte/store';

// Application state stores
export const categories = writable([]);
export const subcategories = writable([]);
export const questions = writable([]);
export const stats = writable({});

// UI state stores
export const selectedCategory = writable(null);
export const selectedSubcategory = writable(null);
export const searchQuery = writable('');
export const showCompleted = writable(false);
export const showPending = writable(false);

// Modal states
export const showCategoryModal = writable(false);
export const showSubcategoryModal = writable(false);
export const showQuestionModal = writable(false);
export const editingItem = writable(null);