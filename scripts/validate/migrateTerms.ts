import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping from old flat structure to new hierarchical structure
const CATEGORY_MAPPING: Record<string, { category: string, subcategory: string }> = {
  "backend": { category: "web", subcategory: "backend" },
  "frontend": { category: "web", subcategory: "frontend" },
  "license": { category: "business", subcategory: "licensing" },
  "licensing": { category: "business", subcategory: "licensing" },
  "legal": { category: "business", subcategory: "legal" },
  "devops": { category: "devops", subcategory: "automation" },
  "tools": { category: "tools", subcategory: "development" },
  "database": { category: "data", subcategory: "databases" },
  "security": { category: "security", subcategory: "authentication" },
  "api": { category: "web", subcategory: "backend" },
  "cloud": { category: "infrastructure", subcategory: "hosting" },
  "development": { category: "development", subcategory: "methodologies" },
  "programming": { category: "development", subcategory: "languages" },
  "framework": { category: "development", subcategory: "frameworks" },
  "library": { category: "development", subcategory: "libraries" },
  "methodology": { category: "development", subcategory: "methodologies" },
  "culture": { category: "community", subcategory: "collaboration" },
  "workflow": { category: "business", subcategory: "processes" },
  "experience": { category: "community", subcategory: "learning" },
  "emotion": { category: "community", subcategory: "collaboration" },
  "psychology": { category: "community", subcategory: "collaboration" }
};

// Common tags to auto-assign based on term content
function generateTags(term: any): string[] {
  const tags: string[] = [];
  
  // Based on category
  if (term.category === "license" || term.category === "licensing") {
    tags.push("legal", "open-source");
  }
  
  // Based on term content
  const content = `${term.term} ${term.definition}`.toLowerCase();
  
  if (content.includes("beginner") || content.includes("simple") || content.includes("easy")) {
    tags.push("beginner-friendly");
  }
  
  if (content.includes("advanced") || content.includes("complex") || content.includes("expert")) {
    tags.push("advanced");
  }
  
  if (content.includes("open source") || content.includes("foss") || content.includes("free")) {
    tags.push("open-source");
  }
  
  if (content.includes("proprietary") || content.includes("commercial")) {
    tags.push("proprietary");
  }
  
  if (content.includes("cloud") || content.includes("saas")) {
    tags.push("cloud");
  }
  
  if (content.includes("api") || content.includes("interface")) {
    tags.push("api", "integration");
  }
  
  if (content.includes("tool") || content.includes("utility")) {
    tags.push("developer-tools");
  }
  
  if (content.includes("fundamental") || content.includes("core") || content.includes("basic")) {
    tags.push("fundamental");
  }
  
  if (content.includes("philosophy") || content.includes("principle") || content.includes("culture")) {
    tags.push("philosophy");
  }
  
  if (content.includes("performance") || content.includes("fast") || content.includes("speed")) {
    tags.push("performance");
  }
  
  if (content.includes("security") || content.includes("secure") || content.includes("safe")) {
    tags.push("security-focused");
  }
  
  // Remove duplicates and limit to reasonable number
  return [...new Set(tags)].slice(0, 5);
}

// Fix common related term ID issues
function fixRelatedTerms(related: string[]): string[] {
  const fixes: Record<string, string> = {
    "rest": "api",
    "apache": "apache-license", // If you plan to create this term
    "opensource": "open-source",
    "floss": "foss",
    "k8s": "kubernetes", // If you have this term
    "js": "javascript", // If you have this term
    "ts": "typescript", // If you have this term
  };
  
  return related.map(id => fixes[id] || id);
}

function migrateTerms() {
  console.log("🔄 Starting term migration to hierarchical structure...\n");
  
  // Read current terms
  const termsPath = path.join(__dirname, "../../data/terms.yaml");
  const backupPath = path.join(__dirname, "../../data/terms-backup.yaml");
  
  // Create backup
  const originalContent = fs.readFileSync(termsPath, "utf8");
  fs.writeFileSync(backupPath, originalContent);
  console.log(`📦 Backup created: ${backupPath}`);
  
  // Parse terms
  const termsRaw = yaml.load(originalContent);
  const terms: any[] = Array.isArray(termsRaw) ? termsRaw : [];
  
  console.log(`📊 Found ${terms.length} terms to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  // Migrate each term
  const migratedTerms = terms.map((term, index) => {
    try {
      if (!term || !term.id || !term.term) {
        console.log(`⚠️  Skipping malformed term at index ${index}`);
        skipped++;
        return term;
      }
      
      // Already migrated? (has subcategory)
      if (term.subcategory) {
        console.log(`✅ Term '${term.term}' already migrated`);
        return term;
      }
      
      // Clone term to avoid mutations
      const migratedTerm = { ...term };
      
      // Migrate category
      if (term.category && CATEGORY_MAPPING[term.category]) {
        const mapping = CATEGORY_MAPPING[term.category];
        migratedTerm.category = mapping.category;
        migratedTerm.subcategory = mapping.subcategory;
        console.log(`🔄 ${term.term}: ${term.category} → ${mapping.category}/${mapping.subcategory}`);
      } else if (term.category) {
        // Try to infer from content if no direct mapping
        const content = `${term.term} ${term.definition}`.toLowerCase();
        
        if (content.includes("license") || content.includes("legal")) {
          migratedTerm.category = "business";
          migratedTerm.subcategory = "licensing";
        } else if (content.includes("api") || content.includes("backend")) {
          migratedTerm.category = "web";
          migratedTerm.subcategory = "backend";
        } else if (content.includes("frontend") || content.includes("ui")) {
          migratedTerm.category = "web";
          migratedTerm.subcategory = "frontend";
        } else if (content.includes("tool") || content.includes("editor")) {
          migratedTerm.category = "tools";
          migratedTerm.subcategory = "development";
        } else if (content.includes("culture") || content.includes("community")) {
          migratedTerm.category = "community";
          migratedTerm.subcategory = "collaboration";
        } else {
          // Default fallback
          migratedTerm.category = "development";
          migratedTerm.subcategory = "methodologies";
        }
        
        console.log(`🤖 ${term.term}: inferred ${migratedTerm.category}/${migratedTerm.subcategory}`);
      }
      
      // Add tags if not present
      if (!migratedTerm.tags || migratedTerm.tags.length === 0) {
        migratedTerm.tags = generateTags(migratedTerm);
        if (migratedTerm.tags.length > 0) {
          console.log(`🏷️  ${term.term}: added tags [${migratedTerm.tags.join(', ')}]`);
        }
      }
      
      // Fix related terms
      if (migratedTerm.related && Array.isArray(migratedTerm.related)) {
        const originalRelated = [...migratedTerm.related];
        migratedTerm.related = fixRelatedTerms(migratedTerm.related);
        if (JSON.stringify(originalRelated) !== JSON.stringify(migratedTerm.related)) {
          console.log(`🔗 ${term.term}: fixed related terms`);
        }
      }
      
      migrated++;
      return migratedTerm;
      
    } catch (error) {
      console.error(`❌ Error migrating term '${term?.term || 'unknown'}': ${error}`);
      errors++;
      return term;
    }
  });
  
  // Write migrated terms
  const migratedYaml = yaml.dump(migratedTerms, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false
  });
  
  fs.writeFileSync(termsPath, migratedYaml);
  
  // Summary
  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📁 Backup: ${backupPath}`);
  console.log(`   💾 Updated: ${termsPath}`);
  
  if (errors === 0) {
    console.log("\n🎉 Migration completed successfully!");
    console.log("Run 'npm run validate' to check the migrated terms.");
  } else {
    console.log("\n⚠️  Migration completed with errors. Check the output above.");
  }
}

// Run migration
migrateTerms();