package handlers

import (
	"net/http"

	"github.com/raaj2493/portfolio-ai-backend/internal/clients"
)

// CandidateHandler handles GET /api/v1/candidate.
type CandidateHandler struct {
	py *clients.PythonEngineClient
}

// NewCandidateHandler creates a CandidateHandler.
func NewCandidateHandler(py *clients.PythonEngineClient) *CandidateHandler {
	return &CandidateHandler{py: py}
}

// Handle returns the candidate profile loaded by the Python engine.
func (h *CandidateHandler) Handle(w http.ResponseWriter, r *http.Request) {
	raw, err := h.py.GetCandidate(r.Context())
	if err != nil {
		writeError(w, http.StatusBadGateway, "unable to load candidate profile")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}
