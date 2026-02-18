<script lang="ts">
  import { writable, derived } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    useSvelteFlow,
    Panel,
    type Node,
    type Edge,
    type Connection,
    ConnectionMode
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  
  // Importar nós personalizados
  import TextNode from './nodes/TextNode.svelte';
  import ImageNode from './nodes/ImageNode.svelte';
  import LinkNode from './nodes/LinkNode.svelte';
  import GroupNode from './nodes/GroupNode.svelte';
  
  // Importar serviços do backend
  import { SalvarCanvas, CarregarCanvas, DeletarImagem, LimparImagensOrfas } from '$lib/services/wails';
  
  // Tipos de nós
  const nodeTypes = {
    text: TextNode,
    image: ImageNode,
    link: LinkNode,
    group: GroupNode
  };
  
  // Stores
  const nodes = writable<Node[]>([]);
  const edges = writable<Edge[]>([]);
  
  // Estado
  let autoSaveStatus = 'Pronto';
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let isLoading = true;
  
  // Derived store para monitorar mudanças
  const canvasData = derived([nodes, edges], ([$nodes, $edges]) => ({
    nodes: $nodes,
    edges: $edges
  }));
  
  // Auto-save quando os dados mudam
  const unsubscribe = canvasData.subscribe(($data) => {
    if (!isLoading && $data.nodes.length > 0) {
      autoSaveStatus = 'Salvando...';
      
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      autoSaveTimer = setTimeout(async () => {
        try {
          await SalvarCanvas($data.nodes, $data.edges);
          autoSaveStatus = 'Salvo!';
          
          setTimeout(() => {
            autoSaveStatus = 'Pronto';
          }, 2000);
        } catch (err) {
          console.error('Erro ao salvar:', err);
          autoSaveStatus = 'Erro ao salvar';
        }
      }, 1000);
    }
  });
  
  onMount(async () => {
    try {
      const data = await CarregarCanvas();
      console.log('Dados carregados:', data);
      console.log('Nós carregados:', data.nodes);
      
      // Filtrar nós válidos (que têm tipo e posição)
      const validNodes = (data.nodes || []).filter(n => n && n.id && n.type && n.position);
      // Normalizar campos parent/parentId
      const normalizedNodes = validNodes.map(node => {
        // Se o nó tem parent mas não parentId, copiar
        if (node.parent && !node.parentId) {
          node.parentId = node.parent;
        }
        // Se o nó tem parentId mas não parent, copiar
        if (node.parentId && !node.parent) {
          node.parent = node.parentId;
        }
        return node;
      });
      console.log('Nós válidos:', normalizedNodes.map(n => ({ id: n.id, parentId: n.parentId, parent: n.parent })));
      
      if (normalizedNodes.length > 0) {
        const orderedNodes = ordenarNodes(normalizedNodes);
        nodes.set(orderedNodes);
        const loadedEdges = data.edges || [];
        console.log('Edges carregadas:', loadedEdges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })));
        const normalizedEdges = normalizarEdges(loadedEdges);
        console.log('Edges normalizadas:', normalizedEdges.map(e => ({ id: e.id, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })));
        edges.set(normalizedEdges);
        console.log('Canvas carregado com', orderedNodes.length, 'nós');
        
        // Limpar imagens órfãs da pasta assets
        const nodeIDs = orderedNodes.map(n => n.id);
        try {
          await LimparImagensOrfas(nodeIDs);
          console.log('Limpeza de imagens órfãs concluída');
        } catch (err) {
          console.error('Erro ao limpar imagens órfãs:', err);
          // Não bloquear o carregamento em caso de erro
        }
      }
      // Não adicionar nó inicial - começar vazio
    } catch (err) {
      console.error('Erro ao carregar canvas:', err);
      // Não adicionar nó inicial em caso de erro
    } finally {
      isLoading = false;
    }
    
    // Adicionar evento de teclado para delete
    window.addEventListener('keydown', handleKeyDown);
  });
  
  function handleKeyDown(event) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Deletar nós e edges selecionados
      const selectedNodes = $nodes.filter(n => n.selected);
      const selectedEdges = $edges.filter(e => e.selected);
      
      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        // Deletar imagens dos nós de imagem antes de remover
        selectedNodes.forEach(async (node) => {
          if (node.type === 'image' && node.data?.imageFile) {
            try {
              await DeletarImagem(node.data.imageFile);
              console.log('Imagem deletada:', node.data.imageFile);
            } catch (err) {
              console.error('Erro ao deletar imagem:', err);
            }
          }
        });
        
        nodes.update(currentNodes => {
          const selectedNodes = currentNodes.filter(n => n.selected);
          const selectedGroupIds = selectedNodes.filter(n => n.type === 'group').map(g => g.id);
          
          // Remove selected nodes
          let filteredNodes = currentNodes.filter(node => !node.selected);
          
          // For any node that has parentId referencing a deleted group, clear parentId and convert position to absolute
          if (selectedGroupIds.length > 0) {
            filteredNodes = filteredNodes.map(node => {
              if (node.parentId && selectedGroupIds.includes(node.parentId)) {
                const deletedGroup = selectedNodes.find(g => g.id === node.parentId);
                if (deletedGroup) {
                  console.log(`Convertendo nó ${node.id} para posição absoluta após deletar grupo ${deletedGroup.id}`);
                  return {
                    ...node,
                    parentId: undefined,
                    position: {
                      x: node.position.x + deletedGroup.position.x,
                      y: node.position.y + deletedGroup.position.y
                    }
                  };
                }
              }
              return node;
            });
          }
          
          return ordenarNodes(filteredNodes);
        });
        edges.update(e => e.filter(edge => !edge.selected));
      }
    }
  }
  
  function adicionarNo(type: 'text' | 'image' | 'link' | 'group', position?: { x: number; y: number }) {
    const id = `${type}_${Date.now()}`;
    
    // Gerar posição aleatória se não fornecida
    const nodePosition = position || {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100
    };
    
    const newNode: Node = {
      id,
      type,
      position: nodePosition,
      data: getDefaultData(type)
    };
    
    if (type === 'group') {
      newNode.style = {
        width: 400,
        height: 300,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '2px dashed #3b82f6',
        borderRadius: '12px',
        zIndex: -1
      };
      // @ts-ignore
      newNode.resizable = true;
      newNode.width = 400;
      newNode.height = 300;
      // @ts-ignore
      newNode.zIndex = -1; // Grupos ficam em camada inferior
      
      // Adicionar o grupo e verificar se nós existentes estão dentro dele
      nodes.update(currentNodes => {
        // Primeiro adiciona o novo grupo
        const nodesComGrupo = [...currentNodes, newNode];
        const grupos = nodesComGrupo.filter(n => n.type === 'group');
        
        // Para cada nó que não é grupo e não tem parentId (ou já está em outro grupo? vamos mover)
        const updatedNodes = nodesComGrupo.map(node => {
          if (node.type === 'group') return node; // não modificar grupos
          if (node.parentId) return node; // já está em um grupo, não mover automaticamente
          
          const absPos = calcularPosicaoAbsoluta(node, grupos);
          const dentroDoGrupo = (
            absPos.x >= newNode.position.x &&
            absPos.x <= newNode.position.x + newNode.width! &&
            absPos.y >= newNode.position.y &&
            absPos.y <= newNode.position.y + newNode.height!
          );
          
          if (dentroDoGrupo) {
            console.log(`Nó ${node.id} está dentro do novo grupo ${newNode.id}, agrupando...`);
            return {
              ...node,
              parentId: newNode.id,
              position: {
                x: absPos.x - newNode.position.x,
                y: absPos.y - newNode.position.y
              }
            };
          }
          return node;
        });
        
        return ordenarNodes(updatedNodes);
      });
      
    } else {
      // Verificar se o novo nó está sendo adicionado dentro de um grupo
      nodes.update(currentNodes => {
        const grupos = currentNodes.filter(n => n.type === 'group');
        
        const grupoPai = grupos.find(grupo => {
          const gPos = grupo.position;
          const gWidth = grupo.width || 400;
          const gHeight = grupo.height || 300;
          
          return (
            nodePosition.x >= gPos.x &&
            nodePosition.x <= gPos.x + gWidth &&
            nodePosition.y >= gPos.y &&
            nodePosition.y <= gPos.y + gHeight
          );
        });
        
        if (grupoPai) {
          newNode.parentId = grupoPai.id;
          newNode.position = {
            x: nodePosition.x - grupoPai.position.x,
            y: nodePosition.y - grupoPai.position.y
          };
        }
        
        return ordenarNodes([...currentNodes, newNode]);
      });
      return;
    }
  }
  
  function getDefaultData(type: string) {
    switch (type) {
      case 'text':
        return {
          title: 'Nova Nota',
          content: 'Clique duplo para editar...'
        };
      case 'image':
        return {
          title: 'Nova Imagem',
          imageFile: null
        };
      case 'link':
        return {
          title: 'Novo Link',
          url: '',
          description: ''
        };
      case 'group':
        return {
          title: 'Novo Grupo',
          color: 'rgba(59, 130, 246, 0.1)'
        };
      default:
        return {};
    }
  }
  
   function onConnect(connection: Connection) {
    if (connection.source && connection.target) {
      const newEdge: Edge = {
        id: `e_${connection.source}_${connection.target}_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'default',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 }
      };
      edges.update((e) => [...e, newEdge]);
    }
  }
  
  // Deletar imagem quando nó de imagem é deletado
  
  function limparCanvas() {
    if (confirm('Tem certeza que deseja limpar o canvas? Todos os nós serão perdidos.')) {
      nodes.set([]);
      edges.set([]);
      autoSaveStatus = 'Salvando...';
      SalvarCanvas([], []).then(() => {
        autoSaveStatus = 'Salvo!';
        setTimeout(() => {
          autoSaveStatus = 'Pronto';
        }, 2000);
      });
    }
  }

  function limparDadosSalvos() {
    if (confirm('Tem certeza que deseja limpar todos os dados salvos?\n\nIsso apagará tudo permanentemente.')) {
      // Limpar localStorage
      localStorage.removeItem('ideias_canvas');
      
      // Limpar nós e edges
      nodes.set([]);
      edges.set([]);
      
      // Salvar canvas vazio (sobrescreve o arquivo)
      SalvarCanvas([], []).then(() => {
        autoSaveStatus = 'Dados limpos!';
        setTimeout(() => {
          autoSaveStatus = 'Pronto';
        }, 2000);
      });
      
      // Recarregar a página para garantir
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }
  
  function deletarNoSelecionado() {
    // Implementação básica - pode ser expandida com seleção
    console.log('Função de deletar nó selecionado');
  }

  // Ordenar nós para garantir que grupos apareçam antes de seus filhos
  function ordenarNodes(nodes: Node[]): Node[] {
    console.log('Ordenando nós:', nodes.map(n => ({ id: n.id, type: n.type, parentId: n.parentId })));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const visited = new Set();
    const result: Node[] = [];

    function visit(node: Node) {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId);
        if (parent) visit(parent);
      } else if (node.parentId) {
        console.warn(`Parent node ${node.parentId} not found for node ${node.id}`);
      }
      result.push(node);
    }

    nodes.forEach(node => visit(node));
    console.log('Ordem resultante:', result.map(n => n.id));
    return result;
  }

   function calcularPosicaoAbsoluta(node: Node, grupos: Node[]): { x: number, y: number } {
    let x = node.position.x;
    let y = node.position.y;
    if (node.parentId) {
      const grupoPai = grupos.find(g => g.id === node.parentId);
      if (grupoPai) {
        x += grupoPai.position.x;
        y += grupoPai.position.y;
      }
    }
    return { x, y };
  }

  function normalizarEdges(edges: any[]): Edge[] {
    return edges.map(edge => {
      // Garantir campos padrão
      const normalized: Edge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        animated: edge.animated !== undefined ? edge.animated : true,
        style: edge.style || { stroke: '#6366f1', strokeWidth: 2 }
      };
      
      // Se não tem sourceHandle ou targetHandle, tentar extrair do ID
      if (!normalized.sourceHandle || !normalized.targetHandle) {
        // Tentar extrair handles do ID (formato xy-edge__{source}{sourceHandle}-{target}{targetHandle})
        const match = edge.id.match(/xy-edge__(.+?)(top|bottom|left|right)-(.+?)(top|bottom|left|right)/);
        if (match) {
          const [, source, sourceHandle, target, targetHandle] = match;
          console.log(`Extraindo handles do ID ${edge.id}: sourceHandle=${sourceHandle}, targetHandle=${targetHandle}`);
          normalized.sourceHandle = sourceHandle;
          normalized.targetHandle = targetHandle;
        } else {
          console.warn(`Edge ${edge.id} não tem handles definidos e não foi possível extrair do ID`);
        }
      }
      
      return normalized;
    });
  }

  // Verificar se um nó está dentro de um grupo ao finalizar arrasto
  function verificarAgrupamento(event: any) {
    const nodeArrastado = event.detail?.node || event.detail?.nodes?.[0];
    if (!nodeArrastado) return;
    
    console.log('Nó arrastado:', nodeArrastado.id, 'tipo:', nodeArrastado.type);
    
    // Ignorar grupos (só nós normais podem ser agrupados)
    if (nodeArrastado.type === 'group') return;
    
    nodes.update(currentNodes => {
      const grupos = currentNodes.filter(n => n.type === 'group');
      console.log('Grupos disponíveis:', grupos.length);
      
      const updatedNodes = currentNodes.map(node => {
        if (node.id !== nodeArrastado.id) return node;
        
        // Calcular posição absoluta do nó
        const absPos = calcularPosicaoAbsoluta(node, grupos);
        let absoluteX = absPos.x;
        let absoluteY = absPos.y;
        
        console.log(`Posição absoluta do nó ${node.id}: (${absoluteX}, ${absoluteY})`);
        
        // Verificar se está dentro de algum grupo
        let grupoPai = null;
        for (const grupo of grupos) {
          if (node.id === grupo.id) continue;
          
          const gx = grupo.position.x;
          const gy = grupo.position.y;
          const gw = grupo.width || 400;
          const gh = grupo.height || 300;
          
          const dentroDoGrupo = (
            absoluteX >= gx &&
            absoluteX <= gx + gw &&
            absoluteY >= gy &&
            absoluteY <= gy + gh
          );
          
          if (dentroDoGrupo) {
            console.log(`Nó ${node.id} está dentro do grupo ${grupo.id}`);
            grupoPai = grupo;
            break;
          }
        }
        
        // Se encontrou um grupo e ainda não é filho dele
        if (grupoPai && node.parentId !== grupoPai.id) {
          console.log(`Entrando no grupo ${grupoPai.id}`);
          return {
            ...node,
            parentId: grupoPai.id,
            position: {
              x: absoluteX - grupoPai.position.x,
              y: absoluteY - grupoPai.position.y
            }
          };
        }
        
        // Se não está em nenhum grupo mas tem parentId
        if (!grupoPai && node.parentId) {
          console.log(`Saindo do grupo ${node.parentId}`);
          return {
            ...node,
            parentId: undefined,
            position: {
              x: absoluteX,
              y: absoluteY
            }
          };
        }
        
        return node;
      });
      
      return ordenarNodes(updatedNodes);
    });
  }

</script>

<div class="ideias-module">
  <div class="module-header">
    <div class="header-title">
      <span class="header-icon">💡</span>
      <h1>Canvas de Ideias</h1>
    </div>
    <div class="auto-save-indicator">
      <span class="pulse" class:saving={autoSaveStatus === 'Salvando...'}></span>
      <span>{autoSaveStatus}</span>
    </div>
  </div>
  
  <div class="canvas-wrapper">
    <SvelteFlow
      {nodes}
      {edges}
      {nodeTypes}
      on:connect={({ detail }) => onConnect(detail)}
      on:nodedragstop={verificarAgrupamento}
      connectionMode={ConnectionMode.Loose}
      fitView
      minZoom={0.1}
      maxZoom={2}
      class="svelte-flow-custom"
      selectionKeyCode="Control"
      selectionOnDrag={true}
      selectNodesOnDrag={true}
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <MiniMap
        nodeStrokeWidth={3}
        maskColor="rgba(0, 0, 0, 0.2)"
        class="mini-map"
        pannable={true}
        zoomable={true}
      />
      
      <Panel position="top-left" class="controls-panel">
        <div class="controls-box">
          <h3>Ferramentas</h3>
          <div class="btn-group">
            <button class="btn btn-primary" on:click={() => adicionarNo('text')}>
              <span>📝</span>
              Adicionar Texto
            </button>
            <button class="btn btn-success" on:click={() => adicionarNo('link')}>
              <span>🔗</span>
              Adicionar Link
            </button>
            <button class="btn btn-purple" on:click={() => adicionarNo('image')}>
              <span>🖼️</span>
              Adicionar Imagem
            </button>
            <button class="btn btn-warning" on:click={() => adicionarNo('group')}>
              <span>📁</span>
              Adicionar Grupo
            </button>
          </div>
          
          <div class="btn-group secondary">
            <button class="btn btn-danger" on:click={limparCanvas}>
              <span>🗑️</span>
              Limpar Canvas
            </button>
            <button class="btn btn-secondary" on:click={limparDadosSalvos}>
              <span>💾</span>
              Limpar Dados Salvos
            </button>
          </div>
          
          <div class="instructions">
            <p>💡 Arraste os nós para organizar</p>
            <p>🔗 Conecte arrastando dos pontos</p>
            <p>✏️ Duplo clique para editar</p>
            <p>🖱️ Clique para selecionar</p>
          </div>
        </div>
      </Panel>
    </SvelteFlow>
  </div>
</div>

<style>
  .ideias-module {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  
  .module-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .header-icon {
    font-size: 1.5rem;
  }
  
  .header-title h1 {
    font-size: 1.25rem;
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
    background: var(--accent-success);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  .pulse.saving {
    background: var(--accent-warning);
    animation: pulse 0.5s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .canvas-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  
  :global(.svelte-flow-custom) {
    background: var(--bg-primary) !important;
  }
  
  :global(.svelte-flow__node) {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }
  
  :global(.svelte-flow__node.selected) {
    box-shadow: none !important;
  }
  
  :global(.svelte-flow__handle) {
    width: 10px;
    height: 10px;
    background: #6366f1;
    border: 2px solid white;
    border-radius: 50%;
  }
  
  :global(.svelte-flow__handle:hover) {
    background: #818cf8;
  }
  
  :global(.svelte-flow__edge-path) {
    stroke: #6366f1 !important;
    stroke-width: 2 !important;
  }
  
  :global(.svelte-flow__edge.animated path) {
    stroke-dasharray: 5;
    animation: dashdraw 0.5s linear infinite;
  }
  
  @keyframes dashdraw {
    from {
      stroke-dashoffset: 10;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  
  :global(.svelte-flow__controls) {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }
  
  :global(.svelte-flow__controls-button) {
    background: var(--bg-secondary) !important;
    color: var(--text-primary) !important;
    border-bottom: 1px solid var(--border-color) !important;
  }
  
  :global(.svelte-flow__controls-button:hover) {
    background: var(--bg-tertiary) !important;
  }
  
  :global(.svelte-flow__minimap) {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
  }
  
  :global(.controls-panel) {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  .controls-box {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    width: 280px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    margin: 12px;
  }
  
  .controls-box h3 {
    margin: 0 0 16px 0;
    font-size: 1rem;
    color: var(--text-primary);
  }
  
  .btn-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .btn-group.secondary {
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }
  
  .btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    justify-content: flex-start;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: white;
  }
  
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .btn-success {
    background: linear-gradient(135deg, #047857, #10b981);
    color: white;
  }
  
  .btn-success:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .btn-purple {
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    color: white;
  }
  
  .btn-purple:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
  
  .btn-warning {
    background: linear-gradient(135deg, #d97706, #f59e0b);
    color: white;
  }
  
  .btn-warning:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
  
  .btn-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.3);
  }
  
  .instructions {
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }
  
  .instructions p {
    margin: 4px 0;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>
