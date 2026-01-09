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
	<div class="modal-overlay" onclick={closeModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h3>{$editingItem ? 'Edit Subcategory' : 'Add Subcategory'}</h3>
			
			<form onsubmit={handleSubmit}>
				<div class="form-group">
					<label for="subcategory-name">Subcategory Name</label>
					<input 
						id="subcategory-name"
						type="text" 
						class="form-control" 
						bind:value={name}
						placeholder="Enter subcategory name..."
						required
						autofocus
					/>
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