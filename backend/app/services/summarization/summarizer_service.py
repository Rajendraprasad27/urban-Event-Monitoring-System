from app.services.summarization.t5_summarizer import summarize_events


def summarize_cluster(texts: list[str]) -> dict:
    return {
        "summary": summarize_events(texts),
        "post_count": len(texts),
    }
