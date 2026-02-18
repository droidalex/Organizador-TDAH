<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { 
    CarregarPassos, 
    SalvarPassos, 
    AdicionarPasso, 
    AtualizarPasso,
    DeletarPasso,
    MoverPasso,
    ToggleConcluido,
    type Passo 
  } from '$lib/services/passos';
  import { ClipboardList, Plus, Check, ChevronUp, ChevronDown, Trash2, Pencil, X } from 'lucide-svelte';
  
  const passos = writable<Passo[]>([]);
  let isLoading = true;
  let autoSaveStatus = 'Pronto';
  let showAddForm = false;
  let newDescricao = '';
  let editingPasso: Passo | null = null;
  let editDescricao = '';
  
  onMount(async () => {
    const loaded = await CarregarPassos();
    passos.set(loaded);
    isLoading = false;
  });
  
  async function addPasso() {
    if (!newDescricao.trim()) return;
    
    const passo: Passo = {
      id: `passo_${Date.now()}`,
      descricao: newDescricao.trim(),
      concluido: false,
      ordem: 0, // Será definido pelo backend
      createdAt: new Date().toISOString()
    };
    
    await AdicionarPasso(passo);
    const updated = await CarregarPassos();
    passos.set(updated);
    
    // Limpar formulário
    newDescricao = '';
    showAddForm = false;
  }
  
  async function toggleConcluido(passo: Passo) {
    await ToggleConcluido(passo.id);
    passos.update(p => p.map(item => 
      item.id === passo.id ? { ...item, concluido: !item.concluido } : item
    ));
  }
  
  async function moverPasso(passo: Passo, direcao: 'cima' | 'baixo') {
    await MoverPasso(passo.id, direcao);
    const updated = await CarregarPassos();
    passos.set(updated);
  }
  
  async function deletePasso(passo: Passo) {
    if (!confirm('Deseja remover este passo?')) return;
    
    await DeletarPasso(passo.id);
    const updated = await CarregarPassos();
    passos.set(updated);
  }
  
  function startEdit(passo: Passo) {
    editingPasso = passo;
    editDescricao = passo.descricao;
  }
  
  function cancelEdit() {
    editingPasso = null;
    editDescricao = '';
  }
  
  async function saveEdit() {
    if (!editingPasso || !editDescricao.trim()) return;
    
    const updatedPasso: Passo = {
      ...editingPasso,
      descricao: editDescricao.trim()
    };
    
    await AtualizarPasso(updatedPasso);
    passos.update(p => p.map(item => 
      item.id === updatedPasso.id ? updatedPasso : item
    ));
    
    editingPasso = null;
    editDescricao = '';
  }
  
  function cancelAdd() {
    showAddForm = false;
    newDescricao = '';
  }
  
  // Auto-save on changes
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  $: {
    if (!isLoading && $passos) {
      autoSaveStatus = 'Salvando...';
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(async () => {
        await SalvarPassos($passos);
        autoSaveStatus = 'Salvo!';
        setTimeout(() => autoSaveStatus = 'Pronto', 2000);
      }, 1000);
    }
  }
</script>

<div class="passos-module">
  <div class="module-header">
    <div class="header-title">
      <div class="header-icon">
        <ClipboardList size={28} />
      </div>
      <h1>Objetivo - Passos</h1>
    </div>
    <div class="auto-save-indicator">
      <span class="pulse" class:saving={autoSaveStatus === 'Salvando...'}></span>
      <span>{autoSaveStatus}</span>
    </div>
  </div>
  
  <div class="passos-container">
    <!-- Botão Adicionar -->
    {#if !showAddForm}
      <div class="btn-wrapper">
        <button class="btn-add" on:click={() => showAddForm = true}>
          <Plus size={20} />
          <span>Adicionar Passo</span>
        </button>
      </div>
    {/if}
    
    <!-- Formulário de Adicionar -->
    {#if showAddForm}
      <div class="add-passo-card">
        <h3>Novo Passo</h3>
        <textarea 
          bind:value={newDescricao} 
          placeholder="Descreva o passo..." 
          class="textarea-field"
          rows="3"
        ></textarea>
        <div class="form-actions">
          <button class="btn btn-secondary" on:click={cancelAdd}>
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            on:click={addPasso}
            disabled={!newDescricao.trim()}
          >
            Adicionar
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Lista de Passos -->
    <div class="passos-list">
      {#if $passos.length === 0 && !showAddForm}
        <div class="empty-state">
          <div class="empty-icon">
            <ClipboardList size={64} />
          </div>
          <p class="empty-text">Nenhum passo adicionado ainda</p>
          <p class="empty-hint">Clique em "Adicionar Passo" para começar!</p>
        </div>
      {:else}
        {#each $passos as passo, index (passo.id)}
          <div class="passo-item" class:concluido={passo.concluido}>
            <div class="passo-number">{index + 1}</div>
            
            <div class="passo-content">
              {#if editingPasso?.id === passo.id}
                <div class="edit-form">
                  <textarea 
                    bind:value={editDescricao} 
                    placeholder="Descreva o passo..." 
                    class="textarea-field"
                    rows="2"
                  ></textarea>
                  <div class="edit-actions">
                    <button 
                      class="btn-save-edit" 
                      on:click={saveEdit}
                      disabled={!editDescricao.trim()}
                      title="Salvar"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      class="btn-cancel-edit" 
                      on:click={cancelEdit}
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              {:else}
                <p class="passo-descricao">{passo.descricao}</p>
              {/if}
            </div>
            
            {#if editingPasso?.id !== passo.id}
            <div class="passo-actions">
              <button 
                class="btn-check" 
                class:checked={passo.concluido}
                on:click={() => toggleConcluido(passo)}
                title={passo.concluido ? "Desmarcar" : "Concluir"}
              >
                <Check size={18} />
              </button>
              
              <button 
                class="btn-edit" 
                on:click={() => startEdit(passo)}
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              
              <button 
                class="btn-move" 
                on:click={() => moverPasso(passo, 'cima')}
                disabled={index === 0}
                title="Mover para cima"
              >
                <ChevronUp size={18} />
              </button>
              
              <button 
                class="btn-move" 
                on:click={() => moverPasso(passo, 'baixo')}
                disabled={index === $passos.length - 1}
                title="Mover para baixo"
              >
                <ChevronDown size={18} />
              </button>
              
              <button 
                class="btn-delete" 
                on:click={() => deletePasso(passo)}
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .passos-module {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--bg-primary);
  }
  
  .module-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .header-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #9333ea, #c084fc);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .header-title h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }
  
  .auto-save-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  
  .pulse {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  .pulse.saving {
    background: #f59e0b;
    animation: pulse 0.5s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .passos-container {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }
  
  .btn-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }
  
  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #9333ea, #c084fc);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-add:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
  }
  
  .add-passo-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .add-passo-card h3 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }
  
  .textarea-field {
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
  }
  
  .textarea-field:focus {
    outline: none;
    border-color: #9333ea;
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #9333ea, #c084fc);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }
  
  .btn-secondary:hover {
    background: var(--bg-tertiary);
  }
  
  .passos-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .passo-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px 24px;
    transition: all 0.2s ease;
  }
  
  .passo-item:hover {
    border-color: #9333ea;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .passo-item.concluido {
    opacity: 0.7;
  }
  
  .passo-item.concluido .passo-descricao {
    text-decoration: line-through;
    color: var(--text-muted);
  }
  
  .passo-number {
    width: 40px;
    height: 40px;
    min-width: 40px;
    background: linear-gradient(135deg, #9333ea, #c084fc);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1.1rem;
  }
  
  .passo-content {
    flex: 1;
    min-width: 0;
  }
  
  .passo-descricao {
    margin: 0;
    color: var(--text-primary);
    font-size: 1rem;
    line-height: 1.5;
  }
  
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .edit-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .btn-save-edit {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .btn-save-edit:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    transform: scale(1.05);
  }
  
  .btn-save-edit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-cancel-edit {
    background: rgba(107, 114, 128, 0.1);
    border: 1px solid rgba(107, 114, 128, 0.3);
    color: #6b7280;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .btn-cancel-edit:hover {
    background: rgba(107, 114, 128, 0.2);
    transform: scale(1.05);
  }
  
  .passo-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  
  .passo-actions button {
    padding: 8px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .btn-check {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }
  
  .btn-check:hover {
    background: rgba(16, 185, 129, 0.2);
  }
  
  .btn-check.checked {
    background: #10b981;
    color: white;
  }
  
  .btn-edit {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  .btn-edit:hover {
    background: rgba(59, 130, 246, 0.2);
    transform: scale(1.05);
  }
  
  .btn-move {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }
  
  .btn-move:hover:not(:disabled) {
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .btn-move:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .btn-delete {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
  
  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.05);
  }
  
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }
  
  .empty-icon {
    color: var(--text-muted);
    opacity: 0.5;
    margin-bottom: 24px;
  }
  
  .empty-text {
    font-size: 1.2rem;
    margin: 0 0 8px 0;
    color: var(--text-primary);
  }
  
  .empty-hint {
    font-size: 0.95rem;
    margin: 0;
    opacity: 0.7;
  }
</style>
