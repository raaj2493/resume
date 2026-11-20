package handlers

import (
	"net/http"

	"github.com/raaj2493/portfolio-ai-backend/internal/models"
	"github.com/raaj2493/portfolio-ai-backend/internal/services"
)

// JobsHandler handles POST /api/v1/jobs/analyze.
type JobsHandler struct {
	svc      *services.JobService
	maxBytes int64
}

// NewJobsHandler creates a JobsHandler.
func NewJobsHandler(svc *services.JobService, maxBytes int64) *JobsHandler {
	return &JobsHandler{svc: svc, maxBytes: maxBytes}
}

// HandleAnalyze parses a job description and evaluates candidate compatibility via Python.
func (h *JobsHandler) HandleAnalyze(w http.ResponseWriter, r *http.Request) {
	var req models.JobAnalyzeRequest
	if err := decodeJSON(w, r, h.maxBytes, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	resp, err := h.svc.Analyze(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, resp)
}
