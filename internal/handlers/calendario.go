package handlers

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
)

// CalendarioHandler gerencia as operações do módulo de calendário
type CalendarioHandler struct {
	ctx       context.Context
	assetsDir string
	dataFile  string
}

// Evento representa um evento no calendário
type Evento struct {
	ID        string `json:"id"`
	Titulo    string `json:"titulo"`
	Data      string `json:"data"` // Formato: YYYY-MM-DD
	Hora      string `json:"hora"` // Formato: HH:MM
	Descricao string `json:"descricao"`
	Cor       string `json:"cor"` // Cor do evento (hex)
	CreatedAt string `json:"createdAt"`
}

// NewCalendarioHandler cria um novo handler
func NewCalendarioHandler(assetsDir string) *CalendarioHandler {
	initDir := filepath.Join(assetsDir, "init")
	return &CalendarioHandler{
		assetsDir: assetsDir,
		dataFile:  filepath.Join(initDir, "calendario_data.json"),
	}
}

// Startup é chamado quando o app inicia
func (h *CalendarioHandler) Startup(ctx context.Context) {
	h.ctx = ctx
}

// SalvarEventos salva a lista de eventos
func (h *CalendarioHandler) SalvarEventos(eventos []Evento) error {
	return h.salvarEventosInterno(eventos)
}

// CarregarEventos carrega a lista de eventos
func (h *CalendarioHandler) CarregarEventos() ([]Evento, error) {
	// Garantir que a pasta init existe
	initDir := filepath.Join(h.assetsDir, "init")
	if err := os.MkdirAll(initDir, 0755); err != nil {
		return []Evento{}, err
	}

	// Verificar se arquivo existe
	if _, err := os.Stat(h.dataFile); os.IsNotExist(err) {
		// Arquivo não existe - retornar lista vazia (app começa do zero)
		return []Evento{}, nil
	}

	// Carregar dados
	jsonData, err := os.ReadFile(h.dataFile)
	if err != nil {
		return []Evento{}, err
	}

	var eventos []Evento
	err = json.Unmarshal(jsonData, &eventos)
	if eventos == nil {
		eventos = []Evento{}
	}
	return eventos, err
}

// salvarEventosInterno salva lista de eventos (usado internamente)
func (h *CalendarioHandler) salvarEventosInterno(eventos []Evento) error {
	jsonData, err := json.MarshalIndent(eventos, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(h.dataFile, jsonData, 0644)
}

// AdicionarEvento adiciona um novo evento
func (h *CalendarioHandler) AdicionarEvento(evento Evento) error {
	eventos, err := h.CarregarEventos()
	if err != nil {
		return err
	}
	eventos = append(eventos, evento)
	return h.SalvarEventos(eventos)
}

// AtualizarEvento atualiza um evento existente
func (h *CalendarioHandler) AtualizarEvento(updatedEvento Evento) error {
	eventos, err := h.CarregarEventos()
	if err != nil {
		return err
	}

	for i, evento := range eventos {
		if evento.ID == updatedEvento.ID {
			eventos[i] = updatedEvento
			break
		}
	}

	return h.SalvarEventos(eventos)
}

// DeletarEvento remove um evento pelo ID
func (h *CalendarioHandler) DeletarEvento(id string) error {
	eventos, err := h.CarregarEventos()
	if err != nil {
		return err
	}

	var filtered []Evento
	for _, evento := range eventos {
		if evento.ID != id {
			filtered = append(filtered, evento)
		}
	}

	return h.SalvarEventos(filtered)
}
