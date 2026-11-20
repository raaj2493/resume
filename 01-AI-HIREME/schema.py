
from pydantic import BaseModel, Field


class JobDescription(BaseModel):
    job_title: str = ""
    required_experience: str = ""
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    qualifications: list[str] = Field(default_factory=list)


class RelevantProject(BaseModel):
    project_name: str
    reason: str


class CandidateJobMatch(BaseModel):
    matching_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    matching_preferred_skills: list[str] = Field(default_factory=list)
    missing_preferred_skills: list[str] = Field(default_factory=list)
    relevant_projects: list[RelevantProject] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    overall_assessment: str
