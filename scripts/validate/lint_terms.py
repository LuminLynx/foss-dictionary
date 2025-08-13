#!/usr/bin/env python3
import sys
from pathlib import Path
import yaml
import re

REQUIRED_FIELDS = {"id", "term", "definition"}
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
EMOJI_PATTERN = re.compile(r"^[\u2600-\u26FF\u2700-\u27BF\uFE0F\u1F000-\u1FFFF]+$")  # loose range

def load_yaml(path: Path):
    try:
        with path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"❌ YAML syntax error in {path.name}: {e}")
        sys.exit(1)

def lint_terms(terms, source: str):
    if not isinstance(terms, list):
        print(f"❌ {source} is not a list at top-level")
        sys.exit(1)

    for i, term in enumerate(terms):
        if not isinstance(term, dict):
            print(f"❌ Entry #{i+1} in {source} is not a dictionary")
            continue

        missing = REQUIRED_FIELDS - term.keys()
        if missing:
            print(f"❌ Entry #{i+1}: Missing required field(s): {', '.join(missing)}")

        # Check for nested entries
        for k, v in term.items():
            if isinstance(v, list):
                for j, item in enumerate(v):
                    if isinstance(item, dict) and "id" in item:
                        print(f"❌ Entry #{i+1}: Nested term entry found in field '{k}' at index {j}")

        # Slug/id format
        id_val = term.get("id")
        if isinstance(id_val, str) and not SLUG_PATTERN.match(id_val):
            print(f"⚠️ Entry #{i+1}: id '{id_val}' not in kebab-case")

        # Emoji validation
        emoji_val = term.get("emoji")
        if emoji_val and not EMOJI_PATTERN.match(emoji_val):
            print(f"⚠️ Entry #{i+1}: emoji '{emoji_val}' may not be valid Unicode emoji")

def main():
    path = Path("data/terms.yaml")
    terms = load_yaml(path)
    lint_terms(terms, source=path.name)
    print("🧼 YAML structure looks good!")

if __name__ == "__main__":
    main()
