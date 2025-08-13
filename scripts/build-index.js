import fs from "fs";
import yaml from "yaml";

const yamlText = fs.readFileSync("./data/terms.yaml", "utf8");
const terms = yaml.parse(yamlText);

const index = terms.map((term) => ({
  id: term.id,
  term: term.term,
  keywords: [
    term.term.toLowerCase(),
    ...(term.tags || []).map((tag) => tag.toLowerCase()),
    ...(term.example
      ? term.example.split(/\W+/).map((w) => w.toLowerCase())
      : []),
  ],
  category: term.category,
  emoji: term.emoji || "",
}));

fs.writeFileSync("./public/search-index.json", JSON.stringify(index, null, 2));
console.log("✅ search-index.json built successfully.");
