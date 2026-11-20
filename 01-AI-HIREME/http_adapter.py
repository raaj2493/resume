"""
Thin internal HTTP adapter around the existing 01-AI-HIREME Python AI engine.
Reuses load_candidate, parse_job_description, match_candidate_to_job,
Pydantic schemas, Groq client, and grounding system prompt.
"""

import json
import os
import sys
from collections import OrderedDict
from pathlib import Path
from threading import Lock

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from groq import Groq
from pydantic import BaseModel, Field, ValidationError

# Ensure existing modules in 01-AI-HIREME are importable regardless of cwd
ENGINE_DIR = Path(__file__).resolve().parent
if str(ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(ENGINE_DIR))

from load_ashutosh import load_candidate  # noqa: E402
from job_description import parse_job_description  # noqa: E402
from matching import match_candidate_to_job  # noqa: E402
from schema import JobDescription, CandidateJobMatch  # noqa: E402


# --------------------------------------------------
# 1. ENVIRONMENT & GROQ INITIALIZATION
# --------------------------------------------------

project_root = ENGINE_DIR.parent
env_path = project_root / ".env"
load_dotenv(env_path)

if not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("GROQ_API_KEY is not configured in environment or .env.")

client = Groq()

candidate = load_candidate()
if candidate is None:
    raise RuntimeError("Unable to load candidate profile.")


# --------------------------------------------------
# 2. SYSTEM PROMPT (Preserved from main.py)
# --------------------------------------------------

SYSTEM_PROMPT = """
You are an AI Candidate Assistant representing Ashutosh Giri.

Your purpose is to help recruiters understand the candidate's
background, skills, education, projects, and experience.

You must use the supplied candidate profile as your primary
source of information.

GROUNDING RULES:

1. Never invent skills, qualifications, projects, experience,
   certifications, achievements, or performance metrics.

2. Do not assume expertise just because a technology appears
   in the candidate's skills list.

3. Clearly distinguish completed projects from ongoing projects.

4. Do not present project experience as professional employment.

5. Do not invent years of experience.

6. If information is missing, clearly say that it is not
   available in the candidate profile.

7. You may provide reasonable explanations based on the
   candidate's documented experience, but do not present
   assumptions as verified facts.

8. Be honest about strengths and gaps.

COMMUNICATION:

- Be professional, clear, and concise.
- Answer the recruiter's actual question.
- Avoid unnecessary promotional language.
- Never exaggerate the candidate's abilities.

Your goal is to provide recruiters with an accurate and
balanced understanding of the candidate.
"""

MODEL_NAME = "openai/gpt-oss-120b"
MAX_CONVERSATIONS = 200
MAX_HISTORY_TURNS = 30

_conversations: OrderedDict[str, list[dict[str, str]]] = OrderedDict()
_conv_lock = Lock()


def _base_messages() -> list[dict[str, str]]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": "CANDIDATE PROFILE:\n" + json.dumps(candidate, indent=2)},
    ]


def _get_or_create_messages(conv_id: str) -> list[dict[str, str]]:
    with _conv_lock:
        if conv_id in _conversations:
            _conversations.move_to_end(conv_id)
            return _conversations[conv_id]
        if len(_conversations) >= MAX_CONVERSATIONS:
            _conversations.popitem(last=False)
        msgs = _base_messages()
        _conversations[conv_id] = msgs
        return msgs


def _trim_history(msgs: list[dict[str, str]]) -> None:
    max_len = 2 + MAX_HISTORY_TURNS * 2
    if len(msgs) > max_len:
        del msgs[2 : len(msgs) - MAX_HISTORY_TURNS * 2]


# --------------------------------------------------
# 3. ADAPTER REQUEST / RESPONSE MODELS
# --------------------------------------------------

class ChatRequest(BaseModel):
    conversation_id: str = Field(default="default", min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=4000)


class ResetRequest(BaseModel):
    conversation_id: str = Field(min_length=1, max_length=128)


class JobAnalyzeRequest(BaseModel):
    job_description: str = Field(min_length=20, max_length=20000)


# --------------------------------------------------
# 4. FASTAPI INTERNAL APP
# --------------------------------------------------

app = FastAPI(title="AI-HIREME Internal Adapter", docs_url=None, redoc_url=None)


@app.get("/internal/health")
def health():
    return {
        "status": "ok",
        "engine": "01-AI-HIREME",
        "candidate": candidate.get("personal_info", {}).get("name", "Unknown"),
    }


@app.get("/internal/candidate")
def get_candidate():
    return candidate


@app.post("/internal/conversations/reset")
def reset_conversation(req: ResetRequest):
    with _conv_lock:
        _conversations[req.conversation_id] = _base_messages()
        _conversations.move_to_end(req.conversation_id)
    return {"conversation_id": req.conversation_id, "status": "reset"}


@app.post("/internal/chat")
def chat(req: ChatRequest):
    msgs = _get_or_create_messages(req.conversation_id)
    with _conv_lock:
        msgs.append({"role": "user", "content": req.message})
        snapshot = list(msgs)

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=snapshot,
            stream=False,
        )
        answer = (completion.choices[0].message.content or "").strip()
        if not answer:
            raise RuntimeError("Empty response from Groq")
    except Exception as exc:
        with _conv_lock:
            if msgs and msgs[-1]["role"] == "user":
                msgs.pop()
        raise HTTPException(status_code=502, detail=f"AI generation failed: {exc}")

    with _conv_lock:
        msgs.append({"role": "assistant", "content": answer})
        _trim_history(msgs)

    return {"conversation_id": req.conversation_id, "reply": answer}


@app.post("/internal/chat/stream")
def chat_stream(req: ChatRequest):
    msgs = _get_or_create_messages(req.conversation_id)
    with _conv_lock:
        msgs.append({"role": "user", "content": req.message})
        snapshot = list(msgs)

    def event_generator():
        answer_parts: list[str] = []
        try:
            stream = client.chat.completions.create(
                model=MODEL_NAME,
                messages=snapshot,
                stream=True,
            )
            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta.content
                if delta:
                    answer_parts.append(delta)
                    payload = json.dumps({
                        "conversation_id": req.conversation_id,
                        "delta": delta,
                    })
                    yield f"data: {payload}\n\n"

            full_answer = "".join(answer_parts).strip()
            if full_answer:
                with _conv_lock:
                    msgs.append({"role": "assistant", "content": full_answer})
                    _trim_history(msgs)
            else:
                with _conv_lock:
                    if msgs and msgs[-1]["role"] == "user":
                        msgs.pop()

            done_payload = json.dumps({"conversation_id": req.conversation_id})
            yield f"event: done\ndata: {done_payload}\n\n"
        except Exception as exc:
            with _conv_lock:
                if msgs and msgs[-1]["role"] == "user":
                    msgs.pop()
            err_payload = json.dumps({"error": str(exc)})
            yield f"event: error\ndata: {err_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/internal/jobs/analyze")
def analyze_job(req: JobAnalyzeRequest):
    try:
        parsed_jd_data = parse_job_description(client, req.job_description)
        parsed_jd = JobDescription.model_validate(parsed_jd_data)

        match_data = match_candidate_to_job(client, candidate, parsed_jd.model_dump())
        match_report = CandidateJobMatch.model_validate(match_data)

        return {
            "parsed_job_description": parsed_jd.model_dump(),
            "match_report": match_report.model_dump(),
        }
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail=f"Structured output validation failed: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Job description analysis failed: {exc}")
