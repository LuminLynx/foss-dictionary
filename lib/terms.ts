import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface Term {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
}

export function loadTerms(): Term[] {
  const filePath = path.join(process.cwd(), "data", "terms.yaml");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return yaml.load(fileContents) as Term[];
}

export function getAllTerms(): Term[] {
  return loadTerms();
}

export function getTermById(id: string): Term | undefined {
  return loadTerms().find((t) => t.id === id);
}

