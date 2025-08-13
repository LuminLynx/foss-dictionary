#!/usr/bin/env node
const path = require("path");
const tailwindPath = path.resolve(
  __dirname,
  "node_modules",
  "tailwindcss",
  "lib",
  "cli.js",
);

if (!require("fs").existsSync(tailwindPath)) {
  console.error("Error: Tailwind CLI not found at", tailwindPath);
  console.error("Please ensure Tailwind CSS is installed in node_modules");
  process.exit(1);
}

require(tailwindPath);
