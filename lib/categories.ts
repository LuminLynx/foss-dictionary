import { getAllTerms } from './terms';

const terms = getAllTerms();
export function getAllCategories() {
  return Array.from(new Set(terms.map((t) => t.category)));
}

export function getTermsByCategory(category: string) {
  return terms.filter((t) => t.category === category);
}

