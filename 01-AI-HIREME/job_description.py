
import json


def parse_job_description(client, job_description):

    prompt = f"""
    Extract structured information from the following job description.

    Return a JSON object with exactly these fields:

    {{
        "job_title": "string",
        "required_experience": "string",
        "required_skills": [],
        "preferred_skills": [],
        "responsibilities": [],
        "qualifications": []
    }}

    Rules:
    - Extract only information explicitly stated.
    - Do not invent missing details.
    - Keep required and preferred skills separate.
    - Use empty strings or empty arrays when information
      is unavailable.
    - Return valid JSON only.

    JOB DESCRIPTION:

    {job_description}
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
