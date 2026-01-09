<script>
	import { showCategoryModal, editingItem } from '$lib/stores.js';

	let { onSave } = $props();
	let name = $state('');

	$effect(() => {
		if ($editingItem) {
			name = $editingItem.name || '';
		} else {
			name = '';
		}
	});

	function handleSubmit(e) {
		e.preventDefault();
		if (name.trim()) {
			onSave(name.trim());
		}
	}

	function closeModal() {
		showCategoryModal.set(false);
		editingItem.set(null);
	}
</script>

{#if $showCategoryModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onclick={closeModal}>
		<div class="bg-[#1a1a1a] border-subtle rounded-lg p-8 max-w-md w-full mx-4" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-2xl font-semibold text-white mb-6">
				{$editingItem ? 'Edit Category' : 'Add Category'}
			</h3>
			
			<form onsubmit={handleSubmit}>
				<div class="mb-6">
					<label for="category-name" class="block text-muted font-medium mb-2">
						Category Name
					</label>
					<input 
						id="category-name"
						type="text" 
						class="input-field w-full" 
						bind:value={name}
						placeholder="Enter category name..."
						required
						autofocus
					/>
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