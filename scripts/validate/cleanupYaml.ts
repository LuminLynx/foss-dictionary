import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Term {
  id: string;
  term: string;
  definition: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  why_it_matters?: string;
  example?: string;
  related?: string[];
  note?: string;
  emoji?: string;
  last_updated?: string;
  acronym?: string;
}

function cleanupYaml() {
  console.log("🧹 Starting YAML cleanup...\n");

  const termsPath = path.join(__dirname, "../../data/terms.yaml");
  const backupPath = path.join(
    __dirname,
    `../../data/terms-backup-${Date.now()}.yaml`
  );

  // Create backup
  const originalContent = fs.readFileSync(termsPath, "utf8");
  fs.writeFileSync(backupPath, originalContent);
  console.log(`📦 Backup created: ${backupPath}`);

  // Try to parse existing YAML
  let terms: Term[] = [];
  let parseErrors: string[] = [];

  try {
    const parsed = yaml.load(originalContent);
    if (Array.isArray(parsed)) {
      terms = parsed;
      console.log(`✅ Successfully parsed ${terms.length} terms`);
    } else {
      throw new Error("YAML root is not an array");
    }
  } catch (error) {
    console.log(`❌ YAML parse failed: ${error}`);
    console.log("🔧 Attempting manual cleanup...\n");

    // Attempt manual line-by-line cleanup
    terms = attemptManualParse(originalContent);
  }

  if (terms.length === 0) {
    console.error(
      "❌ Could not parse any terms. Manual intervention required."
    );
    return;
  }

  // Clean up each term
  const cleanedTerms = terms.map((term, index) => cleanTerm(term, index));

  // Generate clean YAML
  const cleanYaml = yaml.dump(cleanedTerms, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false,
  });

  // Write cleaned version
  fs.writeFileSync(termsPath, cleanYaml);

  console.log("\n📊 Cleanup Summary:");
  console.log(`   ✅ Processed: ${cleanedTerms.length} terms`);
  console.log(`   📁 Backup: ${backupPath}`);
  console.log(`   💾 Updated: ${termsPath}`);

  // Validate the cleaned YAML
  try {
    yaml.load(cleanYaml);
    console.log("   ✅ Cleaned YAML is valid");
    console.log("\n🎉 YAML cleanup completed successfully!");
  } catch (error) {
    console.log(`   ❌ Cleaned YAML still has issues: ${error}`);
    console.log("   🔄 Run the script again or check manual fixes needed");
  }
}

function attemptManualParse(content: string): Term[] {
  console.log("🔧 Attempting manual term extraction...");

  const terms: Term[] = [];
  const lines = content.split("\n");
  let currentTerm: Partial<Term> = {};
  let inExample = false;
  let exampleLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Start of new term
    if (trimmed.startsWith("- id:")) {
      // Save previous term if it exists
      if (currentTerm.id && currentTerm.term) {
        if (inExample) {
          currentTerm.example = exampleLines.join("\n");
        }
        terms.push(currentTerm as Term);
      }

      // Start new term
      currentTerm = {};
      inExample = false;
      exampleLines = [];
      currentTerm.id = extractValue(trimmed, "id:");
      continue;
    }

    // Skip empty lines or malformed lines
    if (!trimmed || !trimmed.includes(":")) {
      if (inExample) {
        exampleLines.push(line);
      }
      continue;
    }

    // Handle example blocks
    if (trimmed.includes("example:")) {
      inExample = true;
      exampleLines = [];
      if (trimmed.includes("|")) {
        // Multi-line example starting
        continue;
      }
    } else if (inExample && !trimmed.startsWith(" ")) {
      // End of example block
      currentTerm.example = exampleLines.join("\n");
      inExample = false;
      exampleLines = [];
    }

    if (inExample) {
      exampleLines.push(line);
      continue;
    }

    // Extract field values
    if (trimmed.includes("term:")) {
      currentTerm.term = extractValue(trimmed, "term:");
    } else if (trimmed.includes("definition:")) {
      currentTerm.definition = extractValue(trimmed, "definition:");
    } else if (trimmed.includes("category:")) {
      currentTerm.category = extractValue(trimmed, "category:");
    } else if (trimmed.includes("subcategory:")) {
      currentTerm.subcategory = extractValue(trimmed, "subcategory:");
    } else if (trimmed.includes("why_it_matters:")) {
      currentTerm.why_it_matters = extractValue(trimmed, "why_it_matters:");
    } else if (trimmed.includes("note:")) {
      currentTerm.note = extractValue(trimmed, "note:");
    } else if (trimmed.includes("emoji:")) {
      currentTerm.emoji = extractValue(trimmed, "emoji:");
    } else if (trimmed.includes("last_updated:")) {
      currentTerm.last_updated = extractValue(trimmed, "last_updated:");
    } else if (trimmed.includes("acronym:")) {
      currentTerm.acronym = extractValue(trimmed, "acronym:");
    } else if (trimmed.includes("related:")) {
      currentTerm.related = extractArray(trimmed, "related:");
    } else if (trimmed.includes("tags:")) {
      currentTerm.tags = extractArray(trimmed, "tags:");
    }
  }

  // Save last term
  if (currentTerm.id && currentTerm.term) {
    if (inExample) {
      currentTerm.example = exampleLines.join("\n");
    }
    terms.push(currentTerm as Term);
  }

  console.log(`🔧 Manual extraction found ${terms.length} terms`);
  return terms;
}

function extractValue(line: string, field: string): string {
  const index = line.indexOf(field);
  if (index === -1) return "";

  let value = line.substring(index + field.length).trim();

  // Remove quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value;
}

function extractArray(line: string, field: string): string[] {
  const value = extractValue(line, field);

  // Handle array format [item1, item2]
  if (value.startsWith("[") && value.endsWith("]")) {
    const content = value.slice(1, -1);
    return content
      .split(",")
      .map((item) => {
        let cleaned = item.trim();
        if (
          (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
          (cleaned.startsWith("'") && cleaned.endsWith("'"))
        ) {
          cleaned = cleaned.slice(1, -1);
        }
        return cleaned;
      })
      .filter((item) => item.length > 0);
  }

  // Handle single item
  if (value.length > 0) {
    return [value];
  }

  return [];
}

function cleanTerm(term: Term, index: number): Term {
  const cleaned: Term = { ...term };

  // Ensure required fields are strings
  if (!cleaned.id || typeof cleaned.id !== "string") {
    console.log(`⚠️  Term ${index}: Missing or invalid ID`);
    cleaned.id = `term-${index}`;
  }

  if (!cleaned.term || typeof cleaned.term !== "string") {
    console.log(`⚠️  Term ${index}: Missing or invalid term name`);
    cleaned.term = `Unknown Term ${index}`;
  }

  if (!cleaned.definition || typeof cleaned.definition !== "string") {
    console.log(`⚠️  Term ${index}: Missing or invalid definition`);
    cleaned.definition = "Definition needs to be added.";
  }

  if (!cleaned.category || typeof cleaned.category !== "string") {
    console.log(`⚠️  Term ${index}: Missing or invalid category`);
    cleaned.category = "development";
  }

  // Clean up arrays
  if (cleaned.tags && !Array.isArray(cleaned.tags)) {
    cleaned.tags = [];
  }

  if (cleaned.related && !Array.isArray(cleaned.related)) {
    cleaned.related = [];
  }

  // Ensure date format
  if (
    cleaned.last_updated &&
    !/^\d{4}-\d{2}-\d{2}$/.test(cleaned.last_updated)
  ) {
    console.log(`🔧 Term ${cleaned.term}: Fixing date format`);
    cleaned.last_updated = new Date().toISOString().split("T")[0];
  }

  return cleaned;
}

// Run the cleanup
cleanupYaml();
