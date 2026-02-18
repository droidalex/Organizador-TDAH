<script lang="ts">
  import Sidebar from './lib/components/Sidebar.svelte';
  import IdeiasModule from './lib/modules/ideias/IdeiasModule.svelte';
  import LinksModule from './lib/modules/links/LinksModule.svelte';
  import PlanejamentoModule from './lib/modules/planejamento/PlanejamentoModule.svelte';
  import PassosModule from './lib/modules/passos/PassosModule.svelte';
  import CalendarioModule from './lib/modules/calendario/CalendarioModule.svelte';
  import ObjetivosModule from './lib/modules/objetivos/ObjetivosModule.svelte';
  
  let moduloAtivo = 'ideias';
  
  function onSelecionarModulo(event: CustomEvent<string>) {
    moduloAtivo = event.detail;
  }
</script>

<div class="app-container">
  <Sidebar {moduloAtivo} on:selecionar={onSelecionarModulo} />
  
  <main class="main-content">
    {#if moduloAtivo === 'ideias'}
      <IdeiasModule />
    {:else if moduloAtivo === 'links'}
      <LinksModule />
    {:else if moduloAtivo === 'planejamento'}
      <PlanejamentoModule />
    {:else if moduloAtivo === 'objetivo-passos'}
      <PassosModule />
    {:else if moduloAtivo === 'calendario'}
      <CalendarioModule />
    {:else if moduloAtivo === 'objetivos'}
      <ObjetivosModule />
    {:else}
      <div class="welcome-screen">
        <div class="welcome-content">
          <h1>Organizador TDAH Pro</h1>
          <p>Selecione um módulo para começar</p>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  :global(:root) {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --accent-primary: #3b82f6;
    --accent-secondary: #8b5cf6;
    --accent-success: #10b981;
    --accent-warning: #f59e0b;
    --accent-danger: #ef4444;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --border-color: #475569;
  }
  
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
  
  :global(body) {
    margin: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
    background: var(--bg-primary);
  }
  
  .main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .welcome-screen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }
  
  .welcome-content {
    text-align: center;
  }
  
  .welcome-content h1 {
    font-size: 2.5rem;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .welcome-content p {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
  
  :global(.btn) {
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  :global(.btn-primary) {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
  }
  
  :global(.btn-primary:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
</style>
