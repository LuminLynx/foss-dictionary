import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import yaml from "js-yaml";

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load categories from /data
const categoriesPath = path.resolve(__dirname, "../../data/categories.json");
const categories: string[] = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));

// Define schema using dynamic categories
const termSchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  acronym: z.string().optional(),
  definition: z.string().min(1),
  category: z.enum(categories as [string, ...string[]], {
    message: `category must be one of: ${categories.join(", ")}`
  }),
  why_it_matters: z.string().min(1),
  example: z.string().optional(),
  related: z.array(z.string()).optional(),
  note: z.string().optional(),
  emoji: z.string().optional(),
  last_updated: z.string().optional()
});

// Load and parse YAML terms
const termsPath = path.resolve(__dirname, "../../data/terms.yaml");
const fileContents = fs.readFileSync(termsPath, "utf8");
const terms = yaml.load(fileContents);

if (!Array.isArray(terms)) {
  console.error("❌ terms.yaml must contain a top-level array");
  process.exit(1);
}

let hasErrors = false;

terms.forEach((term, index) => {
  const result = termSchema.safeParse(term);
  if (!result.success) {
    hasErrors = true;
    console.error(`\n❌ Validation error in term at index ${index}:`);
    result.error.issues.forEach(err => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
  }
});

if (!hasErrors) {
  console.log("✅ All terms are valid!");
  process.exit(0);
} else {
  process.exit(1);
}
