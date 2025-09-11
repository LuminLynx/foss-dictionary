import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import leven from "leven";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Term {
  id: string;
  term: string;
  related?: string[];
  [key: string]: any;
}

// Your existing term IDs (from your earlier list)
const EXISTING_TERM_IDS = [
  "foss", "agile", "cloud", "api", "devops", "regex", "gpl", "mit-license",
  "hallucination", "prompt-engineering", "license-hell", "rubber-ducking",
  "heisenbug", "yak-shaving", "clipboard-driven-development", "remote-fatigue",
  "code-review", "mentorship", "readme", "pair-programming", "open-source",
  "passing-tests", "first-deploy", "green-build", "deleting-code",
  "elegant-one-liner", "clean-merge", "design-click", "fast-feedback",
  "perfect-commit-message", "unexpected-compliment", "emotional-intelligence",
  "inclusive-language", "feedback-culture", "user-empathy", "psychological-safety",
  "one-character-fix", "friday-deploy", "no-revert-needed", "midnight-hotfix",
  "last-minute-magic", "thoughtful-naming", "calm-ui", "graceful-failure",
  "developer-poetry", "design-with-care"
];

// Common ID mappings for known references
const COMMON_MAPPINGS: Record<string, string> = {
  "aws": "cloud",
  "docker": "devops",
  "kubernetes": "devops", 
  "k8s": "devops",
  "javascript": "api",
  "js": "api",
  "typescript": "api",
  "ts": "api",
  "react": "api",
  "vue": "api",
  "angular": "api",
  "node": "api",
  "nodejs": "api",
  "python": "api",
  "java": "api",
  "php": "api",
  "ruby": "api",
  "go": "api",
  "rust": "api",
  "c++": "api",
  "cpp": "api",
  "csharp": "api",
  "dotnet": "api",
  "rest": "api",
  "graphql": "api",
  "webhook": "api",
  "sdk": "api",
  "microservices": "api",
  "serverless": "cloud",
  "lambda": "cloud",
  "azure": "cloud",
  "gcp": "cloud",
  "google-cloud": "cloud",
  "heroku": "cloud",
  "vercel": "cloud",
  "netlify": "cloud",
  "github": "code-review",
  "gitlab": "code-review",
  "bitbucket": "code-review",
  "git": "code-review",
  "ci": "devops",
  "cd": "devops",
  "cicd": "devops",
  "jenkins": "devops",
  "github-actions": "devops",
  "testing": "code-review",
  "junit": "code-review",
  "jest": "code-review",
  "cypress": "code-review",
  "selenium": "code-review",
  "database": "api",
  "sql": "api",
  "nosql": "api",
  "mongodb": "api",
  "postgresql": "api",
  "mysql": "api",
  "redis": "api",
  "elasticsearch": "api",
  "apache": "gpl",
  "apache-license": "gpl",
  "bsd": "mit-license",
  "bsd-license": "mit-license",
  "creative-commons": "gpl",
  "cc": "gpl",
  "proprietary": "mit-license",
  "commercial": "mit-license",
  "floss": "foss",
  "opensource": "open-source",
  "license": "mit-license",
  "legal": "mit-license",
  "compliance": "mit-license",
  "scrum": "agile",
  "kanban": "agile",
  "waterfall": "agile",
  "lean": "agile",
  "xp": "agile",
  "extreme-programming": "agile",
  "tdd": "code-review",
  "bdd": "code-review",
  "ddd": "code-review",
  "solid": "code-review",
  "dry": "code-review",
  "kiss": "code-review",
  "yagni": "code-review",
  "refactoring": "code-review",
  "code-smell": "code-review",
  "technical-debt": "code-review",
  "legacy": "code-review",
  "documentation": "readme",
  "docs": "readme",
  "wiki": "readme",
  "changelog": "readme",
  "release-notes": "readme",
  "tutorial": "readme",
  "guide": "readme",
  "onboarding": "mentorship",
  "training": "mentorship",
  "learning": "mentorship",
  "teaching": "mentorship",
  "junior": "mentorship",
  "senior": "mentorship",
  "lead": "mentorship",
  "manager": "mentorship",
  "startup": "agile",
  "enterprise": "agile",
  "freelance": "remote-fatigue",
  "remote": "remote-fatigue",
  "wfh": "remote-fatigue",
  "work-from-home": "remote-fatigue",
  "burnout": "remote-fatigue",
  "stress": "remote-fatigue",
  "productivity": "agile",
  "efficiency": "agile",
  "performance": "code-review",
  "optimization": "code-review",
  "scaling": "cloud",
  "load-balancing": "cloud",
  "monitoring": "devops",
  "logging": "devops",
  "debugging": "rubber-ducking",
  "bug": "heisenbug",
  "error": "heisenbug",
  "exception": "heisenbug",
  "crash": "heisenbug",
  "stackoverflow": "rubber-ducking",
  "google": "rubber-ducking",
  "search": "rubber-ducking"
};

function findBestMatch(invalidId: string, validIds: string[]): string | null {
  // First check common mappings
  if (COMMON_MAPPINGS[invalidId]) {
    return COMMON_MAPPINGS[invalidId];
  }
  
  // Then try fuzzy matching
  let bestMatch: string | null = null;
  let minDistance = Infinity;
  
  for (const validId of validIds) {
    const distance = leven(invalidId.toLowerCase(), validId.toLowerCase());
    if (distance < minDistance && distance <= 3) { // Allow up to 3 character differences
      minDistance = distance;
      bestMatch = validId;
    }
  }
  
  return bestMatch;
}

function fixRelatedTerms() {
  console.log("🔧 Starting related terms cleanup...\n");
  
  const termsPath = path.join(__dirname, "../../data/terms.yaml");
  const backupPath = path.join(__dirname, `../../data/terms-backup-related-${Date.now()}.yaml`);
  
  // Create backup
  const originalContent = fs.readFileSync(termsPath, "utf8");
  fs.writeFileSync(backupPath, originalContent);
  console.log(`📦 Backup created: ${backupPath}`);
  
  // Parse terms
  const termsRaw = yaml.load(originalContent);
  const terms: Term[] = Array.isArray(termsRaw) ? termsRaw : [];
  
  console.log(`📊 Processing ${terms.length} terms...\n`);
  
  let totalFixed = 0;
  let totalRemoved = 0;
  let totalMapped = 0;
  
  // Process each term
  const fixedTerms = terms.map(term => {
    if (!term.related || !Array.isArray(term.related) || term.related.length === 0) {
      return term;
    }
    
    const originalRelated = [...term.related];
    const fixedRelated: string[] = [];
    const removedIds: string[] = [];
    const mappedIds: Array<{ from: string, to: string }> = [];
    
    for (const relatedId of term.related) {
      if (EXISTING_TERM_IDS.includes(relatedId)) {
        // Valid ID - keep it
        fixedRelated.push(relatedId);
      } else {
        // Invalid ID - try to find a match
        const match = findBestMatch(relatedId, EXISTING_TERM_IDS);
        if (match && !fixedRelated.includes(match)) {
          fixedRelated.push(match);
          mappedIds.push({ from: relatedId, to: match });
          totalMapped++;
        } else {
          removedIds.push(relatedId);
          totalRemoved++;
        }
      }
    }
    
    // Remove duplicates
    const uniqueRelated = [...new Set(fixedRelated)];
    
    // Log changes for this term
    if (originalRelated.length !== uniqueRelated.length || 
        JSON.stringify(originalRelated.sort()) !== JSON.stringify(uniqueRelated.sort())) {
      
      console.log(`🔄 ${term.term} (${term.id}):`);
      
      if (mappedIds.length > 0) {
        mappedIds.forEach(({ from, to }) => {
          console.log(`   📍 "${from}" → "${to}"`);
        });
      }
      
      if (removedIds.length > 0) {
        console.log(`   ❌ Removed: ${removedIds.join(', ')}`);
      }
      
      console.log(`   📝 Before: [${originalRelated.join(', ')}]`);
      console.log(`   ✅ After:  [${uniqueRelated.join(', ')}]`);
      console.log();
      
      totalFixed++;
    }
    
    return {
      ...term,
      related: uniqueRelated.length > 0 ? uniqueRelated : undefined
    };
  });
  
  // Write fixed terms
  const fixedYaml = yaml.dump(fixedTerms, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false
  });
  
  fs.writeFileSync(termsPath, fixedYaml);
  
  // Summary
  console.log("📊 Related Terms Cleanup Summary:");
  console.log(`   🔄 Terms modified: ${totalFixed}`);
  console.log(`   📍 IDs mapped to existing terms: ${totalMapped}`);
  console.log(`   ❌ Invalid IDs removed: ${totalRemoved}`);
  console.log(`   📁 Backup: ${backupPath}`);
  console.log(`   💾 Updated: ${termsPath}`);
  
  if (totalFixed > 0) {
    console.log("\n🎉 Related terms cleanup completed!");
    console.log("Run 'npm run validate' to verify the fixes.");
  } else {
    console.log("\n✅ No related term issues found.");
  }
}

// Run the fix
fixRelatedTerms();