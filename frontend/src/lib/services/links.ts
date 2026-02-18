// Serviço para comunicação com o backend do módulo Links
import {
  SalvarLinks as SalvarLinksGo,
  CarregarLinks as CarregarLinksGo,
  AdicionarLink as AdicionarLinkGo,
  DeletarLink as DeletarLinkGo,
  AtualizarLink as AtualizarLinkGo
} from '../../wailsjs/wailsjs/go/handlers/LinksHandler';

export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
}

let wailsAvailable = false;

function checkWails() {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.go && window.go.handlers && window.go.handlers.LinksHandler) {
    wailsAvailable = true;
    console.log('Wails Links disponível');
  } else {
    wailsAvailable = false;
    console.log('Wails Links não disponível, usando localStorage');
  }
}

checkWails();

export async function SalvarLinks(links: Link[]): Promise<void> {
  console.log('Salvando', links.length, 'links');
  
  // Sempre salvar no localStorage como backup
  localStorage.setItem('links_data', JSON.stringify(links));
  
  if (wailsAvailable) {
    try {
      await SalvarLinksGo(links);
      console.log('Links salvos no Wails');
    } catch (err) {
      console.error('Erro ao salvar links no Wails:', err);
    }
  }
}

export async function CarregarLinks(): Promise<Link[]> {
  console.log('Carregando links...');
  
  if (wailsAvailable) {
    try {
      const links = await CarregarLinksGo();
      console.log('Links carregados do Wails:', links.length);
      if (links && links.length >= 0) {
        // Atualizar localStorage com dados do Wails
        localStorage.setItem('links_data', JSON.stringify(links));
        return links;
      }
    } catch (err) {
      console.error('Erro ao carregar links do Wails:', err);
    }
  }
  
  // Fallback para localStorage
  const data = localStorage.getItem('links_data');
  if (data) {
    console.log('Links carregados do localStorage');
    return JSON.parse(data);
  }
  
  return [];
}

export async function AdicionarLink(link: Link): Promise<void> {
  console.log('Adicionando link:', link.title);
  
  if (wailsAvailable) {
    try {
      await AdicionarLinkGo(link);
      console.log('Link adicionado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao adicionar link no Wails:', err);
    }
  }
  
  // Fallback: salvar tudo
  const links = await CarregarLinks();
  links.push(link);
  await SalvarLinks(links);
}

export async function DeletarLink(id: string): Promise<void> {
  console.log('Deletando link:', id);
  
  if (wailsAvailable) {
    try {
      await DeletarLinkGo(id);
      console.log('Link deletado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao deletar link no Wails:', err);
    }
  }
  
  // Fallback
  const links = await CarregarLinks();
  const filtered = links.filter(l => l.id !== id);
  await SalvarLinks(filtered);
}

export async function AtualizarLink(link: Link): Promise<void> {
  console.log('Atualizando link:', link.id);
  
  if (wailsAvailable) {
    try {
      await AtualizarLinkGo(link);
      console.log('Link atualizado no Wails');
      return;
    } catch (err) {
      console.error('Erro ao atualizar link no Wails:', err);
    }
  }
  
  // Fallback
  const links = await CarregarLinks();
  const index = links.findIndex(l => l.id === link.id);
  if (index !== -1) {
    links[index] = link;
    await SalvarLinks(links);
  }
}
