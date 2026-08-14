"""
Dynamic General Ledger & Double-Entry Financial Engine
======================================================
Calculates real-time farm accounting metrics, Net Profit, ROI %,
and category cost distribution dynamically from debit/credit transaction logs.
Zero static data.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class JournalTransaction(BaseModel):
    id: str
    date: str
    description: str
    category: str  # e.g., 'Seeds', 'Fertilizer', 'Pesticide', 'Labor', 'Fuel', 'Harvest Sale'
    debit_account: str
    credit_account: str
    amount_inr: float
    is_expense: bool = True


class LedgerSummary(BaseModel):
    farm_id: str
    total_transactions_count: int
    total_expenses_inr: float
    total_revenue_inr: float
    net_profit_inr: float
    roi_percent: float
    category_breakdown: List[Dict[str, Any]]
    recent_transactions: List[JournalTransaction]


def compute_general_ledger_summary(farm_id: str, transactions: List[JournalTransaction]) -> LedgerSummary:
    """
    Computes double-entry ledger totals:
    Total Expenses = sum(debit entries in expense accounts)
    Total Revenue = sum(credit entries in revenue accounts)
    Net Profit = Total Revenue - Total Expenses
    ROI (%) = (Net Profit / Total Expenses) * 100
    Category Breakdown (% share of Seeds, Fertilizers, Pesticides, Labor, Fuel)
    """
    total_expenses = 0.0
    total_revenue = 0.0
    category_totals: Dict[str, float] = {}

    for tx in transactions:
        amount = abs(tx.amount_inr)
        cat = tx.category.title()

        if tx.is_expense or tx.debit_account.startswith("Expense"):
            total_expenses += amount
            category_totals[cat] = category_totals.get(cat, 0.0) + amount
        else:
            total_revenue += amount

    net_profit = total_revenue - total_expenses
    roi_percent = (net_profit / total_expenses * 100.0) if total_expenses > 0 else 0.0

    # Build category breakdown with percentage share
    breakdown: List[Dict[str, Any]] = []
    for cat, cat_amount in category_totals.items():
        share_pct = (cat_amount / total_expenses * 100.0) if total_expenses > 0 else 0.0
        breakdown.append({
            "category": cat,
            "amount_inr": round(cat_amount, 2),
            "share_percent": round(share_pct, 2),
        })

    # Sort breakdown by highest amount
    breakdown.sort(key=lambda x: x["amount_inr"], reverse=True)

    return LedgerSummary(
        farm_id=farm_id,
        total_transactions_count=len(transactions),
        total_expenses_inr=round(total_expenses, 2),
        total_revenue_inr=round(total_revenue, 2),
        net_profit_inr=round(net_profit, 2),
        roi_percent=round(roi_percent, 2),
        category_breakdown=breakdown,
        recent_transactions=transactions[-10:] if transactions else [],
    )
