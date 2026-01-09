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
	<div class="modal-overlay" onclick={closeModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h3>{$editingItem ? 'Edit Question' : 'Add Question'}</h3>
			
			<form onsubmit={handleSubmit}>
				<div class="form-group">
					<label for="question-name">Question Name *</label>
					<input 
						id="question-name"
						type="text" 
						class="form-control" 
						bind:value={name}
						placeholder="Enter question name..."
						required
						autofocus
					/>
				</div>

				<div class="form-group">
					<label for="question-url">Problem URL</label>
					<input 
						id="question-url"
						type="url" 
						class="form-control" 
						bind:value={url}
						placeholder="https://leetcode.com/problems/..."
					/>
				</div>

				<div class="form-group">
					<label for="question-solution">Solution Notes</label>
					<textarea 
						id="question-solution"
						class="form-control" 
						bind:value={solution}
						placeholder="Add your solution approach, time/space complexity, notes..."
						rows="4"
					></textarea>
				</div>
				
				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick={closeModal}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						{$editingItem ? 'Update' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
	}

	.form-control[rows] {
		resize: vertical;
		min-height: 80px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	.modal h3 {
		margin: 0 0 20px 0;
	}
</style>