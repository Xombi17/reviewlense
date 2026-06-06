"""Heuristic trust score with penalties -0.3, -0.2, -0.1, -0.15 and flags very_short_review/suspicious_review."""

import re
from typing import Any, Dict, List


class TrustAnalyzer:
    def calculate_trust_score(self, text: str) -> Dict[str, Any]:
        if not isinstance(text, str):
            return {"score": 0.0, "flags": ["suspicious_review"]}

        score = 1.0
        flags: List[str] = []

        if len(text) < 20:
            score -= 0.3
            flags.append("very_short_review")

        if any(character.isalpha() for character in text) and text == text.upper():
            score -= 0.2

        if text.count("!") > 3:
            score -= 0.1

        words = re.findall(r"\b\w+\b", text.lower())
        if words:
            word_counts: Dict[str, int] = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            if any(count > 3 for count in word_counts.values()):
                score -= 0.15

        score = max(0.0, score)
        score = round(score, 4)

        if score < 0.5:
            flags.append("suspicious_review")

        return {"score": score, "flags": flags}


_DEFAULT_ANALYZER = TrustAnalyzer()


def compute_trust_score(text: str) -> Dict[str, Any]:
    """Public API: compute_trust_score("GREAT!!!!") -> {"score": 0.4, "flags": [...]}."""
    return _DEFAULT_ANALYZER.calculate_trust_score(text)
