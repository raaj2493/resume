package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds runtime configuration for the Go API server.
type Config struct {
	Port            string
	PythonEngineURL string
	AllowedOrigins  []string
	RequestTimeout  time.Duration
	MaxBodyBytes    int64
}

// Load reads configuration from environment variables with safe defaults.
func Load() Config {
	port := getEnv("PORT", "8081")
	pyURL := strings.TrimRight(getEnv("PYTHON_ENGINE_URL", "http://127.0.0.1:8001"), "/")

	rawOrigins := getEnv(
		"ALLOWED_ORIGINS",
		"http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500,http://localhost:8000,http://127.0.0.1:8000,https://ashutoshgiri.vercel.app",
	)
	var origins []string
	for _, o := range strings.Split(rawOrigins, ",") {
		trimmed := strings.TrimSpace(o)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	timeoutSec := getEnvInt("REQUEST_TIMEOUT_SECONDS", 60)
	maxBody := getEnvInt64("MAX_BODY_BYTES", 65536)

	return Config{
		Port:            port,
		PythonEngineURL: pyURL,
		AllowedOrigins:  origins,
		RequestTimeout:  time.Duration(timeoutSec) * time.Second,
		MaxBodyBytes:    maxBody,
	}
}

func getEnv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			return n
		}
	}
	return fallback
}
