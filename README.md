# Organizador TDAH Pro

Aplicativo desktop modular desenvolvido com Wails (Go + Svelte) para auxiliar pessoas com TDAH na organização de ideias e tarefas.

![Organizador TDAH Pro](screenshot.png)

## Funcionalidades

### Módulo Ideias/Notas
- **Canvas Visual**: Interface drag-and-drop usando SvelteFlow para organizar ideias
- **Tipos de Nós**:
  - 📝 **Texto**: Notas com título e conteúdo editáveis
  - 🔗 **Link**: Links com título, URL e descrição (clique para abrir)
  - 🖼️ **Imagem**: Upload de imagens com visualização em tamanho natural
  - 📁 **Grupo**: Agrupamento de nós com cores customizáveis

- **Conexões**: Conecte nós usando handles em 4 posições (topo, direita, baixo, esquerda)
- **Grupos**: Agrupe nós relacionados, redimensione e mova-os juntos
- **Auto-save**: Salvamento automático a cada 5 segundos
- **Gerenciamento de Assets**: Imagens armazenadas em pasta local, limpeza automática de arquivos órfãos

## Requisitos

- Go 1.21 ou superior
- Node.js 18 ou superior
- Wails CLI v2.9.2 ou superior

## Instalação

### 1. Instalar Wails CLI

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 2. Clonar o projeto

```bash
git clone <url-do-repositorio>
cd tdah-organizer
```

### 3. Instalar dependências do frontend

```bash
cd frontend
npm install
cd ..
```

### 4. Executar em modo de desenvolvimento

```bash
wails dev
```

### 5. Compilar para produção

```bash
wails build
```

O executável será gerado em `build/bin/`.

## Estrutura do Projeto

```
tdah-organizer/
├── frontend/               # Frontend Svelte
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/  # Componentes reutilizáveis
│   │   │   ├── modules/     # Módulos do app
│   │   │   │   └── ideias/
│   │   │   │       ├── IdeiasModule.svelte
│   │   │   │       └── nodes/
│   │   │   │           ├── TextNode.svelte
│   │   │   │           ├── LinkNode.svelte
│   │   │   │           ├── ImageNode.svelte
│   │   │   │           └── GroupNode.svelte
│   │   │   ├── stores/      # Svelte stores
│   │   │   └── types/       # TypeScript types
│   │   └── App.svelte
│   └── package.json
├── internal/
│   ├── app/                # Lógica principal da app
│   └── handlers/           # Handlers do backend
├── main.go                 # Entry point
└── wails.json             # Configuração Wails
```

## Como Usar

### Adicionando Nós
1. Clique nos botões na barra de ferramentas para adicionar diferentes tipos de nós
2. Para imagens, selecione um arquivo do seu computador

### Editando Nós
- **Duplo clique** em qualquer nó para editar
- Pressione **Ctrl+Enter** para salvar
- Pressione **Escape** para cancelar

### Conectando Nós
- Arraste a partir das **bolinhas** (handles) nos cantos dos nós
- Solte em outro nó para criar uma conexão

### Usando Grupos
- Adicione um nó do tipo "Grupo"
- Arraste outros nós para dentro do grupo
- Redimensione o grupo para incluir mais nós
- Arraste um nó para fora para desagrupar

### Excluindo
- Selecione um nó ou conexão e pressione **Delete**
- Nós de imagem excluídos também removem o arquivo da pasta assets

## Personalização

### Adicionar Novos Módulos

1. Crie um novo componente em `frontend/src/lib/modules/`
2. Registre o módulo no `App.svelte`:

```typescript
const modulos: Modulo[] = [
  {
    id: 'novo-modulo',
    nome: 'NOVO MÓDULO',
    icone: '📦',
    descricao: 'Descrição do módulo',
    component: NovoModuloModule
  }
];
```

3. O botão aparecerá automaticamente no painel lateral

## Tecnologias Utilizadas

- **Backend**: Go + Wails v2
- **Frontend**: Svelte 4 + TypeScript
- **UI Components**: SvelteFlow (canvas interativo)
- **Styling**: CSS customizado com variáveis CSS

## Licença

MIT

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

Desenvolvido com 💙 para a comunidade TDAH
