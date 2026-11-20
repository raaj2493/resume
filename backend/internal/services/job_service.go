package services

import (
	"context"
	"errors"
	"strings"

	"github.com/raaj2493/portfolio-ai-backend/internal/clients"
	"github.com/raaj2493/portfolio-ai-backend/internal/models"
)

const maxJobDescChars = 20000

// JobService handles job description parsing and candidate matching via the Python engine.
type JobService struct {
	py *clients.PythonEngineClient
}

// NewJobService creates a new JobService.
func NewJobService(py *clients.PythonEngineClient) *JobService {
	return &JobService{py: py}
}

// Analyze validates the job description and delegates parsing + matching to the Python engine.
func (s *JobService) Analyze(ctx context.Context, req models.JobAnalyzeRequest) (*models.JobAnalyzeResponse, error) {
	jd := strings.TrimSpace(req.JobDescription)
	if jd == "" {
		return nil, errors.New("job_description is required")
	}
	if len(jd) < 20 {
		return nil, errors.New("job_description is too short to analyze")
	}
	if len(jd) > maxJobDescChars {
		return nil, errors.New("job_description exceeds maximum allowed length")
	}
	return s.py.AnalyzeJob(ctx, models.JobAnalyzeRequest{JobDescription: jd})
}
