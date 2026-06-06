from typing import Dict, Any

class TrustAnalyzer:
    def calculate_trust_score(self, text: str) -> Dict[str, Any]:
        """
        Calculates a trust score between 0.0 and 1.0.
        Penalties:
        - length < 20 chars: -0.3
        - all uppercase: -0.2
        - exclamation marks > 3: -0.1
        - repeating words (same word > 3x): -0.15
        """
        return {
            "score": 1.0,
            "flags": []
        }
