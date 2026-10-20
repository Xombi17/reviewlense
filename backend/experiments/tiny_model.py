"""A tiny randomly initialised BERT classifier for tests and offline smoke runs.

It needs no network access, so the fine-tuning code path can be exercised anywhere.
Its metrics mean nothing about real transformer quality and must never be reported
as results.
"""

import re
from typing import Iterable, Tuple

from tokenizers import Tokenizer, normalizers, pre_tokenizers, processors
from tokenizers.models import WordPiece
from transformers import BertConfig, BertForSequenceClassification, PreTrainedTokenizerFast

SPECIAL_TOKENS = ["[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]"]


def build_tiny_classifier(
    texts: Iterable[str], max_vocab: int = 2000
) -> Tuple[BertForSequenceClassification, PreTrainedTokenizerFast]:
    counts = {}
    for text in texts:
        for word in re.findall(r"[a-z']+", text.lower()):
            counts[word] = counts.get(word, 0) + 1
    words = [word for word, _ in sorted(counts.items(), key=lambda item: -item[1])][:max_vocab]
    vocab = {token: index for index, token in enumerate(SPECIAL_TOKENS + words)}

    backend = Tokenizer(WordPiece(vocab, unk_token="[UNK]"))
    backend.normalizer = normalizers.BertNormalizer(lowercase=True)
    backend.pre_tokenizer = pre_tokenizers.BertPreTokenizer()
    backend.post_processor = processors.TemplateProcessing(
        single="[CLS] $A [SEP]",
        special_tokens=[("[CLS]", vocab["[CLS]"]), ("[SEP]", vocab["[SEP]"])],
    )
    tokenizer = PreTrainedTokenizerFast(
        tokenizer_object=backend,
        pad_token="[PAD]",
        unk_token="[UNK]",
        cls_token="[CLS]",
        sep_token="[SEP]",
        mask_token="[MASK]",
    )

    # Guard against a tokenizer that silently maps everything to [UNK]
    # (transformers 5 ignores BertTokenizerFast(vocab_file=...)).
    if words and tokenizer.unk_token_id in tokenizer(words[0])["input_ids"]:
        raise RuntimeError("Tiny tokenizer failed to load its vocabulary")

    config = BertConfig(
        vocab_size=len(vocab),
        hidden_size=32,
        num_hidden_layers=2,
        num_attention_heads=2,
        intermediate_size=64,
        max_position_embeddings=512,
        num_labels=2,
    )
    return BertForSequenceClassification(config), tokenizer
