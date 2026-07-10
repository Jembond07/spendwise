"""AI-assisted expense categorization.

Tries the Claude API first (reads the expense description, picks the best
matching category from the ones already in the database). Falls back to
simple keyword matching against each category's `ai_keywords` list when no
API key is configured or the API call fails, so the app still works out of
the box without a key.
"""

import json
import logging
import os

from anthropic import Anthropic

from app.models import Category, CategorizeResponse

MODEL = "claude-sonnet-5"

logger = logging.getLogger(__name__)


def _keyword_fallback(description: str, categories: list[Category]) -> CategorizeResponse:
    text = description.lower()
    for category in categories:
        for keyword in category.ai_keywords or []:
            if keyword.lower() in text:
                return CategorizeResponse(
                    category_id=category.id,
                    category_name=category.name,
                    confidence=0.6,
                    method="keyword",
                )
    return CategorizeResponse(
        category_id=None, category_name=None, confidence=0.0, method="none"
    )


def categorize_expense(description: str, categories: list[Category]) -> CategorizeResponse:
    if not categories:
        return CategorizeResponse(
            category_id=None, category_name=None, confidence=0.0, method="none"
        )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _keyword_fallback(description, categories)

    category_list = "\n".join(
        f"- {c.name} (keywords: {', '.join(c.ai_keywords) or 'none'})" for c in categories
    )
    prompt = f"""You are categorizing a personal expense for a budgeting app.

Expense description: "{description}"

Available categories:
{category_list}

Pick the single best matching category name from the list above. Respond
with ONLY a JSON object, no other text, in this exact form:
{{"category": "<exact category name from the list>", "confidence": <0.0-1.0>}}

If nothing fits well, use {{"category": null, "confidence": 0.0}}."""

    try:
        client = Anthropic(api_key=api_key)
        message = client.messages.create(
            model=MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = next(block.text for block in message.content if block.type == "text").strip()
        parsed = json.loads(raw)
        category_name = parsed.get("category")
        confidence = float(parsed.get("confidence", 0.0))

        if not category_name:
            return CategorizeResponse(
                category_id=None, category_name=None, confidence=0.0, method="claude"
            )

        match = next(
            (c for c in categories if c.name.lower() == category_name.lower()), None
        )
        if not match:
            return _keyword_fallback(description, categories)

        return CategorizeResponse(
            category_id=match.id,
            category_name=match.name,
            confidence=confidence,
            method="claude",
        )
    except Exception:
        logger.warning("Claude categorization failed, falling back to keyword match", exc_info=True)
        return _keyword_fallback(description, categories)
