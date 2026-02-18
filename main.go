package main

import (
	"context"
	"embed"
	"net/http"
	"os"
	"path/filepath"

	"github.com/user/tdah-organizer/internal/app"
	"github.com/user/tdah-organizer/internal/handlers"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Criar pasta assets se não existir
	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exeDir := filepath.Dir(exePath)
	assetsDir := filepath.Join(exeDir, "assets")

	if _, err := os.Stat(assetsDir); os.IsNotExist(err) {
		os.MkdirAll(assetsDir, 0755)
	}

	// Criar pasta init dentro de assets se não existir
	initDir := filepath.Join(assetsDir, "init")
	if _, err := os.Stat(initDir); os.IsNotExist(err) {
		os.MkdirAll(initDir, 0755)
	}

	// Criar pasta img dentro de assets se não existir
	imgDir := filepath.Join(assetsDir, "img")
	if _, err := os.Stat(imgDir); os.IsNotExist(err) {
		os.MkdirAll(imgDir, 0755)
	}

	// Criar aplicação
	appInstance := app.NewApp(assetsDir)

	// Criar handlers
	ideiasHandler := handlers.NewIdeiasHandler(assetsDir)
	linksHandler := handlers.NewLinksHandler(assetsDir)
	planejamentoHandler := handlers.NewPlanejamentoHandler(assetsDir)
	passosHandler := handlers.NewPassosHandler(assetsDir)
	calendarioHandler := handlers.NewCalendarioHandler(assetsDir)
	objetivosHandler := handlers.NewObjetivosHandler(assetsDir)
	backupHandler := handlers.NewBackupHandler(assetsDir)

	err = wails.Run(&options.App{
		Title:     "Organizador TDAH Pro",
		Width:     1400,
		Height:    900,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
			// Adicionar handler para servir imagens da pasta assets
			Middleware: func(next http.Handler) http.Handler {
				return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					// Verificar se é uma requisição de imagem
					if len(r.URL.Path) > 8 && r.URL.Path[:8] == "/assets/" {
						filename := r.URL.Path[8:]
						filePath := filepath.Join(assetsDir, filename)

						// Verificar se arquivo existe
						if _, err := os.Stat(filePath); err == nil {
							// Servir o arquivo
							http.ServeFile(w, r, filePath)
							return
						}
					}

					// Continuar com o handler padrão
					next.ServeHTTP(w, r)
				})
			},
		},
		BackgroundColour: &options.RGBA{R: 15, G: 23, B: 42, A: 1},
		OnStartup: func(ctx context.Context) {
			appInstance.Startup(ctx)
			ideiasHandler.Startup(ctx)
			linksHandler.Startup(ctx)
			planejamentoHandler.Startup(ctx)
			passosHandler.Startup(ctx)
			calendarioHandler.Startup(ctx)
			objetivosHandler.Startup(ctx)
			backupHandler.Startup(ctx)
		},
		Bind: []interface{}{
			appInstance,
			ideiasHandler,
			linksHandler,
			planejamentoHandler,
			passosHandler,
			calendarioHandler,
			objetivosHandler,
			backupHandler,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
