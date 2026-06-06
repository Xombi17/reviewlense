from typing import List, Dict, Any

class AspectExtractor:
    def __init__(self, predictor_instance):
        self.predictor = predictor_instance
        self.aspects_dict = {
            "battery": ["battery", "charge", "power", "runtime"],
            "sound": ["sound", "audio", "bass", "treble", "volume"],
            "build": ["build", "quality", "durability", "plastic", "metal"],
            "comfort": ["comfort", "fit", "wear", "ergonomics", "pain"],
            "connectivity": ["bluetooth", "wireless", "pairing", "connect", "signal"],
            "delivery": ["shipping", "delivery", "arrived", "package"],
            "price": ["price", "cost", "value", "expensive", "cheap"],
            "mic": ["mic", "microphone", "call", "voice"]
        }

    def extract_aspects(self, text: str, model_name: str = "lr") -> List[Dict[str, Any]]:
        """
        Extracts aspects and classifies sentiment per aspect.
        """
        return []
