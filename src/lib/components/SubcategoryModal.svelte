<script>
	import { showSubcategoryModal, editingItem } from '$lib/stores.js';

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
		showSubcategoryModal.set(false);
		editingItem.set(null);
	}
</script>

{#if $showSubcategoryModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onclick={closeModal}>
		<div class="bg-[#1a1a1a] border-subtle rounded-lg p-8 max-w-md w-full mx-4" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-2xl font-semibold text-white mb-6">
				{$editingItem ? 'Edit Subcategory' : 'Add Subcategory'}
			</h3>
			
			<form onsubmit={handleSubmit}>
				<div class="mb-6">
					<label for="subcategory-name" class="block text-muted font-medium mb-2">
						Subcategory Name
					</label>
					<input 
						id="subcategory-name"
						type="text" 
						class="input-field w-full" 
						bind:value={name}
						placeholder="Enter subcategory name..."
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