import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import leven from "leven";
import { registerSchema, validate } from "@hyperjump/json-schema/draft-2020-12";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface ValidationResult {
  level: "valid" | "warning" | "error";
  field: string;
  message: string;
  suggestion?: string;
}

interface TermValidationDetail {
  termId: string;
  termName: string;
  status: "valid" | "warning" | "error";
  issues: ValidationResult[];
}

interface ValidationReport {
  summary: {
    totalTerms: number;
    validTerms: number;
    warningTerms: number;
    errorTerms: number;
    timestamp: string;
    processingTimeMs: number;
  };
  details: TermValidationDetail[];
  globalIssues: {
    duplicateIds: string[];
    duplicateTerms: string[];
    unusedCategories: string[];
    unusedSubcategories: string[];
  };
}

// Configuration
const CORPORATE_BUZZWORDS = [
  "leverage",
  "synergy",
  "paradigm",
  "enterprise-grade",
  "scalable solution",
  "best-of-breed",
  "world-class",
  "industry-leading",
  "cutting-edge",
  "revolutionary",
  "game-changing",
  "disruptive",
  "innovative solution",
];

const MIN_DEFINITION_LENGTH = 10;
const MAX_DEFINITION_LENGTH = 300;

// Load data files
const categoriesPath = path.join(__dirname, "../../data/categories.json");
const categoryData = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));
const categories = categoryData.categories;
const commonTags = categoryData.common_tags;

const termsPath = path.join(__dirname, "../../data/terms.yaml");
const termsRaw = yaml.load(fs.readFileSync(termsPath, "utf8"));
const terms: any[] = Array.isArray(termsRaw) ? termsRaw : [];

const schemaPath = path.join(__dirname, "../../data/terms.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// Color helpers
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const blue = (s: string) => `\x1b[36m${s}\x1b[0m`;

// Validation functions
function suggestClosest(value: string, list: string[]): string | null {
  let closest: string | null = null;
  let minDistance = Infinity;

  for (const item of list) {
    const dist = leven(value.toLowerCase(), item.toLowerCase());
    if (dist < minDistance && dist <= 3) {
      minDistance = dist;
      closest = item;
    }
  }

  return closest;
}

function validateHierarchicalCategory(
  category: string,
  subcategory?: string
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check main category exists
  if (!categories[category]) {
    const suggestion = suggestClosest(category, Object.keys(categories));
    results.push({
      level: "error",
      field: "category",
      message: `Invalid category "${category}"`,
      suggestion: suggestion ? `Did you mean "${suggestion}"?` : undefined,
    });
    return results; // Don't check subcategory if main category is invalid
  }

  // Check subcategory if provided
  if (subcategory) {
    const validSubcategories = categories[category].subcategories || [];
    if (!validSubcategories.includes(subcategory)) {
      const suggestion = suggestClosest(subcategory, validSubcategories);
      results.push({
        level: "error",
        field: "subcategory",
        message: `Invalid subcategory "${subcategory}" for category "${category}"`,
        suggestion: suggestion ? `Did you mean "${suggestion}"?` : undefined,
      });
    }
  }

  return results;
}

function validateTags(tags: string[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!Array.isArray(tags)) {
    return results; // Tags are optional
  }

  for (const tag of tags) {
    if (typeof tag !== "string") {
      results.push({
        level: "error",
        field: "tags",
        message: `Invalid tag type: ${typeof tag}`,
      });
      continue;
    }

    // Allow custom tags, but suggest common ones for typos
    if (!commonTags.includes(tag)) {
      const suggestion = suggestClosest(tag, commonTags);
      if (suggestion) {
        results.push({
          level: "warning",
          field: "tags",
          message: `Uncommon tag "${tag}"`,
          suggestion: `Did you mean "${suggestion}"?`,
        });
      }
    }
  }

  return results;
}

function checkTone(definition: string, note?: string): ValidationResult[] {
  const issues: ValidationResult[] = [];

  // Check for corporate buzzwords
  const foundBuzzwords = CORPORATE_BUZZWORDS.filter((word) =>
    definition.toLowerCase().includes(word.toLowerCase())
  );
  if (foundBuzzwords.length > 0) {
    issues.push({
      level: "warning",
      field: "definition",
      message: `Contains corporate buzzwords: ${foundBuzzwords.join(", ")}`,
      suggestion: "Try using more human-friendly language",
    });
  }

  // Check definition length
  if (definition.length < MIN_DEFINITION_LENGTH) {
    issues.push({
      level: "error",
      field: "definition",
      message: `Definition too short (${definition.length} chars, minimum ${MIN_DEFINITION_LENGTH})`,
    });
  }

  if (definition.length > MAX_DEFINITION_LENGTH) {
    issues.push({
      level: "warning",
      field: "definition",
      message: `Definition quite long (${definition.length} chars, recommended max ${MAX_DEFINITION_LENGTH})`,
    });
  }

  // Check if definition starts with "A" or "An" (Wikipedia style)
  if (/^(A|An)\s/.test(definition)) {
    issues.push({
      level: "warning",
      field: "definition",
      message:
        'Definition starts with "A/An" - consider a more conversational tone',
      suggestion: "Try starting with action words or direct descriptions",
    });
  }

  return issues;
}

function findSimilarTerms(termName: string, allTerms: string[]): string[] {
  return allTerms.filter((other) => {
    if (other === termName) return false;
    const distance = leven(termName.toLowerCase(), other.toLowerCase());
    return distance <= 2 && distance > 0;
  });
}

function validateTerm(
  term: any,
  allTermIds: Set<string>,
  allTermNames: string[]
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Required fields
  if (!term.id || typeof term.id !== "string") {
    results.push({
      level: "error",
      field: "id",
      message: "Missing or invalid ID field",
    });
  }

  if (!term.term || typeof term.term !== "string") {
    results.push({
      level: "error",
      field: "term",
      message: "Missing or invalid term field",
    });
  }

  if (!term.definition || typeof term.definition !== "string") {
    results.push({
      level: "error",
      field: "definition",
      message: "Missing or invalid definition field",
    });
  }

  // Category validation using hierarchical structure
  if (!term.category || typeof term.category !== "string") {
    results.push({
      level: "error",
      field: "category",
      message: "Missing or invalid category field",
    });
  } else {
    results.push(
      ...validateHierarchicalCategory(term.category, term.subcategory)
    );
  }

  // Tag validation
  if (term.tags) {
    results.push(...validateTags(term.tags));
  }

  // Tone and content validation
  if (term.definition) {
    results.push(...checkTone(term.definition, term.note));
  }

  // Similar terms check
  if (term.term) {
    const similarTerms = findSimilarTerms(term.term, allTermNames);
    if (similarTerms.length > 0) {
      results.push({
        level: "warning",
        field: "term",
        message: `Similar terms found: ${similarTerms.join(", ")}`,
        suggestion: "Consider if this is a duplicate or needs clarification",
      });
    }
  }

  // Related terms validation
  if (term.related && Array.isArray(term.related)) {
    for (const relatedId of term.related) {
      if (relatedId === term.id) {
        results.push({
          level: "error",
          field: "related",
          message: "Term references itself in related terms",
        });
      } else if (!allTermIds.has(relatedId)) {
        const suggestion = suggestClosest(relatedId, Array.from(allTermIds));
        results.push({
          level: "error",
          field: "related",
          message: `Invalid related term ID "${relatedId}"`,
          suggestion: suggestion ? `Did you mean "${suggestion}"?` : undefined,
        });
      }
    }
  }

  // Optional but recommended fields
  if (!term.emoji) {
    results.push({
      level: "warning",
      field: "emoji",
      message: "Missing emoji - helps with visual appeal",
    });
  }

  if (!term.example) {
    results.push({
      level: "warning",
      field: "example",
      message: "Missing example - helps users understand practical usage",
    });
  }

  if (!term.why_it_matters) {
    results.push({
      level: "warning",
      field: "why_it_matters",
      message: 'Missing "why it matters" - helps users understand relevance',
    });
  }

  return results;
}

function writeReport(
  report: ValidationReport,
  outputDir: string = "./validation-output"
) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  // This would create: validation-report-2024-09-11T22-30-15.json

  // JSON Report (for CI/CD)
  const jsonPath = path.join(outputDir, `validation-report-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Markdown Report (for humans)
  const markdownPath = path.join(
    outputDir,
    `validation-report-${timestamp}.md`
  );
  const markdownContent = generateMarkdownReport(report);
  fs.writeFileSync(markdownPath, markdownContent);

  // CSV Report (for analysis)
  const csvPath = path.join(outputDir, `validation-report-${timestamp}.csv`);
  const csvContent = generateCSVReport(report);
  fs.writeFileSync(csvPath, csvContent);

  return { jsonPath, markdownPath, csvPath };
}

function generateMarkdownReport(report: ValidationReport): string {
  const { summary, details, globalIssues } = report;

  let markdown = `# Validation Report\n\n`;
  markdown += `**Generated:** ${summary.timestamp}  \n`;
  markdown += `**Processing Time:** ${summary.processingTimeMs}ms  \n\n`;

  // Summary
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Terms | ${summary.totalTerms} |\n`;
  markdown += `| Valid Terms | ${summary.validTerms} |\n`;
  markdown += `| Terms with Warnings | ${summary.warningTerms} |\n`;
  markdown += `| Terms with Errors | ${summary.errorTerms} |\n\n`;

  // Global issues
  if (
    globalIssues.duplicateIds.length ||
    globalIssues.duplicateTerms.length ||
    globalIssues.unusedCategories.length ||
    globalIssues.unusedSubcategories.length
  ) {
    markdown += `## Global Issues\n\n`;

    if (globalIssues.duplicateIds.length) {
      markdown += `### Duplicate IDs\n${globalIssues.duplicateIds.map((id) => `- ${id}`).join("\n")}\n\n`;
    }

    if (globalIssues.duplicateTerms.length) {
      markdown += `### Duplicate Terms\n${globalIssues.duplicateTerms.map((term) => `- ${term}`).join("\n")}\n\n`;
    }

    if (globalIssues.unusedCategories.length) {
      markdown += `### Unused Categories\n${globalIssues.unusedCategories.map((cat) => `- ${cat}`).join("\n")}\n\n`;
    }

    if (globalIssues.unusedSubcategories.length) {
      markdown += `### Unused Subcategories\n${globalIssues.unusedSubcategories.map((sub) => `- ${sub}`).join("\n")}\n\n`;
    }
  }

  // Term details
  const errorTerms = details.filter((d) => d.status === "error");
  const warningTerms = details.filter((d) => d.status === "warning");

  if (errorTerms.length) {
    markdown += `## Terms with Errors\n\n`;
    for (const term of errorTerms) {
      markdown += `### ${term.termName} (${term.termId})\n`;
      for (const issue of term.issues.filter((i) => i.level === "error")) {
        markdown += `- **${issue.field}:** ${issue.message}`;
        if (issue.suggestion) markdown += ` *(${issue.suggestion})*`;
        markdown += `\n`;
      }
      markdown += `\n`;
    }
  }

  if (warningTerms.length) {
    markdown += `## Terms with Warnings\n\n`;
    for (const term of warningTerms) {
      markdown += `### ${term.termName} (${term.termId})\n`;
      for (const issue of term.issues.filter((i) => i.level === "warning")) {
        markdown += `- **${issue.field}:** ${issue.message}`;
        if (issue.suggestion) markdown += ` *(${issue.suggestion})*`;
        markdown += `\n`;
      }
      markdown += `\n`;
    }
  }

  return markdown;
}

function generateCSVReport(report: ValidationReport): string {
  let csv = "TermID,TermName,Status,Field,Level,Message,Suggestion\n";

  for (const detail of report.details) {
    if (detail.issues.length === 0) {
      csv += `"${detail.termId}","${detail.termName}","${detail.status}","","valid","No issues",""\n`;
    } else {
      for (const issue of detail.issues) {
        csv += `"${detail.termId}","${detail.termName}","${detail.status}","${issue.field}","${issue.level}","${issue.message.replace(/"/g, '""')}","${issue.suggestion || ""}"\n`;
      }
    }
  }

  return csv;
}

// Main execution
async function runValidation() {
  const startTime = Date.now();
  console.log(blue("🔍 Starting enhanced term validation...\n"));

  // Schema validation first
  await registerSchema(schema, "https://example.com/terms-schema");
  const schemaResult = await validate(
    "https://example.com/terms-schema",
    terms
  );

  if (!schemaResult.valid && Array.isArray(schemaResult.errors)) {
    console.error(red("❌ Schema validation failed:"));
    const grouped: Record<string, string[]> = {};
    for (const err of schemaResult.errors) {
      const pathKey = (err as any).instanceLocation || "(root)";
      const msg = (err as any).error || "Invalid value";
      if (!grouped[pathKey]) grouped[pathKey] = [];
      grouped[pathKey].push(msg);
    }
    for (const [pathKey, messages] of Object.entries(grouped)) {
      console.error(`\n  ${blue(pathKey)}`);
      for (const msg of messages) console.error(`    - ${msg}`);
    }
    process.exit(1);
  }

  // Build term collections for validation
  const allTermIds = new Set<string>();
  const allTermNames: string[] = [];
  const termDetails: TermValidationDetail[] = [];

  // Global issue tracking
  const duplicateIds: string[] = [];
  const duplicateTerms: string[] = [];
  const idCounts = new Map<string, number>();
  const termCounts = new Map<string, number>();

  // First pass: collect IDs and terms
  for (const term of terms) {
    if (term?.id) {
      const count = idCounts.get(term.id) || 0;
      idCounts.set(term.id, count + 1);
      if (count === 1) duplicateIds.push(term.id);
      allTermIds.add(term.id);
    }

    if (term?.term) {
      const lowerTerm = term.term.toLowerCase();
      const count = termCounts.get(lowerTerm) || 0;
      termCounts.set(lowerTerm, count + 1);
      if (count === 1) duplicateTerms.push(term.term);
      allTermNames.push(term.term);
    }
  }

  // Second pass: validate each term
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const term of terms) {
    if (!term || !term.id || !term.term) {
      console.warn(
        yellow(`⚠️ Skipping malformed term: ${JSON.stringify(term)}`)
      );
      continue;
    }

    const issues = validateTerm(term, allTermIds, allTermNames);
    const hasErrors = issues.some((i) => i.level === "error");
    const hasWarnings = issues.some((i) => i.level === "warning");

    let status: "valid" | "warning" | "error" = "valid";
    if (hasErrors) {
      status = "error";
      errorCount++;
    } else if (hasWarnings) {
      status = "warning";
      warningCount++;
    } else {
      validCount++;
    }

    termDetails.push({
      termId: term.id,
      termName: term.term,
      status,
      issues,
    });
  }

  // Check for unused categories and subcategories
  const usedCategories = new Set(
    terms.filter((t) => t?.category).map((t) => t.category)
  );
  const usedSubcategories = new Map<string, Set<string>>();

  for (const term of terms) {
    if (term?.category && term?.subcategory) {
      if (!usedSubcategories.has(term.category)) {
        usedSubcategories.set(term.category, new Set());
      }
      usedSubcategories.get(term.category)!.add(term.subcategory);
    }
  }

  const unusedCategories: string[] = [];
  const unusedSubcategories: { category: string; subcategory: string }[] = [];

  // Check main categories
  for (const category of Object.keys(categories)) {
    if (!usedCategories.has(category)) {
      unusedCategories.push(category);
    }
  }

  // Check subcategories
  for (const [category, categoryData] of Object.entries(categories)) {
    const catData = categoryData as { subcategories?: string[] };
    if (catData.subcategories) {
      const usedSubs = usedSubcategories.get(category) || new Set();
      for (const subcategory of catData.subcategories) {
        if (!usedSubs.has(subcategory)) {
          unusedSubcategories.push({ category, subcategory });
        }
      }
    }
  }

  const processingTime = Date.now() - startTime;

  // Create report
  const report: ValidationReport = {
    summary: {
      totalTerms: terms.length,
      validTerms: validCount,
      warningTerms: warningCount,
      errorTerms: errorCount,
      timestamp: new Date().toISOString(),
      processingTimeMs: processingTime,
    },
    details: termDetails,
    globalIssues: {
      duplicateIds,
      duplicateTerms,
      unusedCategories,
      unusedSubcategories: unusedSubcategories.map(
        (u) => `${u.category}/${u.subcategory}`
      ),
    },
  };

  // Console output
  console.log(blue("📊 Validation Results:"));
  console.log(`   Total terms: ${terms.length}`);
  console.log(`   ${green("✅ Valid:")} ${validCount}`);
  console.log(`   ${yellow("⚠️  Warnings:")} ${warningCount}`);
  console.log(`   ${red("❌ Errors:")} ${errorCount}`);

  if (duplicateIds.length) {
    console.log(red(`\n❌ Duplicate IDs found: ${duplicateIds.join(", ")}`));
  }

  if (duplicateTerms.length) {
    console.log(
      red(`\n❌ Duplicate terms found: ${duplicateTerms.join(", ")}`)
    );
  }

  if (unusedCategories.length) {
    console.log(
      yellow(`\n⚠️  Unused categories: ${unusedCategories.join(", ")}`)
    );
  }

  if (unusedSubcategories.length) {
    console.log(
      yellow(
        `\n⚠️  Unused subcategories: ${unusedSubcategories.map((u) => `${u.category}/${u.subcategory}`).join(", ")}`
      )
    );
  }

  // Write reports
  try {
    const { jsonPath, markdownPath, csvPath } = writeReport(report);
    console.log(blue("\n📄 Reports generated:"));
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   Markdown: ${markdownPath}`);
    console.log(`   CSV: ${csvPath}`);
  } catch (error) {
    console.error(red(`\n❌ Failed to write reports: ${error}`));
  }

  console.log(blue(`\n⏱️  Processing completed in ${processingTime}ms`));

  // Exit with appropriate code
  if (errorCount > 0) {
    console.log(red("\n❌ Validation failed - fix errors before proceeding"));
    process.exitCode = 1;
  } else if (warningCount > 0) {
    console.log(yellow("\n⚠️  Validation passed with warnings"));
  } else {
    console.log(green("\n✅ All validations passed!"));
  }
}

runValidation().catch(console.error);
