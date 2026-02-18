// Serviço para comunicação com o backend Wails
// Importar bindings gerados automaticamente
import { 
  SalvarCanvas as SalvarCanvasGo,
  CarregarCanvas as CarregarCanvasGo,
  UploadImagem as UploadImagemGo,
  DeletarImagem as DeletarImagemGo,
  LimparImagensOrfas as LimparImagensOrfasGo
} from '../../wailsjs/wailsjs/go/handlers/IdeiasHandler';

// Flag para saber se Wails está disponível
let wailsAvailable = false;

// Verificar se Wails está disponível
function checkWails() {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.go && window.go.handlers && window.go.handlers.IdeiasHandler) {
    wailsAvailable = true;
    console.log('Wails disponível');
  } else {
    wailsAvailable = false;
    console.log('Wails não disponível, usando localStorage');
  }
}

// Verificar na inicialização
checkWails();

export async function SalvarCanvas(nodes: any[], edges: any[]): Promise<void> {
  console.log('Salvando canvas:', nodes.length, 'nós,', edges.length, 'edges');
  
  // Limpar dados de imagens que não existem mais
  const nodesToSave = nodes.map(node => {
    if (node.type === 'image' && !node.data?.imageFile) {
      return { ...node, data: { ...node.data, imageFile: null } };
    }
    return node;
  });
  
  // Sempre salvar no localStorage como backup
  localStorage.setItem('ideias_canvas', JSON.stringify({ nodes: nodesToSave, edges }));
  
  if (wailsAvailable) {
    try {
      await SalvarCanvasGo(nodesToSave, edges);
      console.log('Canvas salvo no Wails');
    } catch (err) {
      console.error('Erro ao salvar no Wails:', err);
    }
  }
}

export async function CarregarCanvas(): Promise<{ nodes: any[]; edges: any[] }> {
  console.log('Carregando canvas...');
  
  if (wailsAvailable) {
    try {
      const data = await CarregarCanvasGo();
      console.log('Canvas carregado do Wails:', data);
      // Retornar dados do Wails (mesmo que vazios), não usar localStorage
      return {
        nodes: data.nodes || [],
        edges: data.edges || []
      };
    } catch (err) {
      console.error('Erro ao carregar do Wails:', err);
    }
  }
  
  // Só usar localStorage se Wails não estiver disponível (desenvolvimento)
  const data = localStorage.getItem('ideias_canvas');
  if (data) {
    console.log('Canvas carregado do localStorage (modo dev)');
    return JSON.parse(data);
  }
  
  return { nodes: [], edges: [] };
}

export async function UploadImagem(filename: string, data: number[], nodeID: string): Promise<string> {
  console.log('Fazendo upload de imagem:', filename, 'para nó:', nodeID, 'tamanho:', data.length, 'bytes');
  
  if (wailsAvailable) {
    try {
      const result = await UploadImagemGo(filename, data, nodeID);
      console.log('Upload bem-sucedido:', result);
      return result;
    } catch (err) {
      console.error('Erro no upload:', err);
      throw err;
    }
  } else {
    throw new Error('Wails não disponível para upload de imagens');
  }
}

export async function DeletarImagem(filename: string): Promise<void> {
  console.log('Deletando imagem:', filename);
  
  if (wailsAvailable) {
    try {
      await DeletarImagemGo(filename);
      console.log('Imagem deletada com sucesso');
    } catch (err) {
      console.error('Erro ao deletar imagem:', err);
    }
  }
}

export async function LimparImagensOrfas(nodeIDs: string[]): Promise<void> {
  console.log('Limpando imagens órfãs para', nodeIDs.length, 'nós');
  
  if (wailsAvailable) {
    try {
      await LimparImagensOrfasGo(nodeIDs);
      console.log('Imagens órfãs limpas com sucesso');
    } catch (err) {
      console.error('Erro ao limpar imagens órfãs:', err);
    }
  }
}
