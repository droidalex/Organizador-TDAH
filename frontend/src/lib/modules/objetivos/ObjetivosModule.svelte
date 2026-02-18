<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { Target, Plus, Trash2, Check, Pencil } from 'lucide-svelte';
  import {
    CarregarObjetivos,
    AdicionarObjetivo,
    DeletarObjetivo,
    AtualizarObjetivo,
    SalvarObjetivos,
    type Objetivo
  } from '../../services/objetivos';

  const objetivos = writable<Objetivo[]>([]);

  let isLoading = true;
  let autoSaveStatus = 'Pronto';

  // Formulário de adição
  let showAddForm = false;
  let newTitulo = '';
  let newPrazo = '';

  // Estado de edição
  let editingObjetivo: Objetivo | null = null;
  let editTitulo = '';
  let editPrazo = '';

  onMount(async () => {
    const lista = await CarregarObjetivos();
    objetivos.set(lista);
    isLoading = false;
  });

  async function addObjetivo() {
    if (!newTitulo.trim()) return;

    const objetivo: Objetivo = {
      id: `obj_${Date.now()}`,
      titulo: newTitulo.trim(),
      prazo: newPrazo ? formatarDataParaExibicao(newPrazo) : '',
      progresso: 0,
      concluido: false,
      createdAt: new Date().toISOString()
    };

    await AdicionarObjetivo(objetivo);
    objetivos.update(lista => [...lista, objetivo]);
    newTitulo = '';
    newPrazo = '';
    showAddForm = false;
  }

  async function deleteObjetivo(id: string) {
    if (!confirm('Deseja remover este objetivo?')) return;
    await DeletarObjetivo(id);
    objetivos.update(lista => lista.filter(o => o.id !== id));
  }

  async function alterarProgresso(objetivo: Objetivo, delta: number) {
    const novoProgresso = Math.min(100, Math.max(0, objetivo.progresso + delta));
    const atualizado = { ...objetivo, progresso: novoProgresso };
    await AtualizarObjetivo(atualizado);
    objetivos.update(lista =>
      lista.map(o => o.id === objetivo.id ? atualizado : o)
    );
  }

  async function concluirObjetivo(objetivo: Objetivo) {
    const atualizado = { ...objetivo, progresso: 100, concluido: true };
    await AtualizarObjetivo(atualizado);
    objetivos.update(lista =>
      lista.map(o => o.id === objetivo.id ? atualizado : o)
    );
  }

  // Edição
  function startEdit(objetivo: Objetivo) {
    editingObjetivo = objetivo;
    editTitulo = objetivo.titulo;
    editPrazo = formatarDataParaISO(objetivo.prazo);
  }

  function cancelEdit() {
    editingObjetivo = null;
    editTitulo = '';
    editPrazo = '';
  }

  async function saveEdit() {
    if (!editingObjetivo || !editTitulo.trim()) return;
    const atualizado: Objetivo = {
      ...editingObjetivo,
      titulo: editTitulo.trim(),
      prazo: editPrazo ? formatarDataParaExibicao(editPrazo) : ''
    };
    await AtualizarObjetivo(atualizado);
    objetivos.update(lista =>
      lista.map(o => o.id === atualizado.id ? atualizado : o)
    );
    cancelEdit();
  }

  // Helpers de data
  function formatarDataParaExibicao(iso: string): string {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarDataParaISO(display: string): string {
    if (!display) return '';
    const parts = display.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return '';
  }

  function cancelAdd() {
    showAddForm = false;
    newTitulo = '';
    newPrazo = '';
  }

  // Auto-save
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSaved = '';

  const unsubscribe = objetivos.subscribe((lista) => {
    if (!isLoading) {
      const json = JSON.stringify(lista);
      if (json !== lastSaved) {
        autoSaveStatus = 'Salvando...';
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(async () => {
          await SalvarObjetivos(lista);
          lastSaved = JSON.stringify(lista);
          autoSaveStatus = 'Salvo!';
          setTimeout(() => autoSaveStatus = 'Pronto', 2000);
        }, 1000);
      }
    }
  });

  onDestroy(() => {
    unsubscribe();
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
  });
</script>

<div class="objetivos-module">
  <!-- Header -->
  <div class="module-header">
    <div class="header-title">
      <div class="header-icon">
        <Target size={28} />
      </div>
      <h1>Objetivos - Conclusão</h1>
    </div>
    <div class="auto-save-indicator">
      <span class="pulse" class:saving={autoSaveStatus === 'Salvando...'}></span>
      <span>{autoSaveStatus}</span>
    </div>
  </div>

  <!-- Conteúdo -->
  <div class="content-area">
    <!-- Botão Adicionar -->
    <button class="btn-add-objetivo" on:click={() => showAddForm = true}>
      <Plus size={18} />
      <span>Adicionar Objetivo</span>
    </button>

    <!-- Formulário de adição -->
    {#if showAddForm}
      <div class="add-form-card">
        <h3>Novo Objetivo</h3>
        <input
          type="text"
          bind:value={newTitulo}
          placeholder="Título do objetivo..."
          class="input-field"
        />
        <div class="form-row">
          <label class="form-label">Prazo:</label>
          <input
            type="date"
            bind:value={newPrazo}
            class="input-field input-date"
          />
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" on:click={cancelAdd}>Cancelar</button>
          <button
            class="btn btn-primary"
            on:click={addObjetivo}
            disabled={!newTitulo.trim()}
          >
            Adicionar
          </button>
        </div>
      </div>
    {/if}

    <!-- Empty state -->
    {#if $objetivos.length === 0 && !showAddForm}
      <div class="empty-state">
        <Target size={48} />
        <p>Nenhum objetivo ainda.</p>
        <p class="empty-sub">Clique em "Adicionar Objetivo" para começar!</p>
      </div>
    {/if}

    <!-- Lista de objetivos -->
    {#each $objetivos as objetivo (objetivo.id)}
      <div class="objetivo-card" class:concluido={objetivo.concluido}>
        <!-- Cabeçalho do card -->
        <div class="card-header">
          <div class="card-title-area">
            <h3 class="card-titulo">{objetivo.titulo}</h3>
            {#if objetivo.prazo}
              <span class="card-prazo">⏰ Prazo: {objetivo.prazo}</span>
            {/if}
          </div>
          <div class="card-btns">
            <button
              class="btn-edit"
              on:click={() => startEdit(objetivo)}
              title="Editar objetivo"
            >
              <Pencil size={15} />
            </button>
            <button
              class="btn-delete"
              on:click={() => deleteObjetivo(objetivo.id)}
              title="Remover objetivo"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <!-- Barra de progresso -->
        <div class="progresso-section">
          <div class="progresso-label">
            <span>Progresso</span>
            <span class="progresso-valor">{Math.round(objetivo.progresso)}%</span>
          </div>
          <div class="progresso-bar-bg">
            <div
              class="progresso-bar-fill"
              style="width: {objetivo.progresso}%"
            ></div>
          </div>
        </div>

        <!-- Ações -->
        <div class="card-actions">
          <button
            class="btn-menos"
            on:click={() => alterarProgresso(objetivo, -10)}
            disabled={objetivo.concluido || objetivo.progresso <= 0}
            title="Diminuir 10%"
          >
            -10%
          </button>
          <button
            class="btn-mais"
            on:click={() => alterarProgresso(objetivo, 10)}
            disabled={objetivo.concluido || objetivo.progresso >= 100}
            title="Aumentar 10%"
          >
            +10%
          </button>
          <button
            class="btn-concluir"
            on:click={() => concluirObjetivo(objetivo)}
            disabled={objetivo.concluido}
            title="Marcar como concluído"
          >
            <Check size={15} />
            {objetivo.concluido ? 'Concluído!' : 'Concluir'}
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Modal de Edição -->
  {#if editingObjetivo}
    <div
      class="modal-overlay"
      on:click={cancelEdit}
      role="dialog"
      aria-modal="true"
      aria-label="Editar objetivo"
      tabindex="0"
      on:keydown={(e) => e.key === 'Escape' && cancelEdit()}
    >
      <div
        class="modal-content"
        on:click|stopPropagation
        role="document"
        on:keydown|stopPropagation
      >
        <h3>Editar Objetivo</h3>
        <input
          type="text"
          bind:value={editTitulo}
          placeholder="Título do objetivo..."
          class="input-field"
        />
        <div class="form-row">
          <label class="form-label">Prazo:</label>
          <input
            type="date"
            bind:value={editPrazo}
            class="input-field input-date"
          />
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" on:click={cancelEdit}>Cancelar</button>
          <button
            class="btn btn-primary"
            on:click={saveEdit}
            disabled={!editTitulo.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .objetivos-module {
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
    background: linear-gradient(135deg, #10b981, #059669);
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

  .content-area {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .btn-add-objetivo {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    align-self: flex-start;
  }

  .btn-add-objetivo:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .add-form-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .add-form-card h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }

  .form-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .form-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .input-field {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.9rem;
    font-family: inherit;
    box-sizing: border-box;
  }

  .input-field:focus {
    outline: none;
    border-color: #10b981;
  }

  .input-date {
    width: auto;
    flex: 1;
    color-scheme: dark;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
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

  /* Card */
  .objetivo-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: all 0.2s ease;
  }

  .objetivo-card.concluido {
    opacity: 0.75;
    border-color: #10b981;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .card-title-area {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-titulo {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .card-prazo {
    font-size: 0.85rem;
    color: var(--accent-warning);
    font-weight: 500;
  }

  .card-btns {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .btn-edit {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-edit:hover {
    background: rgba(59, 130, 246, 0.3);
  }

  .btn-delete {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  /* Progresso */
  .progresso-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .progresso-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .progresso-label span:first-child {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .progresso-valor {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .progresso-bar-bg {
    width: 100%;
    height: 10px;
    background: var(--bg-tertiary);
    border-radius: 999px;
    overflow: hidden;
  }

  .progresso-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  /* Ações */
  .card-actions {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .btn-menos {
    padding: 10px 16px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .btn-menos:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); }
  .btn-menos:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-mais {
    padding: 10px 16px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .btn-mais:hover:not(:disabled) { background: rgba(59, 130, 246, 0.25); }
  .btn-mais:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-concluir {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-concluir:hover:not(:disabled) { background: rgba(16, 185, 129, 0.25); }
  .btn-concluir:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text-muted);
    gap: 12px;
  }

  .empty-state p { margin: 0; font-size: 1rem; }
  .empty-sub { font-size: 0.85rem !important; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    border: 1px solid var(--border-color);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-content h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.25rem;
  }
</style>
