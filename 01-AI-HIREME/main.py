
import json
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq
from pydantic import ValidationError

from load_ashutosh import load_candidate
from job_description import parse_job_description
from matching import match_candidate_to_job
from schema import JobDescription, CandidateJobMatch


# --------------------------------------------------
# 1. LOAD ENVIRONMENT AND INITIALIZE GROQ
# --------------------------------------------------

project_root = Path(__file__).resolve().parents[1]
env_path = project_root / ".env"

load_dotenv(env_path)

client = Groq()


# --------------------------------------------------
# 2. LOAD CANDIDATE PROFILE
# --------------------------------------------------

candidate = load_candidate()

if candidate is None:
    raise RuntimeError("Unable to load candidate profile.")


# --------------------------------------------------
# 3. SYSTEM PROMPT
# --------------------------------------------------

system_prompt = """
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


# --------------------------------------------------
# 4. CONVERSATION MEMORY
# --------------------------------------------------

messages = [
    {
        "role": "system",
        "content": system_prompt
    },
    {
        "role": "system",
        "content": (
            "CANDIDATE PROFILE:\n"
            + json.dumps(candidate, indent=2)
        )
    }
]


# --------------------------------------------------
# 5. APPLICATION HEADER
# --------------------------------------------------

print("\n" + "=" * 55)
print("          AI CANDIDATE ASSISTANT")
print("=" * 55)

print(f"\nCandidate: {candidate['personal_info']['name']}")

print("\nCommands:")
print("  jd     - Analyze a job description")
print("  reset  - Reset conversation")
print("  exit   - Exit application")

print("\nYou can now start asking recruiter questions.")
print("-" * 55)


# --------------------------------------------------
# 6. MAIN CONVERSATION LOOP
# --------------------------------------------------

while True:

    user_input = input("\nRecruiter: ").strip()

    if not user_input:
        continue

    command = user_input.lower()


    # --------------------------------------------------
    # EXIT
    # --------------------------------------------------

    if command == "exit":
        print("\nExiting AI Candidate Assistant. Goodbye!")
        break


    # --------------------------------------------------
    # RESET CONVERSATION
    # --------------------------------------------------

    if command == "reset":
        messages = messages[:2]
        print("\nConversation has been reset.")
        continue


    # --------------------------------------------------
    # JOB DESCRIPTION ANALYSIS
    # --------------------------------------------------

    if command == "jd":

        print("\nPaste the job description below.")
        print("Type END on a new line when finished.\n")

        job_description_lines = []

        while True:
            line = input()

            if line.strip().upper() == "END":
                break

            job_description_lines.append(line)

        job_description = "\n".join(job_description_lines).strip()

        if not job_description:
            print("\nNo job description provided.")
            continue

        try:

            # Parse job description using Groq
            print("\nParsing job description...")

            parsed_jd_data = parse_job_description(
                client,
                job_description
            )

            # Validate parsed JD with Pydantic
            parsed_jd = JobDescription.model_validate(
                parsed_jd_data
            )

            print("\nJob description parsed successfully.")

            # Match candidate with parsed JD
            print("\nAnalyzing candidate-job compatibility...")

            match_data = match_candidate_to_job(
                client,
                candidate,
                parsed_jd.model_dump()
            )

            # Validate matching result with Pydantic
            match_report = CandidateJobMatch.model_validate(
                match_data
            )

            print("\n" + "=" * 55)
            print("           CANDIDATE MATCH REPORT")
            print("=" * 55)

            print(match_report.model_dump_json(indent=4))

            print("\n" + "=" * 55)

        except ValidationError as error:
            print("\nStructured output validation failed:")
            print(error)

        except Exception as error:
            print(f"\nJob description analysis failed: {error}")

        continue


    # --------------------------------------------------
    # NORMAL CONVERSATION WITH STREAMING
    # --------------------------------------------------

    messages.append({
        "role": "user",
        "content": user_input
    })

    print("\nAssistant: ", end="", flush=True)

    answer = ""

    try:

        stream = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            stream=True
        )

        for chunk in stream:

            if not chunk.choices:
                continue

            content = chunk.choices[0].delta.content

            if content:
                print(content, end="", flush=True)
                answer += content

        print()

        if answer:
            messages.append({
                "role": "assistant",
                "content": answer
            })

        else:
            print("No response was generated.")

    except Exception as error:
        print(f"\nGroq request failed: {error}")

        # Remove the unanswered user message so the
        # conversation history stays consistent.
        messages.pop()
