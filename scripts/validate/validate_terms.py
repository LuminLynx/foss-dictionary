import os
import json
import yaml
import sys
from jsonschema import validate, ValidationError

SCHEMA_PATH = "schema.json"
DATA_DIR = "data"

def load_schema():
    with open(SCHEMA_PATH, "r") as f:
        return json.load(f)

def validate_yaml_files(schema):
    errors = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".yaml"):
            with open(os.path.join(DATA_DIR, filename)) as f:
                data = yaml.safe_load(f)
                try:
                    validate(instance=data, schema=schema)
                except ValidationError as ve:
                    errors.append((filename, ve.message))
    return errors

def main():
    schema = load_schema()
    errors = validate_yaml_files(schema)
    if errors:
        for file, error in errors:
            print(f"❌ {file}: {error}")
        sys.exit(1)
    print("✅ All files validated successfully.")

if __name__ == "__main__":
    main()
