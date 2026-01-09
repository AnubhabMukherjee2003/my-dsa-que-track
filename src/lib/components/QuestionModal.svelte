<script>
	import { showQuestionModal, editingItem } from '$lib/stores.js';

	let { onSave } = $props();
	let name = $state('');
	let url = $state('');
	let solution = $state('');

	$effect(() => {
		if ($editingItem) {
			name = $editingItem.name || '';
			url = $editingItem.url || '';
			solution = $editingItem.solution || '';
		} else {
			name = '';
			url = '';
			solution = '';
		}
	});

	function handleSubmit(e) {
		e.preventDefault();
		if (name.trim()) {
			onSave({
				name: name.trim(),
				url: url.trim(),
				solution: solution.trim()
			});
		}
	}

	function closeModal() {
		showQuestionModal.set(false);
		editingItem.set(null);
	}
</script>

{#if $showQuestionModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onclick={closeModal}>
		<div class="bg-[#1a1a1a] border-subtle rounded-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-2xl font-semibold text-white mb-6">
				{$editingItem ? 'Edit Question' : 'Add Question'}
			</h3>
			
			<form onsubmit={handleSubmit}>
				<div class="mb-6">
					<label for="question-name" class="block text-muted font-medium mb-2">
						Question Name *
					</label>
					<input 
						id="question-name"
						type="text" 
						class="input-field w-full" 
						bind:value={name}
						placeholder="Enter question name..."
						required
						autofocus
					/>
				</div>

				<div class="mb-6">
					<label for="question-url" class="block text-muted font-medium mb-2">
						Problem URL
					</label>
					<input 
						id="question-url"
						type="url" 
						class="input-field w-full" 
						bind:value={url}
						placeholder="https://leetcode.com/problems/..."
					/>
				</div>

				<div class="mb-6">
					<label for="question-solution" class="block text-muted font-medium mb-2">
						Solution Notes
					</label>
					<textarea 
						id="question-solution"
						class="input-field w-full resize-y min-h-[100px]" 
						bind:value={solution}
						placeholder="Add your solution approach, time/space complexity, notes..."
						rows="4"
					></textarea>
				</div>
				
				<div class="flex justify-end gap-3">
					<button type="button" class="btn-secondary" onclick={closeModal}>
						Cancel
					</button>
					<button type="submit" class="btn-primary">
						{$editingItem ? 'Update' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}