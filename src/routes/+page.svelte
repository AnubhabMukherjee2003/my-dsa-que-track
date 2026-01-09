<script>
	import { onMount } from 'svelte';
	import { Database } from '$lib/database.js';
	import { 
		categories, 
		subcategories, 
		questions, 
		stats,
		selectedCategory,
		selectedSubcategory,
		searchQuery,
		showCompleted,
		showPending,
		showCategoryModal,
		showSubcategoryModal,
		showQuestionModal,
		editingItem
	} from '$lib/stores.js';
	import CategoryModal from '$lib/components/CategoryModal.svelte';
	import SubcategoryModal from '$lib/components/SubcategoryModal.svelte';
	import QuestionModal from '$lib/components/QuestionModal.svelte';

	let filteredQuestions = $state([]);
	let searchInput = '';

	// Load data on mount
	onMount(async () => {
		await loadCategories();
		await loadStats();
	});

	async function loadCategories() {
		const cats = await Database.getCategories();
		categories.set(cats);
	}

	async function loadSubcategories(categoryId) {
		const subs = await Database.getSubcategories(categoryId);
		subcategories.set(subs);
	}

	async function loadQuestions(subcategoryId) {
		const qs = await Database.getQuestions(subcategoryId);
		questions.set(qs);
		// Remove the filterQuestions call since $effect handles filtering now
	}

	async function loadStats() {
		const s = await Database.getStats();
		stats.set(s);
	}

	// Category handlers
	async function selectCategory(category) {
		selectedCategory.set(category);
		selectedSubcategory.set(null);
		questions.set([]);
		await loadSubcategories(category.id);
	}

	async function selectSubcategory(subcategory) {
		selectedSubcategory.set(subcategory);
		await loadQuestions(subcategory.id);
	}

	// Modal handlers
	function openCategoryModal(category = null) {
		editingItem.set(category);
		showCategoryModal.set(true);
	}

	function openSubcategoryModal(subcategory = null) {
		editingItem.set(subcategory);
		showSubcategoryModal.set(true);
	}

	function openQuestionModal(question = null) {
		editingItem.set(question);
		showQuestionModal.set(true);
	}

	// CRUD operations
	async function saveCategory(name) {
		const editing = $editingItem;
		if (editing) {
			await Database.updateCategory(editing.id, { name });
		} else {
			await Database.createCategory(name);
		}
		await loadCategories();
		await loadStats();
		showCategoryModal.set(false);
		editingItem.set(null);
	}

	async function deleteCategory(id) {
		if (confirm('Delete this category and all its subcategories/questions?')) {
			await Database.deleteCategory(id);
			await loadCategories();
			await loadStats();
			selectedCategory.set(null);
			selectedSubcategory.set(null);
			subcategories.set([]);
			questions.set([]);
		}
	}

	async function saveSubcategory(name) {
		const editing = $editingItem;
		if (editing) {
			await Database.updateSubcategory(editing.id, { name });
		} else {
			await Database.createSubcategory($selectedCategory.id, name);
		}
		await loadSubcategories($selectedCategory.id);
		showSubcategoryModal.set(false);
		editingItem.set(null);
	}

	async function deleteSubcategory(id) {
		if (confirm('Delete this subcategory and all its questions?')) {
			await Database.deleteSubcategory(id);
			await loadSubcategories($selectedCategory.id);
			await loadStats();
			selectedSubcategory.set(null);
			questions.set([]);
		}
	}

	async function saveQuestion(data) {
		const editing = $editingItem;
		if (editing) {
			await Database.updateQuestion(editing.id, data);
		} else {
			await Database.createQuestion($selectedSubcategory.id, data.name, data.url, data.solution);
		}
		await loadQuestions($selectedSubcategory.id);
		await loadStats();
		showQuestionModal.set(false);
		editingItem.set(null);
	}

	async function deleteQuestion(id) {
		if (confirm('Delete this question?')) {
			await Database.deleteQuestion(id);
			await loadQuestions($selectedSubcategory.id);
			await loadStats();
		}
	}

	async function toggleQuestionDone(question) {
		await Database.updateQuestion(question.id, { isDone: !question.isDone });
		await loadQuestions($selectedSubcategory.id);
		await loadStats();
	}

	// Search and filter - combine into one effect that watches all dependencies
	$effect(() => {
		// Watch all dependencies: questions, searchInput, showCompleted, showPending
		const questionsToFilter = $questions;
		const search = searchInput;
		const showComp = $showCompleted;
		const showPend = $showPending;
		
		if (questionsToFilter.length > 0) {
			filteredQuestions = questionsToFilter.filter(q => {
				const matchesSearch = !search || 
					q.name.toLowerCase().includes(search.toLowerCase()) ||
					q.solution.toLowerCase().includes(search.toLowerCase());
				
				const matchesFilter = 
					(!showComp && !showPend) ? true : // Show all when both are unchecked
					((showComp && q.isDone) || (showPend && !q.isDone));
				
				return matchesSearch && matchesFilter;
			});
		} else {
			filteredQuestions = [];
		}
	});
</script>

<div class="app">
	<header class="header">
		<h1>DSA Tracker</h1>
		<p>Track your Data Structures & Algorithms practice progress</p>
	</header>

	<div class="container">
		<!-- Categories Sidebar -->
		<div class="sidebar">
			<div class="sidebar-header">
				<h3>Categories</h3>
				<button class="btn btn-primary" onclick={() => openCategoryModal()}>
					+ Add Category
				</button>
			</div>
			
			<div class="categories-list">
				{#each $categories as category}
					<div class="category-item" class:active={$selectedCategory?.id === category.id}>
						<div class="category-content" onclick={() => selectCategory(category)}>
							<span class="category-name">{category.name}</span>
							{#if $stats[category.id]}
								<div class="category-stats">
									<span class="stats-text">
										{$stats[category.id].done}/{$stats[category.id].total} 
										({$stats[category.id].percentage}%)
									</span>
									<div class="progress-bar">
										<div class="progress-fill" style="width: {$stats[category.id].percentage}%"></div>
									</div>
								</div>
							{/if}
						</div>
						<div class="category-actions">
							<button class="btn-icon" onclick={() => openCategoryModal(category)}>✏️</button>
							<button class="btn-icon" onclick={() => deleteCategory(category.id)}>🗑️</button>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Main Content -->
		<div class="main-content">
			{#if $selectedCategory}
				<!-- Subcategories -->
				<div class="section">
					<div class="section-header">
						<h3>Subcategories - {$selectedCategory.name}</h3>
						<button class="btn btn-primary" onclick={() => openSubcategoryModal()}>
							+ Add Subcategory
						</button>
					</div>
					
					<div class="subcategories-grid">
						{#each $subcategories as subcategory}
							<div class="subcategory-card" class:active={$selectedSubcategory?.id === subcategory.id}>
								<div class="card-content" onclick={() => selectSubcategory(subcategory)}>
									<h4>{subcategory.name}</h4>
								</div>
								<div class="card-actions">
									<button class="btn-icon" onclick={() => openSubcategoryModal(subcategory)}>✏️</button>
									<button class="btn-icon" onclick={() => deleteSubcategory(subcategory.id)}>🗑️</button>
								</div>
							</div>
						{/each}
					</div>
				</div>

				{#if $selectedSubcategory}
					<!-- Questions -->
					<div class="section">
						<div class="section-header">
							<h3>Questions - {$selectedSubcategory.name}</h3>
							<div class="header-controls">
								<div class="search-filters">
									<input 
										type="text" 
										placeholder="Search questions..." 
										class="form-control search-input"
										bind:value={searchInput}
									/>
									<label class="filter-checkbox">
										<input 
											type="checkbox" 
											checked={$showCompleted}
											onchange={(e) => showCompleted.set(e.target.checked)}
										/>
										Completed
									</label>
									<label class="filter-checkbox">
										<input 
											type="checkbox" 
											checked={$showPending}
											onchange={(e) => showPending.set(e.target.checked)}
										/>
										Pending
									</label>
								</div>
								<button class="btn btn-primary" onclick={() => openQuestionModal()}>
									+ Add Question
								</button>
							</div>
						</div>
						
						<div class="questions-list">
							{#each filteredQuestions as question}
								<div class="question-item" class:done={question.isDone}>
									<div class="question-checkbox">
										<input 
											type="checkbox" 
											checked={question.isDone}
											onchange={() => toggleQuestionDone(question)}
										/>
									</div>
									<div class="question-content">
										<h4 class="question-name">{question.name}</h4>
										{#if question.url}
											<a href={question.url} target="_blank" class="question-url">View Problem</a>
										{/if}
										{#if question.solution}
											<p class="question-solution">{question.solution}</p>
										{/if}
									</div>
									<div class="question-actions">
										<button class="btn-icon" onclick={() => openQuestionModal(question)}>✏️</button>
										<button class="btn-icon" onclick={() => deleteQuestion(question.id)}>🗑️</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{:else}
				<div class="empty-state">
					<h3>Welcome to DSA Tracker</h3>
					<p>Select a category from the sidebar to get started, or create your first category.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Modals -->
<CategoryModal onSave={saveCategory} />
<SubcategoryModal onSave={saveSubcategory} />
<QuestionModal onSave={saveQuestion} />

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background: white;
		padding: 20px;
		border-bottom: 1px solid #ddd;
		text-align: center;
	}

	.header h1 {
		margin: 0 0 8px 0;
		color: #007bff;
	}

	.header p {
		margin: 0;
		color: #666;
	}

	.container {
		flex: 1;
		display: flex;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	.sidebar {
		width: 300px;
		background: white;
		border-right: 1px solid #ddd;
		padding: 20px;
	}

	.sidebar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.sidebar-header h3 {
		margin: 0;
	}

	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.category-item {
		display: flex;
		align-items: center;
		padding: 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.category-item:hover {
		background-color: #f8f9fa;
	}

	.category-item.active {
		background-color: #e3f2fd;
		border-color: #007bff;
	}

	.category-content {
		flex: 1;
	}

	.category-name {
		font-weight: 500;
		display: block;
		margin-bottom: 4px;
	}

	.category-stats {
		font-size: 12px;
		color: #666;
	}

	.stats-text {
		display: block;
		margin-bottom: 4px;
	}

	.category-actions {
		display: flex;
		gap: 4px;
	}

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.btn-icon:hover {
		opacity: 1;
		background-color: #f8f9fa;
	}

	.main-content {
		flex: 1;
		padding: 20px;
		background: #f8f9fa;
	}

	.section {
		background: white;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.section-header h3 {
		margin: 0;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.search-filters {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.search-input {
		width: 200px;
	}

	.filter-checkbox {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		cursor: pointer;
	}

	.subcategories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 16px;
	}

	.subcategory-card {
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 16px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.subcategory-card:hover {
		background-color: #f8f9fa;
	}

	.subcategory-card.active {
		background-color: #e3f2fd;
		border-color: #007bff;
	}

	.card-content {
		flex: 1;
	}

	.card-content h4 {
		margin: 0;
		font-size: 16px;
	}

	.card-actions {
		display: flex;
		gap: 4px;
	}

	.questions-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.question-item {
		display: flex;
		align-items: flex-start;
		padding: 16px;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: #fafafa;
		transition: all 0.2s;
	}

	.question-item.done {
		background-color: #f0f8f0;
		border-color: #28a745;
	}

	.question-checkbox {
		margin-right: 12px;
		margin-top: 2px;
	}

	.question-content {
		flex: 1;
	}

	.question-name {
		margin: 0 0 8px 0;
		font-size: 16px;
	}

	.question-item.done .question-name {
		text-decoration: line-through;
		color: #666;
	}

	.question-url {
		color: #007bff;
		text-decoration: none;
		font-size: 14px;
		display: block;
		margin-bottom: 8px;
	}

	.question-url:hover {
		text-decoration: underline;
	}

	.question-solution {
		margin: 0;
		font-size: 14px;
		color: #666;
		line-height: 1.4;
	}

	.question-actions {
		display: flex;
		gap: 4px;
		margin-left: 12px;
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: #666;
	}

	.empty-state h3 {
		margin-bottom: 12px;
		color: #333;
	}

	@media (max-width: 768px) {
		.container {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
		}

		.search-filters {
			flex-direction: column;
			align-items: stretch;
		}

		.search-input {
			width: 100%;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-controls {
			justify-content: space-between;
		}
	}
</style>
