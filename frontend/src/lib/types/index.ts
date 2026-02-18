export interface Modulo {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  component: any;
}

export interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  width?: number;
  height?: number;
  parent?: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface CanvasData {
  nodes: NodeData[];
  edges: EdgeData[];
}
