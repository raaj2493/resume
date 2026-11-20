package main

import (
	"log"
	"net/http"
	"slices"

	"github.com/raaj2493/portfolio-ai-backend/internal/clients"
	"github.com/raaj2493/portfolio-ai-backend/internal/config"
	"github.com/raaj2493/portfolio-ai-backend/internal/handlers"
	"github.com/raaj2493/portfolio-ai-backend/internal/services"
)

func main() {
	cfg := config.Load()

	pyClient := clients.NewPythonEngineClient(cfg.PythonEngineURL, cfg.RequestTimeout)
	chatSvc := services.NewChatService(pyClient)
	jobSvc := services.NewJobService(pyClient)

	healthHandler := handlers.NewHealthHandler(pyClient)
	candidateHandler := handlers.NewCandidateHandler(pyClient)
	chatHandler := handlers.NewChatHandler(chatSvc, cfg.MaxBodyBytes)
	jobsHandler := handlers.NewJobsHandler(jobSvc, cfg.MaxBodyBytes)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", healthHandler.Handle)
	mux.HandleFunc("GET /api/v1/candidate", candidateHandler.Handle)
	mux.HandleFunc("POST /api/v1/chat", chatHandler.HandleChat)
	mux.HandleFunc("POST /api/v1/chat/stream", chatHandler.HandleStream)
	mux.HandleFunc("POST /api/v1/jobs/analyze", jobsHandler.HandleAnalyze)
	mux.HandleFunc("POST /api/v1/conversations/reset", chatHandler.HandleReset)

	handler := withCORS(cfg.AllowedOrigins, mux)

	addr := ":" + cfg.Port
	log.Printf("Go API server listening on %s (python engine: %s)", addr, cfg.PythonEngineURL)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func withCORS(allowedOrigins []string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && slices.Contains(allowedOrigins, origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
			w.Header().Set("Access-Control-Expose-Headers", "X-Conversation-Id")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
