package models

import "encoding/json"

// ChatRequest represents an incoming chat prompt from the portfolio frontend.
type ChatRequest struct {
	ConversationID string `json:"conversation_id,omitempty"`
	Message        string `json:"message"`
}

// ChatResponse represents a non-streaming chat reply.
type ChatResponse struct {
	ConversationID string `json:"conversation_id"`
	Reply          string `json:"reply"`
}

// ResetRequest represents a request to clear a conversation's memory.
type ResetRequest struct {
	ConversationID string `json:"conversation_id"`
}

// ResetResponse confirms conversation reset.
type ResetResponse struct {
	ConversationID string `json:"conversation_id"`
	Status         string `json:"status"`
}

// JobAnalyzeRequest represents a job description submitted for analysis.
type JobAnalyzeRequest struct {
	JobDescription string `json:"job_description"`
}

// JobDescription mirrors the Pydantic JobDescription schema from 01-AI-HIREME/schema.py.
type JobDescription struct {
	JobTitle           string   `json:"job_title"`
	RequiredExperience string   `json:"required_experience"`
	RequiredSkills     []string `json:"required_skills"`
	PreferredSkills    []string `json:"preferred_skills"`
	Responsibilities   []string `json:"responsibilities"`
	Qualifications     []string `json:"qualifications"`
}

// RelevantProject mirrors the Pydantic RelevantProject schema.
type RelevantProject struct {
	ProjectName string `json:"project_name"`
	Reason      string `json:"reason"`
}

// CandidateJobMatch mirrors the Pydantic CandidateJobMatch schema.
type CandidateJobMatch struct {
	MatchingSkills         []string          `json:"matching_skills"`
	MissingRequiredSkills  []string          `json:"missing_required_skills"`
	MatchingPreferredSkills []string         `json:"matching_preferred_skills"`
	MissingPreferredSkills []string          `json:"missing_preferred_skills"`
	RelevantProjects       []RelevantProject `json:"relevant_projects"`
	Strengths              []string          `json:"strengths"`
	Gaps                   []string          `json:"gaps"`
	OverallAssessment      string            `json:"overall_assessment"`
}

// JobAnalyzeResponse combines the parsed job description and candidate match report.
type JobAnalyzeResponse struct {
	ParsedJobDescription JobDescription    `json:"parsed_job_description"`
	MatchReport          CandidateJobMatch `json:"match_report"`
}

// ErrorResponse is a standard JSON error envelope.
type ErrorResponse struct {
	Error string `json:"error"`
}

// HealthResponse reports Go and Python engine readiness.
type HealthResponse struct {
	Status       string          `json:"status"`
	Service      string          `json:"service"`
	PythonEngine json.RawMessage `json:"python_engine,omitempty"`
}
