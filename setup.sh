#!/bin/bash

# Create folders safely
mkdir -p \
  app/terms/[id] app/contribute app/about app/categories \
  components lib styles public scripts data content/terms test-npm .github/workflows

# Create files only if they don’t exist
for file in \
  app/layout.tsx app/page.tsx \
  app/terms/page.tsx app/terms/[id]/page.tsx app/terms/[id]/layout.tsx \
  app/contribute/page.tsx app/about/page.tsx app/categories/page.tsx \
  components/TermCard.tsx components/TermDetails.tsx components/Navbar.tsx components/Footer.tsx components/CategoryBadge.tsx \
  lib/terms.ts lib/categories.ts \
  styles/globals.css styles/theme.ts \
  public/logo.svg public/favicon.ico public/search-index.json \
  scripts/build-index.js \
  data/terms.yaml data/schema.json \
  content/terms/props.md content/terms/middleware.md \
  README.md CONTRIBUTING.md LICENSE
do
  [ -e "$file" ] || touch "$file"
done

echo "✅ Project structure scaffolded safely!"
