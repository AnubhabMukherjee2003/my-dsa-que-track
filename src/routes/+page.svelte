<script>
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
</script>

<div class="min-h-screen flex flex-col w-full p-[clamp(0.5rem,3vw,2rem)]">
	<!-- Header -->
	<Header />

	<!-- Main Content -->
	<main
		class="flex-1 border-subtle border-t-0 rounded-b-lg"
		style="flex-basis: 70%"
	>
		<div class="p-4 h-full flex flex-col lg:flex-row gap-6">
			<!-- Sidebar with Categories and Subcategories -->
			<aside
				class="w-full lg:w-80 border-subtle rounded-lg p-6 h-fit lg:sticky lg:top-6"
			>
				<!-- Categories Section -->
				<div class="mb-6">
					<div
						class="flex justify-between items-center mb-4 pb-3 border-b border-[#444]"
					>
						<h3 class="text-lg font-semibold text-white">Categories</h3>
						<button
							class="btn-primary text-sm"
							onclick={() => openCategoryModal()}
						>
							+ Add
						</button>
					</div>

					<div class="space-y-2">
						{#each $categories as category}
							<div
								class="card-minimal group {$selectedCategory?.id ===
								category.id
									? 'card-active'
									: ''} cursor-pointer"
								onclick={() => selectCategory(category)}
								role="button"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCategory(category); } }}
							>
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<span
											class="text-white font-medium block mb-2"
											>{category.name}</span
										>
										{#if $stats[category.id]}
											<div
												class="text-xs text-muted mb-2 font-mono"
											>
												{$stats[category.id].done}/{$stats[
													category.id
												].total}
												({$stats[category.id].percentage}%)
											</div>
											<div
												class="w-full bg-[#333] rounded-full h-1"
											>
												<div
													class="bg-white h-1 rounded-full transition-all duration-300"
													style="width: {$stats[
														category.id
													].percentage}%"
												></div>
											</div>
										{/if}
									</div>
									<div
										class="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<button
											class="text-muted hover:text-white p-1 rounded text-sm"
											onclick={(e) => {
												e.stopPropagation();
												openCategoryModal(category);
											}}>✏️</button
										>
										<button
											class="text-muted hover:text-red-400 p-1 rounded text-sm"
											onclick={(e) => {
												e.stopPropagation();
												deleteCategory(category.id);
											}}>🗑️</button
										>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Subcategories Section -->
				{#if $selectedCategory}
					<div>
						<div
							class="flex justify-between items-center mb-4 pb-3 border-b border-[#444]"
						>
							<h3 class="text-lg font-semibold text-white">
								Subcategories
							</h3>
							<button
								class="btn-primary text-sm"
								onclick={() => openSubcategoryModal()}
							>
								+ Add
							</button>
						</div>

						<div class="space-y-2">
							{#each $subcategories as subcategory}
								<div
									class="card-minimal group {$selectedSubcategory?.id ===
									subcategory.id
										? 'card-active'
										: ''} cursor-pointer"
									onclick={() =>
										selectSubcategory(subcategory)}
									role="button"
									tabindex="0"
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSubcategory(subcategory); } }}
								>
									<div
										class="flex justify-between items-center"
									>
										<h4
											class="text-white font-medium link-hover"
										>
											{subcategory.name}
										</h4>
										<div
											class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<button
												class="text-muted hover:text-white p-1 rounded text-sm"
												onclick={(e) => {
													e.stopPropagation();
													openSubcategoryModal(
														subcategory,
													);
												}}>✏️</button
											>
											<button
												class="text-muted hover:text-red-400 p-1 rounded text-sm"
												onclick={(e) => {
													e.stopPropagation();
													deleteSubcategory(
														subcategory.id,
													);
												}}>🗑️</button
											>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</aside>

			<!-- Main Content Area -->
			<section class="flex-1 flex flex-col">
				{#if $selectedSubcategory}
					<!-- Questions -->
					<div class="flex-1">
						<div
							class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-4 border-b border-[#444] gap-4"
						>
							<h3 class="text-2xl font-semibold text-white">
								Questions - {$selectedSubcategory.name}
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
													e.target.checked,
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
													e.target.checked,
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

						<div
							class="grid gap-2 md:grid-cols-[minmax(80px,10vw)_1fr] md:gap-6"
						>
							{#each filteredQuestions as question}
								<span
									class="text-xs md:text-sm font-semibold text-muted uppercase tracking-wider pt-3 md:pt-4 md:pl-2 md:text-right md:col-span-1 font-mono"
								>
									{question.isDone ? "✓" : "○"}
								</span>
								<div
									class="py-2 md:py-4 border-b border-transparent md:col-span-1 group"
								>
									<div class="flex items-start gap-4">
										<input
											type="checkbox"
											class="mt-1 accent-white w-4 h-4"
											checked={question.isDone}
											onchange={() =>
												toggleQuestionDone(
													question,
												)}
										/>
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
												onclick={() =>
													openQuestionModal(
														question,
													)}>✏️</button
											>
											<button
												class="text-muted hover:text-red-400 p-1 rounded text-sm"
												onclick={() =>
													deleteQuestion(
														question.id,
													)}>🗑️</button
											>
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
