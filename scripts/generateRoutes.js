import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getRoutes(dir, base = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let routes = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(dir, entry.name);
      routes = routes.concat(getRoutes(subDir, `${base}/${entry.name}`));
    } else if (entry.name === "page.tsx" || entry.name === "page.jsx") {
      if (!base.includes("[")) {
        routes.push(base || "/");
      }
    }
  }
  return routes;
}

const appDir = path.join(process.cwd(), "app");
const routes = getRoutes(appDir);

fs.writeFileSync(
  path.join(process.cwd(), "routes.json"),
  JSON.stringify(routes, null, 2)
);

console.log("Routes generated:", routes);
