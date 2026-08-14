"""
Dynamic Finance & General Ledger FastAPI Router
===============================================
Double-entry general ledger summary endpoints computing Net Profit, ROI %,
and category cost distribution dynamically from live debit/credit entries.
Zero static data.
"""

from typing import List
from pydantic import BaseModel, Field
from fastapi import APIRouter

from services.finance_ledger import (
    JournalTransaction,
    LedgerSummary,
    compute_general_ledger_summary,
)

router = APIRouter(prefix="/api/finance", tags=["Finance General Ledger"])


class LedgerSummaryRequest(BaseModel):
    farm_id: str = Field(..., example="FARM-WHEAT-101")
    transactions: List[JournalTransaction]


@router.post("/ledger-summary", response_model=LedgerSummary)
async def get_ledger_summary(req: LedgerSummaryRequest):
    return compute_general_ledger_summary(farm_id=req.farm_id, transactions=req.transactions)
