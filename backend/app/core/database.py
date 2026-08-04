from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings


class MemoryCollection:
    def __init__(self, seed: list[dict[str, Any]] | None = None):
        self.rows: list[dict[str, Any]] = []
        for row in seed or []:
            stored = dict(row)
            stored.setdefault("_id", str(stored.get("id") or ObjectId()))
            self.rows.append(stored)

    async def find_one(self, query: dict[str, Any]):
        for row in self.rows:
            if _matches(row, query):
                return dict(row)
        return None

    async def insert_one(self, document: dict[str, Any]):
        stored = dict(document)
        stored.setdefault("_id", str(ObjectId()))
        self.rows.append(stored)

        class Result:
            inserted_id = stored["_id"]

        return Result()

    def find(self, query: dict[str, Any] | None = None):
        rows = [dict(row) for row in self.rows if _matches(row, query or {})]
        return MemoryCursor(rows)

    async def count_documents(self, query: dict[str, Any] | None = None):
        return len([row for row in self.rows if _matches(row, query or {})])

    async def update_one(self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False):
        for row in self.rows:
            if _matches(row, query):
                row.update(update.get("$set", {}))
                return
        if upsert:
            new_row = dict(query)
            new_row.update(update.get("$set", {}))
            new_row.setdefault("_id", str(ObjectId()))
            self.rows.append(new_row)


class MemoryCursor:
    def __init__(self, rows: list[dict[str, Any]]):
        self.rows = rows

    def sort(self, key: str, direction: int):
        self.rows.sort(key=lambda row: row.get(key) or "", reverse=direction < 0)
        return self

    def limit(self, count: int):
        self.rows = self.rows[:count]
        return self

    async def to_list(self, length: int | None = None):
        return self.rows[:length] if length else self.rows


class MemoryDatabase:
    def __init__(self):
        self.users = MemoryCollection([])
        self.events = MemoryCollection(_seed_events())
        self.clusters = MemoryCollection([])
        self.summaries = MemoryCollection([])
        self.analytics = MemoryCollection([])
        self.parent_clusters = MemoryCollection([])
        self.sub_clusters = MemoryCollection([])

    def __getitem__(self, name):
        return getattr(self, name)


def _matches(row: dict[str, Any], query: dict[str, Any]):
    for key, expected in query.items():
        value = row.get(key)
        if isinstance(expected, dict):
            if "$regex" in expected and expected["$regex"].lower() not in str(value).lower():
                return False
            if "$gte" in expected and value < expected["$gte"]:
                return False
            if "$lte" in expected and value > expected["$lte"]:
                return False
        elif value != expected and str(value) != str(expected):
            return False
    return True


client: AsyncIOMotorClient | None = None
database: Any | None = None


async def connect_to_mongo():
    global client, database
    settings = get_settings()
    try:
        client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=1200)
        await client.admin.command("ping")
        database = client[settings.mongodb_database]
        await seed_database()
    except Exception:
        database = MemoryDatabase()


async def close_mongo_connection():
    if client:
        client.close()


def get_database():
    global database
    if database is None:
        database = MemoryDatabase()
    return database


async def seed_database():
    if await database.events.count_documents({}) == 0:
        for event in _seed_events():
            await database.events.insert_one(event)


def serialize_doc(row: dict[str, Any]) -> dict[str, Any]:
    data = dict(row)
    if "_id" in data:
        data["id"] = str(data.pop("_id"))
    for key, value in list(data.items()):
        if isinstance(value, ObjectId):
            data[key] = str(value)
        if isinstance(value, datetime):
            data[key] = value.isoformat()
    return data


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _seed_events() -> list[dict[str, Any]]:
    now = utc_now()
    return [
        {
            "raw_text": "Heavy traffic jam on Outer Ring Road near Marathahalli after a stalled bus.",
            "cleaned_text": "heavy traffic jam outer ring road marathahalli stalled bus",
            "category": "Traffic",
            "confidence": 0.94,
            "severity": "high",
            "locations": ["Outer Ring Road", "Marathahalli"],
            "latitude": 12.9569,
            "longitude": 77.7011,
            "source": "sample",
            "summary": "Traffic disruption reported near Marathahalli on Outer Ring Road.",
            "cluster_id": "traffic-orr",
            "created_at": now,
        },
        {
            "raw_text": "Waterlogging reported at Silk Board junction, vehicles moving slowly.",
            "cleaned_text": "waterlogging silk board junction vehicles moving slowly",
            "category": "Flood",
            "confidence": 0.9,
            "severity": "medium",
            "locations": ["Silk Board"],
            "latitude": 12.9177,
            "longitude": 77.6238,
            "source": "sample",
            "summary": "Waterlogging is slowing vehicles around Silk Board.",
            "cluster_id": "flood-silk-board",
            "created_at": now,
        },
        {
            "raw_text": "Large public gathering near MG Road metro, police managing crowd.",
            "cleaned_text": "large public gathering mg road metro police managing crowd",
            "category": "Public Gathering",
            "confidence": 0.88,
            "severity": "medium",
            "locations": ["MG Road"],
            "latitude": 12.9755,
            "longitude": 77.6068,
            "source": "sample",
            "summary": "A crowd is being managed near MG Road metro.",
            "cluster_id": "gathering-mg-road",
            "created_at": now,
        },
    ]
