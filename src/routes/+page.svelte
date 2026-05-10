<script>
	// @ts-nocheck
	import { onMount } from "svelte";
	import { Database } from "$lib/database.js";
	import {
		categories,
		subcategories,
		questions,
		stats,
		selectedCategory,
		selectedSubcategory,
		showCompleted,
		showPending,
		showCategoryModal,
		showSubcategoryModal,
		showQuestionModal,
		editingItem,
	} from "$lib/stores.js";
	import CategoryModal from "$lib/components/CategoryModal.svelte";
	import SubcategoryModal from "$lib/components/SubcategoryModal.svelte";
	import QuestionModal from "$lib/components/QuestionModal.svelte";
	import Header from "$lib/components/Header.svelte";
	import Welcome from "$lib/components/Welcome.svelte";

	let filteredQuestions = $state([]);
	let searchInput = $state("");
	let draggedQuestion = $state(null);
	let dragOverIndex = $state(-1);
	let draggedCategory = $state(null);
	let draggedSubcategory = $state(null);
	let categoryDragOverIndex = $state(-1);
	let subcategoryDragOverIndex = $state(-1);
	let selectedCategoryId = $state(null);
	let selectedSubcategoryId = $state(null);
	let selectedSubcategoryName = $state("");

	$effect(() => {
		selectedCategoryId = $selectedCategory?.id ?? null;
		selectedSubcategoryId = $selectedSubcategory?.id ?? null;
		selectedSubcategoryName = $selectedSubcategory?.name ?? "";
	});

	function getCategoryStats(categoryId) {
		const allStats = /** @type {Record<string, { done: number; total: number; percentage: number }>} */ (
			$stats ?? {}
		);
		return allStats[categoryId] ?? null;
	}

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
		if (
			confirm("Delete this category and all its subcategories/questions?")
		) {
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
			await Database.createSubcategory($selectedCategory?.id, name);
		}
		await loadSubcategories($selectedCategory?.id);
		showSubcategoryModal.set(false);
		editingItem.set(null);
	}

	async function deleteSubcategory(id) {
		if (confirm("Delete this subcategory and all its questions?")) {
			await Database.deleteSubcategory(id);
			await loadSubcategories($selectedCategory?.id);
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
			await Database.createQuestion(
				$selectedSubcategory?.id,
				data.name,
				data.url,
				data.solution,
			);
		}
		await loadQuestions($selectedSubcategory?.id);
		await loadStats();
		showQuestionModal.set(false);
		editingItem.set(null);
	}

	async function deleteQuestion(id) {
		if (confirm("Delete this question?")) {
			await Database.deleteQuestion(id);
			await loadQuestions($selectedSubcategory?.id);
			await loadStats();
		}
	}

	async function toggleQuestionDone(question) {
		await Database.updateQuestion(question.id, {
			isDone: !question.isDone,
		});
		await loadQuestions($selectedSubcategory?.id);
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
			filteredQuestions = questionsToFilter.filter((q) => {
				const matchesSearch =
					!search ||
					q.name.toLowerCase().includes(search.toLowerCase()) ||
					q.solution.toLowerCase().includes(search.toLowerCase());

				const matchesFilter =
					!showComp && !showPend
						? true // Show all when both are unchecked
						: (showComp && q.isDone) || (showPend && !q.isDone);

				return matchesSearch && matchesFilter;
			});
		} else {
			filteredQuestions = [];
		}
	});

	// Drag and drop handlers for questions
	function handleDragStart(e, question, index) {
		draggedQuestion = question;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', e.target.outerHTML);
		e.target.style.opacity = '0.5';
	}

	function handleDragEnd(e) {
		e.target.style.opacity = '1';
		draggedQuestion = null;
		dragOverIndex = -1;
	}

	function handleDragOver(e, index) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = -1;
	}

	async function handleDrop(e, targetIndex) {
		e.preventDefault();
		
		if (!draggedQuestion) return;

		const draggedIndex = filteredQuestions.findIndex(q => q.id === draggedQuestion.id);
		
		if (draggedIndex === targetIndex) {
			dragOverIndex = -1;
			return;
		}

		// Create new array with reordered questions
		const newQuestions = [...filteredQuestions];
		const [draggedItem] = newQuestions.splice(draggedIndex, 1);
		newQuestions.splice(targetIndex, 0, draggedItem);

		// Update the order property for all questions
		const updatedQuestions = newQuestions.map((q, index) => ({
			...q,
			order: index
		}));

		// Update local state immediately for smooth UX
		filteredQuestions = updatedQuestions;
		questions.set(updatedQuestions);

		// Update database with new order
		try {
			const questionIds = updatedQuestions.map(q => q.id);
			await Database.updateQuestionOrder($selectedSubcategory?.id, questionIds);
			await loadStats(); // Refresh stats if needed
		} catch (error) {
			console.error('Failed to update question order:', error);
			// Revert on error
			await loadQuestions($selectedSubcategory?.id);
		}

		dragOverIndex = -1;
	}

	// Drag and drop handlers for categories
	function handleCategoryDragStart(e, category, index) {
		draggedCategory = category;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', e.target.outerHTML);
		e.target.style.opacity = '0.5';
	}

	function handleCategoryDragEnd(e) {
		e.target.style.opacity = '1';
		draggedCategory = null;
		categoryDragOverIndex = -1;
	}

	function handleCategoryDragOver(e, index) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		categoryDragOverIndex = index;
	}

	function handleCategoryDragLeave() {
		categoryDragOverIndex = -1;
	}

	async function handleCategoryDrop(e, targetIndex) {
		e.preventDefault();
		
		if (!draggedCategory) return;

		const draggedIndex = $categories.findIndex(c => c.id === draggedCategory.id);
		
		if (draggedIndex === targetIndex) {
			categoryDragOverIndex = -1;
			return;
		}

		// Create new array with reordered categories
		const newCategories = [...$categories];
		const [draggedItem] = newCategories.splice(draggedIndex, 1);
		newCategories.splice(targetIndex, 0, draggedItem);

		// Update the order property for all categories
		const updatedCategories = newCategories.map((c, index) => ({
			...c,
			order: index
		}));

		// Update local state immediately for smooth UX
		categories.set(updatedCategories);

		// Update database with new order
		try {
			const categoryIds = updatedCategories.map(c => c.id);
			await Database.updateCategoryOrder(categoryIds);
			await loadStats(); // Refresh stats if needed
		} catch (error) {
			console.error('Failed to update category order:', error);
			// Revert on error
			await loadCategories();
		}

		categoryDragOverIndex = -1;
	}

	// Drag and drop handlers for subcategories
	function handleSubcategoryDragStart(e, subcategory, index) {
		draggedSubcategory = subcategory;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', e.target.outerHTML);
		e.target.style.opacity = '0.5';
	}

	function handleSubcategoryDragEnd(e) {
		e.target.style.opacity = '1';
		draggedSubcategory = null;
		subcategoryDragOverIndex = -1;
	}

	function handleSubcategoryDragOver(e, index) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		subcategoryDragOverIndex = index;
	}

	function handleSubcategoryDragLeave() {
		subcategoryDragOverIndex = -1;
	}

	async function handleSubcategoryDrop(e, targetIndex) {
		e.preventDefault();
		
		if (!draggedSubcategory) return;

		const draggedIndex = $subcategories.findIndex(s => s.id === draggedSubcategory.id);
		
		if (draggedIndex === targetIndex) {
			subcategoryDragOverIndex = -1;
			return;
		}

		// Create new array with reordered subcategories
		const newSubcategories = [...$subcategories];
		const [draggedItem] = newSubcategories.splice(draggedIndex, 1);
		newSubcategories.splice(targetIndex, 0, draggedItem);

		// Update the order property for all subcategories
		const updatedSubcategories = newSubcategories.map((s, index) => ({
			...s,
			order: index
		}));

		// Update local state immediately for smooth UX
		subcategories.set(updatedSubcategories);

		// Update database with new order
		try {
			const subcategoryIds = updatedSubcategories.map(s => s.id);
			await Database.updateSubcategoryOrder($selectedCategory?.id, subcategoryIds);
			await loadStats(); // Refresh stats if needed
		} catch (error) {
			console.error('Failed to update subcategory order:', error);
			// Revert on error
			await loadSubcategories($selectedCategory?.id);
		}

		subcategoryDragOverIndex = -1;
	}
</script>

<div class="min-h-screen flex flex-col w-full p-[clamp(0.5rem,3vw,2rem)]">
	<!-- Header -->
	<Header />

	<!-- Main Content -->
	<main
		class="flex-1 border-subtle border-t-0 rounded-b-lg"
		style="flex-basis: 70%"
	>
		<div class="p-4 h-full flex flex-col lg:grid lg:grid-cols-[18rem_minmax(0,1fr)_18rem] gap-6 items-start">
			<!-- Left Column: Categories -->
			<aside
				class="w-full border-subtle rounded-lg p-6 h-fit lg:sticky lg:top-6"
			>
				<div class="mb-0">
					<div class="flex justify-between items-center mb-4 pb-3 border-b border-[#444]">
						<h3 class="text-lg font-semibold text-white">Categories</h3>
						<button class="btn-primary text-sm" onclick={() => openCategoryModal()}>
							+ Add
						</button>
					</div>

					<div class="space-y-2">
						{#each $categories as category, index}
							<div
								class="card-minimal group {selectedCategoryId === category.id ? 'card-active' : ''} {categoryDragOverIndex === index ? 'border-white border-2' : ''} cursor-move"
								draggable="true"
								ondragstart={(e) => handleCategoryDragStart(e, category, index)}
								ondragend={handleCategoryDragEnd}
								ondragover={(e) => handleCategoryDragOver(e, index)}
								ondragleave={handleCategoryDragLeave}
								ondrop={(e) => handleCategoryDrop(e, index)}
								onclick={() => selectCategory(category)}
								role="button"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCategory(category); } }}
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3 flex-1">
										<span class="text-muted cursor-grab active:cursor-grabbing">⋮⋮</span>
										<div class="flex-1">
											<span class="text-white font-medium block mb-2">{category.name}</span>
											{#if getCategoryStats(category.id)}
												<div class="text-xs text-muted mb-2 font-mono">
													{getCategoryStats(category.id).done}/{getCategoryStats(category.id).total}
													({getCategoryStats(category.id).percentage}%)
												</div>
												<div class="w-full bg-[#333] rounded-full h-1">
													<div class="bg-white h-1 rounded-full transition-all duration-300" style="width: {getCategoryStats(category.id).percentage}%"></div>
												</div>
											{/if}
										</div>
									</div>
									<div class="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
										<button class="text-muted hover:text-white p-1 rounded text-sm" onclick={(e) => { e.stopPropagation(); openCategoryModal(category); }}>✏️</button>
										<button class="text-muted hover:text-red-400 p-1 rounded text-sm" onclick={(e) => { e.stopPropagation(); deleteCategory(category.id); }}>🗑️</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</aside>

			<!-- Center Column: Questions -->
			<section class="flex-1 flex flex-col w-full">
				{#if $selectedSubcategory}
					<!-- Questions -->
					<div class="flex-1">
						<div
							class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-4 border-b border-[#444] gap-4"
						>
							<h3 class="text-2xl font-semibold text-white">
									Questions - {selectedSubcategoryName}
							</h3>
							<div
								class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
							>
								<div
									class="flex items-center gap-4 border-subtle rounded-lg px-4 py-2"
								>
									<input
										type="text"
										placeholder="Search questions..."
										class="input-field bg-transparent border-0 px-0 py-1 text-sm w-48"
										bind:value={searchInput}
									/>
									<label
										class="flex items-center gap-2 text-sm text-muted cursor-pointer"
									>
										<input
											type="checkbox"
											class="accent-white"
											checked={$showCompleted}
											onchange={(e) =>
												showCompleted.set(
													/** @type {HTMLInputElement} */ (e.currentTarget).checked,
												)}
										/>
										Completed
									</label>
									<label
										class="flex items-center gap-2 text-sm text-muted cursor-pointer"
									>
										<input
											type="checkbox"
											class="accent-white"
											checked={$showPending}
											onchange={(e) =>
												showPending.set(
													/** @type {HTMLInputElement} */ (e.currentTarget).checked,
												)}
										/>
										Pending
									</label>
								</div>
								<button
									class="btn-primary"
									onclick={() => openQuestionModal()}
								>
									+ Add Question
								</button>
							</div>
						</div>

						<div class="space-y-2">
							{#each filteredQuestions as question, index}
								<div
									class="card-minimal group {dragOverIndex === index ? 'border-white border-2' : ''} cursor-move"
									draggable="true"
									role="listitem"
									ondragstart={(e) => handleDragStart(e, question, index)}
									ondragend={handleDragEnd}
									ondragover={(e) => handleDragOver(e, index)}
									ondragleave={handleDragLeave}
									ondrop={(e) => handleDrop(e, index)}
								>
									<div class="flex items-start gap-4">
										<div class="flex items-center gap-3">
											<span class="text-muted cursor-grab active:cursor-grabbing">⋮⋮</span>
											<input
												type="checkbox"
												class="accent-white w-4 h-4"
												checked={question.isDone}
												onchange={() => toggleQuestionDone(question)}
											/>
											<span class="text-xs font-semibold text-muted uppercase tracking-wider font-mono">
												{question.isDone ? "✓" : "○"}
											</span>
										</div>
										<div class="flex-1">
											<h4
												class="text-white font-medium mb-2 link-hover {question.isDone
													? 'line-through opacity-70'
													: ''}"
											>
												{question.name}
											</h4>
											{#if question.url}
												<a
													href={question.url}
													target="_blank"
													class="text-muted hover:text-white text-sm inline-flex items-center gap-1 mb-2 link-hover"
												>
													View Problem ↗
												</a>
											{/if}
											{#if question.solution}
												<p
													class="text-muted text-sm bg-[#333]/30 rounded p-3 border-l-2 border-[#444] {question.isDone
														? 'opacity-50'
														: ''}"
												>
													{question.solution}
												</p>
											{/if}
										</div>
										<div
											class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<button
												class="text-muted hover:text-white p-1 rounded text-sm"
												onclick={() => openQuestionModal(question)}
											>✏️</button>
											<button
												class="text-muted hover:text-red-400 p-1 rounded text-sm"
												onclick={() => deleteQuestion(question.id)}
											>🗑️</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<Welcome onCreateCategory={() => openCategoryModal()} />
				{/if}
			</section>

			<!-- Right Column: Subcategories -->
			{#if $selectedCategory}
				<aside class="w-full border-subtle rounded-lg p-6 h-fit lg:sticky lg:top-6">
					<div class="flex justify-between items-center mb-4 pb-3 border-b border-[#444]">
						<h3 class="text-lg font-semibold text-white">Subcategories</h3>
						<button class="btn-primary text-sm" onclick={() => openSubcategoryModal()}>
							+ Add
						</button>
					</div>

					<div class="space-y-2">
						{#each $subcategories as subcategory, index}
							<div
								class="card-minimal group {selectedSubcategoryId === subcategory.id ? 'card-active' : ''} {subcategoryDragOverIndex === index ? 'border-white border-2' : ''} cursor-move"
								draggable="true"
								ondragstart={(e) => handleSubcategoryDragStart(e, subcategory, index)}
								ondragend={handleSubcategoryDragEnd}
								ondragover={(e) => handleSubcategoryDragOver(e, index)}
								ondragleave={handleSubcategoryDragLeave}
								ondrop={(e) => handleSubcategoryDrop(e, index)}
								onclick={() => selectSubcategory(subcategory)}
								role="button"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSubcategory(subcategory); } }}
							>
								<div class="flex justify-between items-center">
									<div class="flex items-center gap-3 flex-1">
										<span class="text-muted cursor-grab active:cursor-grabbing">⋮⋮</span>
										<h4 class="text-white font-medium link-hover">{subcategory.name}</h4>
									</div>
									<div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<button class="text-muted hover:text-white p-1 rounded text-sm" onclick={(e) => { e.stopPropagation(); openSubcategoryModal(subcategory); }}>✏️</button>
										<button class="text-muted hover:text-red-400 p-1 rounded text-sm" onclick={(e) => { e.stopPropagation(); deleteSubcategory(subcategory.id); }}>🗑️</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</aside>
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<!-- <footer
		class="border-subtle flex-none mt-8 py-4 text-center text-xs text-muted rounded-b-lg"
		style="flex-basis: 10%"
	>
		<p>
			© {new Date().getFullYear()} DSA Tracker. Built with SvelteKit & Tailwind
			CSS.
		</p>
	</footer> -->
</div>

<!-- Modals -->
<CategoryModal onSave={saveCategory} />
<SubcategoryModal onSave={saveSubcategory} />
<QuestionModal onSave={saveQuestion} />
