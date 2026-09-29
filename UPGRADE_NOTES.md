# Ebook Studio — Quality Upgrade

## Added
- Current-research pass before each generated chapter (Gemini Google Search when configured).
- Stronger writer guardrails for current facts, math, ranges, hypothetical cases, and high-stakes topics.
- Quality Gate API + new **Calidad** tab.
- Quality Score with AI editorial audit plus deterministic checks.
- Checks for contradictions, arithmetic/formatting, stale years/services, unsupported “real” cases, and absolute safety/return claims.
- Automatic Quality Gate after full-book generation (can be disabled per book).
- New-book toggles for current research and Quality Gate.
- Cover typography adapts to long and extra-long titles to reduce clipping/overflow.

## Preserved
Existing ebook creation, outlines, chapter editing, AI polish, images, cover generation, preview, publication kit, PDF/EPUB/DOCX exports, Supabase storage, and provider fallback remain in place.

## Deployment
No Supabase migration is required. Quality results are stored inside the existing `settings` JSON field.
