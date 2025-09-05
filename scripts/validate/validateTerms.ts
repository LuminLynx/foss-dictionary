// validateTerms.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { z } from "zod";
import { issue } from "zod/v4/core/util.cjs";

/**
 * 1️⃣ Schema for a single glossary term
 */
export const termSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, {
      message: "id must be lowercase kebab-case (letters, numbers, hyphens only)"
    }),
  term: z.string().min(1, { message: "term is required" }),
  acronym: z.string().min(1).optional(),
  definition: z
    .string()
    .min(10, { message: "definition must be at least 10 characters" }),
  category: z.enum(
    ["licensing", "methodology", "infra", "backend"] as const,
    {
      message: "category must be one of: licensing, methodology, infra, backend"
    }
  ),
  why_it_matters: z.string().optional(),
  example: z.string().optional(),
  related: z
    .array(z.string().regex(/^[a-z0-9-]+$/, "related IDs must be kebab-case"))
    .optional(),
  note: z.string().optional(),
  emoji: z.string().optional(),
  last_updated: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "last_updated must be in YYYY-MM-DD format"
    })
    .optional()
});

/**
 * 2️⃣ Schema for the whole array
 */
export const termsArraySchema = z.array(termSchema);

/**
 * 3️⃣ Validate structure + integrity
 */
export function validateTermsData(terms: unknown) {
  // Step 1: Validate structure with Zod
  const parsed = termsArraySchema.parse(terms);

  const errors: string[] = [];

  // Step 2: Check for duplicate IDs
  const seenIds = new Set<string>();
  for (const term of parsed) {
    if (seenIds.has(term.id)) {
      errors.push(`Duplicate id found: "${term.id}"`);
    }
    seenIds.add(term.id);
  }

  // Step 3: Check for broken related references
  const allIds = new Set(parsed.map(t => t.id));
  for (const term of parsed) {
    if (term.related) {
      for (const rel of term.related) {
        if (!allIds.has(rel)) {
          errors.push(
            `Term "${term.id}" has related reference to non-existent id "${rel}"`
          );
        }
      }
    }
  }

  // Step 4: Throw if any integrity errors found
  if (errors.length > 0) {
    throw new Error(`Integrity check failed:\n${errors.join("\n")}`);
  }

  return parsed;
}

/**
 * 4️⃣ Main runner — reads YAML, validates, reports
 */
function main() {
  const filePath = path.resolve(process.cwd(), "../../data/terms.yaml");

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const parsedYaml = yaml.load(fileContents);

    validateTermsData(parsedYaml);

    console.log("✅ All terms are valid and consistent!");
  } catch (err) {
    console.error("❌ Validation failed:");
    if (err instanceof z.ZodError) {
      err.issues.forEach(issue => {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
      });
    } else if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

