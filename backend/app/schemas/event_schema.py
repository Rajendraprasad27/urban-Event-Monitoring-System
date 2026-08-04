from datetime import datetime
from pydantic import BaseModel, Field


class ProcessEventRequest(BaseModel):
    text: str = Field(min_length=3)
    source: str = "manual"
    latitude: float | None = None
    longitude: float | None = None
    media_url: str | None = None
    timestamp: datetime | str | None = None


class ClusterRequest(BaseModel):
    texts: list[str] = Field(min_length=1)
    algorithm: str = "dbscan"


class SummarizeRequest(BaseModel):
    texts: list[str] = Field(min_length=1)


class ExtractRequest(BaseModel):
    text: str = Field(min_length=3)


class EventResponse(BaseModel):
    id: str | None = None
    raw_text: str
    cleaned_text: str
    category: str
    event_type: str | None = None
    primary_location: str | None = None
    confidence: float
    severity: str
    locations: list[str]
    latitude: float | None = None
    longitude: float | None = None
    source: str
    summary: str
    media_url: str | None = None
    cluster_id: str | None = None
    sub_cluster_id: str | None = None
    created_at: datetime | str | None = None


class SubClusterResponse(BaseModel):
    id: str
    parent_id: str
    category: str
    reportCount: int
    summary: str
    severity: str
    confidence: float
    sources: list[str] = []
    affectedAreas: list[str] = []
    events: list[EventResponse] = []
    lastUpdated: datetime | str | None = None


class ParentClusterResponse(BaseModel):
    id: str
    location: str
    city: str
    totalReports: int
    subClusters: list[SubClusterResponse] = []
    lastUpdated: datetime | str | None = None
