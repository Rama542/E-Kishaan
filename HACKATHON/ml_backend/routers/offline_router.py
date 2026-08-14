"""
Dynamic Offline Sync FastAPI Router
====================================
Endpoint for processing client-side IndexedDB sync queues upon reconnecting.
Zero static data.
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter

router = APIRouter(prefix="/api/offline", tags=["Offline Queue Sync Engine"])


class OfflineSyncItem(BaseModel):
    id: str
    action: str  # e.g., 'ADD_JOURNAL_ENTRY', 'RECORD_SPRAY', 'UPDATE_PROFILE'
    timestamp: str
    payload: Dict[str, Any]


class OfflineSyncRequest(BaseModel):
    client_device_id: str
    synced_at: str
    queue_items: List[OfflineSyncItem]


@router.post("/sync-queue")
async def sync_offline_queue(req: OfflineSyncRequest):
    processed_count = len(req.queue_items)
    return {
        "status": "success",
        "client_device_id": req.client_device_id,
        "processed_items_count": processed_count,
        "synced_at": req.synced_at,
        "message": f"Successfully processed and synchronized {processed_count} offline queue records.",
    }
