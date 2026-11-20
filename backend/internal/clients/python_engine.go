package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/raaj2493/portfolio-ai-backend/internal/models"
)

// PythonEngineClient communicates with the internal Python AI HTTP adapter.
type PythonEngineClient struct {
	baseURL    string
	httpClient *http.Client
	streamHTTP *http.Client
}

// NewPythonEngineClient initializes a client for the internal Python service.
func NewPythonEngineClient(baseURL string, timeout time.Duration) *PythonEngineClient {
	return &PythonEngineClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
		// Streaming responses rely on request context cancellation rather than a fixed client timeout.
		streamHTTP: &http.Client{
			Timeout: 0,
		},
	}
}

// Health checks the internal Python AI adapter health endpoint.
func (c *PythonEngineClient) Health(ctx context.Context) (json.RawMessage, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/internal/health", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("python engine health status %d: %s", resp.StatusCode, string(body))
	}
	return json.RawMessage(body), nil
}

// GetCandidate fetches the candidate profile JSON from the Python engine.
func (c *PythonEngineClient) GetCandidate(ctx context.Context) (json.RawMessage, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/internal/candidate", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, extractError(resp.StatusCode, body)
	}
	return json.RawMessage(body), nil
}

// Chat sends a non-streaming chat request to the Python engine.
func (c *PythonEngineClient) Chat(ctx context.Context, payload models.ChatRequest) (*models.ChatResponse, error) {
	var out models.ChatResponse
	if err := c.postJSON(ctx, "/internal/chat", payload, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ChatStream opens a streaming SSE response from the Python engine. Caller must close resp.Body.
func (c *PythonEngineClient) ChatStream(ctx context.Context, payload models.ChatRequest) (*http.Response, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/internal/chat/stream", bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")

	resp, err := c.streamHTTP.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		defer resp.Body.Close()
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		return nil, extractError(resp.StatusCode, body)
	}
	return resp, nil
}

// AnalyzeJob forwards a job description to the Python engine for parsing and matching.
func (c *PythonEngineClient) AnalyzeJob(ctx context.Context, payload models.JobAnalyzeRequest) (*models.JobAnalyzeResponse, error) {
	var out models.JobAnalyzeResponse
	if err := c.postJSON(ctx, "/internal/jobs/analyze", payload, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ResetConversation clears conversation memory in the Python engine.
func (c *PythonEngineClient) ResetConversation(ctx context.Context, payload models.ResetRequest) (*models.ResetResponse, error) {
	var out models.ResetResponse
	if err := c.postJSON(ctx, "/internal/conversations/reset", payload, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *PythonEngineClient) postJSON(ctx context.Context, path string, in any, out any) error {
	raw, err := json.Marshal(in)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return extractError(resp.StatusCode, body)
	}
	if out != nil {
		if err := json.Unmarshal(body, out); err != nil {
			return fmt.Errorf("invalid json from python engine: %w", err)
		}
	}
	return nil
}

func extractError(status int, body []byte) error {
	var errPayload struct {
		Detail string `json:"detail"`
		Error  string `json:"error"`
	}
	if json.Unmarshal(body, &errPayload) == nil {
		if errPayload.Detail != "" {
			return fmt.Errorf("upstream (%d): %s", status, errPayload.Detail)
		}
		if errPayload.Error != "" {
			return fmt.Errorf("upstream (%d): %s", status, errPayload.Error)
		}
	}
	return fmt.Errorf("upstream error (%d)", status)
}
