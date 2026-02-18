package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

// IdeiasHandler gerencia as operações do módulo de ideias
type IdeiasHandler struct {
	ctx       context.Context
	assetsDir string
	dataFile  string
}

// NodeData representa um nó no canvas
type NodeData struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"`
	Position map[string]float64     `json:"position"`
	Data     map[string]interface{} `json:"data"`
	Width    float64                `json:"width,omitempty"`
	Height   float64                `json:"height,omitempty"`
	Parent   string                 `json:"parent,omitempty"`
	ParentId string                 `json:"parentId,omitempty"`
}

// EdgeData representa uma conexão entre nós
type EdgeData struct {
	ID           string                 `json:"id"`
	Source       string                 `json:"source"`
	Target       string                 `json:"target"`
	Type         string                 `json:"type,omitempty"`
	SourceHandle string                 `json:"sourceHandle,omitempty"`
	TargetHandle string                 `json:"targetHandle,omitempty"`
	Animated     bool                   `json:"animated,omitempty"`
	Style        map[string]interface{} `json:"style,omitempty"`
}

// CanvasData representa todos os dados do canvas
type CanvasData struct {
	Nodes []NodeData `json:"nodes"`
	Edges []EdgeData `json:"edges"`
}

// NewIdeiasHandler cria um novo handler
func NewIdeiasHandler(assetsDir string) *IdeiasHandler {
	initDir := filepath.Join(assetsDir, "init")
	return &IdeiasHandler{
		assetsDir: assetsDir,
		dataFile:  filepath.Join(initDir, "ideias_data.json"),
	}
}

// Startup é chamado quando o app inicia
func (h *IdeiasHandler) Startup(ctx context.Context) {
	h.ctx = ctx
}

// SalvarCanvas salva o estado atual do canvas
func (h *IdeiasHandler) SalvarCanvas(nodes []NodeData, edges []EdgeData) error {
	// Normalizar campos parent/parentId
	for i := range nodes {
		node := &nodes[i]
		if node.ParentId == "" && node.Parent != "" {
			node.ParentId = node.Parent
		}
	}
	data := CanvasData{
		Nodes: nodes,
		Edges: edges,
	}

	return h.salvarCanvasData(data)
}

// CarregarCanvas carrega o estado salvo do canvas
func (h *IdeiasHandler) CarregarCanvas() (CanvasData, error) {
	var data CanvasData

	// Garantir que a pasta init existe
	initDir := filepath.Join(h.assetsDir, "init")
	if err := os.MkdirAll(initDir, 0755); err != nil {
		return CanvasData{Nodes: []NodeData{}, Edges: []EdgeData{}}, err
	}

	// Verificar se arquivo existe
	if _, err := os.Stat(h.dataFile); os.IsNotExist(err) {
		// Arquivo não existe - retornar dados vazios (app começa do zero)
		return CanvasData{Nodes: []NodeData{}, Edges: []EdgeData{}}, nil
	}

	// Carregar dados
	jsonData, err := os.ReadFile(h.dataFile)
	if err != nil {
		return CanvasData{Nodes: []NodeData{}, Edges: []EdgeData{}}, err
	}

	err = json.Unmarshal(jsonData, &data)
	// Garantir arrays não nulos
	if data.Nodes == nil {
		data.Nodes = []NodeData{}
	}
	if data.Edges == nil {
		data.Edges = []EdgeData{}
	}
	// Normalizar campos parent/parentId
	h.normalizarCampos(&data)
	return data, err
}

// salvarCanvasData salva dados do canvas (usado internamente)
func (h *IdeiasHandler) salvarCanvasData(data CanvasData) error {
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(h.dataFile, jsonData, 0644)
}

// normalizarCampos normaliza campos parent/parentId
func (h *IdeiasHandler) normalizarCampos(data *CanvasData) {
	for i := range data.Nodes {
		node := &data.Nodes[i]
		if node.Parent == "" && node.ParentId != "" {
			node.Parent = node.ParentId
		}
		if node.ParentId == "" && node.Parent != "" {
			node.ParentId = node.Parent
		}
	}
}

// UploadImagem salva uma imagem na pasta assets/img
func (h *IdeiasHandler) UploadImagem(filename string, data []byte, nodeID string) (string, error) {
	// Criar pasta img se não existir
	imgDir := filepath.Join(h.assetsDir, "img")
	if err := os.MkdirAll(imgDir, 0755); err != nil {
		return "", err
	}

	// Gerar nome único para o arquivo
	ext := filepath.Ext(filename)
	newFilename := fmt.Sprintf("%s_%s%s", nodeID, uuid.New().String()[:8], ext)
	filePath := filepath.Join(imgDir, newFilename)

	// Salvar arquivo
	err := os.WriteFile(filePath, data, 0644)
	if err != nil {
		return "", err
	}

	return newFilename, nil
}

// DeletarImagem remove uma imagem da pasta assets/img
func (h *IdeiasHandler) DeletarImagem(filename string) error {
	imgDir := filepath.Join(h.assetsDir, "img")
	filePath := filepath.Join(imgDir, filename)
	return os.Remove(filePath)
}

// LimparImagensOrfas remove imagens não referenciadas
func (h *IdeiasHandler) LimparImagensOrfas(nodeIDs []string) error {
	// Obter lista de imagens referenciadas
	imagensReferenciadas := make(map[string]bool)

	data, err := h.CarregarCanvas()
	if err != nil {
		return err
	}

	for _, node := range data.Nodes {
		if node.Type == "image" && node.Data["imageFile"] != nil {
			if filename, ok := node.Data["imageFile"].(string); ok {
				imagensReferenciadas[filename] = true
			}
		}
	}

	// Listar arquivos na pasta assets/img
	imgDir := filepath.Join(h.assetsDir, "img")
	entries, err := os.ReadDir(imgDir)
	if err != nil {
		// Se a pasta não existe, não há o que limpar
		return nil
	}

	// Remover imagens não referenciadas
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		// Verificar se é uma imagem
		ext := strings.ToLower(filepath.Ext(name))
		if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
			if !imagensReferenciadas[name] {
				// Verificar se o arquivo pertence a um nó existente
				isOrfa := true
				for _, nodeID := range nodeIDs {
					if strings.HasPrefix(name, nodeID+"_") {
						isOrfa = false
						break
					}
				}

				if isOrfa {
					os.Remove(filepath.Join(imgDir, name))
				}
			}
		}
	}

	return nil
}
