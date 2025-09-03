import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { z } from 'zod';

// Allowed categories
const allowedCategories = ["Licenses", "Concepts", "Tools", "Organizations"];

// Forbidden words in definitions
const forbiddenWords = ["TBD", "Lorem ipsum", "placeholder"];

// Schema for a term
const termSchema = z.object({
  name: z.string().min(1, "Name is required"),
  definition: z.string().min(10, "Definition must be at least 10 characters"),
  category: z.enum(allowedCategories as [string, ...string[]])
});

const termsPath = path.join(__dirname, '../data/terms.yaml');
const file = fs.readFileSync(termsPath, 'utf8');
const terms = yaml.parse(file);

let hasError = false;
const seenNames = new Set<string>();

terms.forEach((term: any, index: number) => {
  // Schema validation
  const result = termSchema.safeParse(term);
  if (!result.success) {
    console.error(`❌ Term at index ${index} is invalid:`);
    console.error(result.error.format());
    hasError = true;
    return;
  }

  // Duplicate check
  const lowerName = term.name.toLowerCase();
  if (seenNames.has(lowerName)) {
    console.error(`❌ Duplicate term name found: "${term.name}"`);
    hasError = true;
  } else {
    seenNames.add(lowerName);
  }

  // Forbidden words check
  for (const word of forbiddenWords) {
    if (term.definition.toLowerCase().includes(word.toLowerCase())) {
      console.error(`❌ Term "${term.name}" contains forbidden word: "${word}"`);
      hasError = true;
    }
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('✅ All terms are valid!');
}
