export namespace handlers {
	
	export class BackupInfo {
	    nome: string;
	    data: string;
	    label: string;
	
	    static createFrom(source: any = {}) {
	        return new BackupInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nome = source["nome"];
	        this.data = source["data"];
	        this.label = source["label"];
	    }
	}
	export class EdgeData {
	    id: string;
	    source: string;
	    target: string;
	    type?: string;
	    sourceHandle?: string;
	    targetHandle?: string;
	    animated?: boolean;
	    style?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new EdgeData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.source = source["source"];
	        this.target = source["target"];
	        this.type = source["type"];
	        this.sourceHandle = source["sourceHandle"];
	        this.targetHandle = source["targetHandle"];
	        this.animated = source["animated"];
	        this.style = source["style"];
	    }
	}
	export class NodeData {
	    id: string;
	    type: string;
	    position: Record<string, number>;
	    data: Record<string, any>;
	    width?: number;
	    height?: number;
	    parent?: string;
	    parentId?: string;
	
	    static createFrom(source: any = {}) {
	        return new NodeData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.position = source["position"];
	        this.data = source["data"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.parent = source["parent"];
	        this.parentId = source["parentId"];
	    }
	}
	export class CanvasData {
	    nodes: NodeData[];
	    edges: EdgeData[];
	
	    static createFrom(source: any = {}) {
	        return new CanvasData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodes = this.convertValues(source["nodes"], NodeData);
	        this.edges = this.convertValues(source["edges"], EdgeData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Evento {
	    id: string;
	    titulo: string;
	    data: string;
	    hora: string;
	    descricao: string;
	    cor: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Evento(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.data = source["data"];
	        this.hora = source["hora"];
	        this.descricao = source["descricao"];
	        this.cor = source["cor"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class Link {
	    id: string;
	    title: string;
	    url: string;
	    description?: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Link(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.url = source["url"];
	        this.description = source["description"];
	        this.createdAt = source["createdAt"];
	    }
	}
	
	export class Objetivo {
	    id: string;
	    titulo: string;
	    prazo: string;
	    progresso: number;
	    concluido: boolean;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Objetivo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.prazo = source["prazo"];
	        this.progresso = source["progresso"];
	        this.concluido = source["concluido"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class Passo {
	    id: string;
	    descricao: string;
	    concluido: boolean;
	    ordem: number;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Passo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.descricao = source["descricao"];
	        this.concluido = source["concluido"];
	        this.ordem = source["ordem"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class Tarefa {
	    id: string;
	    titulo: string;
	    descricao: string;
	    status: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Tarefa(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.descricao = source["descricao"];
	        this.status = source["status"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class QuadroKanban {
	    objetivo: Tarefa[];
	    fazendo: Tarefa[];
	    feito: Tarefa[];
	
	    static createFrom(source: any = {}) {
	        return new QuadroKanban(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.objetivo = this.convertValues(source["objetivo"], Tarefa);
	        this.fazendo = this.convertValues(source["fazendo"], Tarefa);
	        this.feito = this.convertValues(source["feito"], Tarefa);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

