from pydantic import BaseModel


class AnalyticsResponse(BaseModel):
    active_events: int
    citizen_reports: int
    high_heat_zones: int
    ai_confidence: float
    category_distribution: list[dict]
    severity_distribution: list[dict]
    trends: list[dict]
