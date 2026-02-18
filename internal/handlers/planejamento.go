package handlers

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
)

// PlanejamentoHandler gerencia as operações do módulo de planejamento Kanban
type PlanejamentoHandler struct {
	ctx       context.Context
	assetsDir string
	dataFile  string
}

// Tarefa representa uma tarefa no quadro Kanban
type Tarefa struct {
	ID        string `json:"id"`
	Titulo    string `json:"titulo"`
	Descricao string `json:"descricao"`
	Status    string `json:"status"` // "objetivo", "fazendo", "feito"
	CreatedAt string `json:"createdAt"`
}

// QuadroKanban representa todo o quadro com as 3 colunas
type QuadroKanban struct {
	Objetivo []Tarefa `json:"objetivo"`
	Fazendo  []Tarefa `json:"fazendo"`
	Feito    []Tarefa `json:"feito"`
}

// NewPlanejamentoHandler cria um novo handler
func NewPlanejamentoHandler(assetsDir string) *PlanejamentoHandler {
	initDir := filepath.Join(assetsDir, "init")
	return &PlanejamentoHandler{
		assetsDir: assetsDir,
		dataFile:  filepath.Join(initDir, "planejamento_data.json"),
	}
}

// Startup é chamado quando o app inicia
func (h *PlanejamentoHandler) Startup(ctx context.Context) {
	h.ctx = ctx
}

// SalvarQuadro salva o quadro Kanban completo
func (h *PlanejamentoHandler) SalvarQuadro(quadro QuadroKanban) error {
	// Garantir colunas não nulas antes de salvar
	h.garantirColunas(&quadro)
	return h.salvarQuadroInterno(quadro)
}

// CarregarQuadro carrega o quadro Kanban
func (h *PlanejamentoHandler) CarregarQuadro() (QuadroKanban, error) {
	var quadro QuadroKanban

	// Garantir que a pasta init existe
	initDir := filepath.Join(h.assetsDir, "init")
	if err := os.MkdirAll(initDir, 0755); err != nil {
		return h.quadroVazio(), err
	}

	// Verificar se arquivo existe
	if _, err := os.Stat(h.dataFile); os.IsNotExist(err) {
		// Arquivo não existe - retornar quadro vazio (app começa do zero)
		return h.quadroVazio(), nil
	}

	// Carregar dados
	jsonData, err := os.ReadFile(h.dataFile)
	if err != nil {
		return h.quadroVazio(), err
	}

	err = json.Unmarshal(jsonData, &quadro)
	// Garante que as 3 colunas existam mesmo se o JSON estiver incompleto
	h.garantirColunas(&quadro)
	return quadro, err
}

// quadroVazio retorna um quadro Kanban vazio
func (h *PlanejamentoHandler) quadroVazio() QuadroKanban {
	return QuadroKanban{
		Objetivo: []Tarefa{},
		Fazendo:  []Tarefa{},
		Feito:    []Tarefa{},
	}
}

// salvarQuadroInterno salva dados do quadro (usado internamente)
func (h *PlanejamentoHandler) salvarQuadroInterno(quadro QuadroKanban) error {
	jsonData, err := json.MarshalIndent(quadro, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(h.dataFile, jsonData, 0644)
}

// garantirColunas garante que as 3 colunas existam
func (h *PlanejamentoHandler) garantirColunas(quadro *QuadroKanban) {
	if quadro.Objetivo == nil {
		quadro.Objetivo = []Tarefa{}
	}
	if quadro.Fazendo == nil {
		quadro.Fazendo = []Tarefa{}
	}
	if quadro.Feito == nil {
		quadro.Feito = []Tarefa{}
	}
}

// AdicionarTarefa adiciona uma nova tarefa
func (h *PlanejamentoHandler) AdicionarTarefa(tarefa Tarefa) error {
	quadro, err := h.CarregarQuadro()
	if err != nil {
		return err
	}

	switch tarefa.Status {
	case "objetivo":
		quadro.Objetivo = append(quadro.Objetivo, tarefa)
	case "fazendo":
		quadro.Fazendo = append(quadro.Fazendo, tarefa)
	case "feito":
		quadro.Feito = append(quadro.Feito, tarefa)
	}

	return h.SalvarQuadro(quadro)
}

// MoverTarefa move uma tarefa entre colunas
func (h *PlanejamentoHandler) MoverTarefa(tarefaID string, statusOrigem string, statusDestino string) error {
	quadro, err := h.CarregarQuadro()
	if err != nil {
		return err
	}

	// Encontrar e remover da origem
	var tarefaEncontrada *Tarefa
	var listaOrigem *[]Tarefa

	switch statusOrigem {
	case "objetivo":
		listaOrigem = &quadro.Objetivo
	case "fazendo":
		listaOrigem = &quadro.Fazendo
	case "feito":
		listaOrigem = &quadro.Feito
	}

	for i, t := range *listaOrigem {
		if t.ID == tarefaID {
			tarefaEncontrada = &t
			*listaOrigem = append((*listaOrigem)[:i], (*listaOrigem)[i+1:]...)
			break
		}
	}

	if tarefaEncontrada == nil {
		return nil // Tarefa não encontrada
	}

	// Adicionar ao destino
	tarefaEncontrada.Status = statusDestino
	switch statusDestino {
	case "objetivo":
		quadro.Objetivo = append(quadro.Objetivo, *tarefaEncontrada)
	case "fazendo":
		quadro.Fazendo = append(quadro.Fazendo, *tarefaEncontrada)
	case "feito":
		quadro.Feito = append(quadro.Feito, *tarefaEncontrada)
	}

	return h.SalvarQuadro(quadro)
}

// DeletarTarefa remove uma tarefa pelo ID e status
func (h *PlanejamentoHandler) DeletarTarefa(tarefaID string, status string) error {
	quadro, err := h.CarregarQuadro()
	if err != nil {
		return err
	}

	var lista *[]Tarefa
	switch status {
	case "objetivo":
		lista = &quadro.Objetivo
	case "fazendo":
		lista = &quadro.Fazendo
	case "feito":
		lista = &quadro.Feito
	}

	var filtered []Tarefa
	for _, t := range *lista {
		if t.ID != tarefaID {
			filtered = append(filtered, t)
		}
	}
	*lista = filtered

	return h.SalvarQuadro(quadro)
}

// AtualizarTarefa atualiza uma tarefa existente
func (h *PlanejamentoHandler) AtualizarTarefa(tarefa Tarefa, status string) error {
	quadro, err := h.CarregarQuadro()
	if err != nil {
		return err
	}

	var lista *[]Tarefa
	switch status {
	case "objetivo":
		lista = &quadro.Objetivo
	case "fazendo":
		lista = &quadro.Fazendo
	case "feito":
		lista = &quadro.Feito
	}

	for i, t := range *lista {
		if t.ID == tarefa.ID {
			(*lista)[i] = tarefa
			break
		}
	}

	return h.SalvarQuadro(quadro)
}
