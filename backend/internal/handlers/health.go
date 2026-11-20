package handlers

import (
	"net/http"

	"github.com/raaj2493/portfolio-ai-backend/internal/clients"
	"github.com/raaj2493/portfolio-ai-backend/internal/models"
)

// HealthHandler handles GET /api/v1/health.
type HealthHandler struct {
	py *clients.PythonEngineClient
}

// NewHealthHandler creates a HealthHandler.
func NewHealthHandler(py *clients.PythonEngineClient) *HealthHandler {
	return &HealthHandler{py: py}
}

// Handle checks Go server health and probes the internal Python AI engine.
func (h *HealthHandler) Handle(w http.ResponseWriter, r *http.Request) {
	pyHealth, err := h.py.Health(r.Context())
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, models.HealthResponse{
			Status:  "degraded",
			Service: "go-api",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.HealthResponse{
		Status:       "ok",
		Service:      "go-api",
		PythonEngine: pyHealth,
	})
}
