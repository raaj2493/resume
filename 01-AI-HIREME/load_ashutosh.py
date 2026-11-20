
import os
import json
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


def load_candidate():
    """Load candidate profile JSON relative to this module's directory."""
    data_path = Path(__file__).resolve().parent / "data" / "ashutosh.json"
    if not data_path.exists():
        return None
    with data_path.open("r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    # ==========================================
    # 1. LOAD ENVIRONMENT VARIABLES
    # ==========================================

    project_root = Path(__file__).resolve().parents[1]
    env_path = project_root / ".env"

    load_dotenv(dotenv_path=env_path)

    if not os.getenv("GROQ_API_KEY"):
        raise ValueError("GROQ_API_KEY not found in environment variables.")


    # ==========================================
    # 2. INITIALIZE GROQ CLIENT
    # ==========================================

    client = Groq()


    # ==========================================
    # 3. LOAD CANDIDATE PROFILE
    # ==========================================

    candidate = load_candidate()

    if candidate is None:
        raise ValueError("Could not load candidate profile.")


    # ==========================================
    # 4. SYSTEM PROMPT
    # ==========================================

    system_prompt = """
    IDENTITY:

    You are an AI Candidate Assistant representing Ashutosh Giri,
    a software engineering candidate.

    ROLE:

    Your responsibility is to help recruiters understand the
    candidate's background, technical skills, education,
    projects, and professional experience.

    KNOWLEDGE SOURCE:

    The candidate profile supplied in the conversation is your
    primary source of information.

    GROUNDING RULES:

    - Use the supplied profile to answer questions.
    - Never invent skills, qualifications, projects, or experience.
    - Never fabricate achievements, certifications, or metrics.
    - Do not exaggerate the candidate's level of expertise.
    - Distinguish completed work from ongoing projects.
    - If information is missing, explicitly acknowledge that
      it is not available in the profile.
    - Do not present assumptions as verified facts.

    HALLUCINATION PREVENTION:

    Classify information before answering:

    1. EXPLICIT FACTS:
    Information directly stated in the candidate profile.
    You may confidently use it.

    2. REASONABLE EXPLANATIONS:
    Conclusions that can be logically supported by explicit facts.
    You may explain these, but do not present interpretations
    as independently verified achievements.

    3. UNKNOWN INFORMATION:
    Information absent from the candidate profile.
    Never guess, assume, or fabricate it.

    When asked about unknown information:
    - Clearly state that the profile does not provide it.
    - Do not invent numbers, dates, or qualifications.
    - Do not assume proficiency from a technology appearing
      in the skills list.
    - Do not confuse project experience with employment experience.
    - Do not describe ongoing projects as completed.

    COMMUNICATION STYLE:

    - Be professional, confident, and concise.
    - Use natural language rather than dumping raw profile data.
    - Highlight relevant experience and projects when appropriate.
    - Tailor the answer to the recruiter's question.
    - Avoid unnecessary technical jargon.

    IMPORTANT:

    Your goal is to represent the candidate accurately and
    professionally, not to make the candidate appear more
    experienced than the available information supports.
    """


    # ==========================================
    # 5. INITIALIZE CONVERSATION MEMORY
    # ==========================================

    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "system",
            "content": (
                "Candidate Profile:\n"
                + json.dumps(candidate, indent=2)
            )
        }
    ]


    # ==========================================
    # 6. START RECRUITER CHAT
    # ==========================================

    print("\n" + "=" * 45)
    print("       AI CANDIDATE ASSISTANT")
    print("=" * 45)

    print("\nAsk questions about Ashutosh Giri.")
    print("Commands: 'exit' to quit | 'reset' to clear history\n")


    while True:

        question = input("Recruiter: ").strip()

        # Ignore empty input
        if not question:
            continue

        # Exit conversation
        if question.lower() == "exit":
            print("\nConversation ended. Goodbye!")
            break

        # Reset conversation memory
        if question.lower() == "reset":
            messages = messages[:2]
            print("\nConversation history cleared.\n")
            continue


        # ==========================================
        # 7. ADD RECRUITER MESSAGE TO MEMORY
        # ==========================================

        messages.append({
            "role": "user",
            "content": question
        })


        # ==========================================
        # 8. STREAM RESPONSE FROM GROQ
        # ==========================================

        print("\nAI Assistant: ", end="", flush=True)

        answer = ""

        stream = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            stream=True
        )

        for chunk in stream:

            content = chunk.choices[0].delta.content

            if content:
                print(content, end="", flush=True)
                answer += content

        print("\n")


        # ==========================================
        # 9. SAVE COMPLETE RESPONSE TO MEMORY
        # ==========================================

        messages.append({
            "role": "assistant",
            "content": answer
        })
