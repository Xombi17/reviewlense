"""Reliability tiers shared by every model the API serves."""

from typing import List, Tuple

HIGH_CONFIDENCE = 0.90
MEDIUM_CONFIDENCE = 0.70


def reliability_tier(confidence: float) -> Tuple[str, List[str]]:
    """Map a top-label confidence to a HIGH / MEDIUM / LOW tier and its flags."""
    if confidence >= HIGH_CONFIDENCE:
        tier = "HIGH"
    elif confidence >= MEDIUM_CONFIDENCE:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    flags: List[str] = []
    if confidence < MEDIUM_CONFIDENCE:
        flags.append("uncertain_prediction")
    return tier, flags
