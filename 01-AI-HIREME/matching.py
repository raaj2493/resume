
import json


def match_candidate_to_job(client, candidate, parsed_jd):

    prompt = f"""
    You are an expert technical recruiter and candidate
    evaluation assistant.

    Compare the candidate profile with the job description.

    CANDIDATE PROFILE:
    {json.dumps(candidate, indent=2)}

    PARSED JOB DESCRIPTION:
    {json.dumps(parsed_jd, indent=2)}

    Analyze the candidate using these categories:

    1. matching_skills:
       Skills explicitly supported by the candidate profile
       that match the job requirements.

    2. missing_required_skills:
       Required skills not found in the candidate profile.

    3. matching_preferred_skills:
       Preferred skills supported by the candidate profile.

    4. missing_preferred_skills:
       Preferred skills not found in the candidate profile.

    5. relevant_projects:
       Projects relevant to the job, with explanations.

    6. strengths:
       Evidence-backed strengths relevant to the role.

    7. gaps:
       Missing or insufficiently documented qualifications
       and experience.

    8. overall_assessment:
       A concise, balanced assessment of the candidate's fit.

    RULES:

    - Use only information supported by the candidate profile.
    - Do not assume expertise from a skill being listed.
    - Do not invent years of experience.
    - Do not treat projects as professional employment.
    - Distinguish missing information from confirmed lack of skill.
    - Do not invent a match percentage or numerical score.
    - Be objective and explain your reasoning.
    - Return valid JSON only.

    Return this JSON structure:

    {{
        "matching_skills": [],
        "missing_required_skills": [],
        "matching_preferred_skills": [],
        "missing_preferred_skills": [],
        "relevant_projects": [
            {{
                "project_name": "",
                "reason": ""
            }}
        ],
        "strengths": [],
        "gaps": [],
        "overall_assessment": ""
    }}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={
            "type": "json_object"
        }
    )

    result = response.choices[0].message.content

    return json.loads(result)
