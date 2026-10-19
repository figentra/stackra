#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 05: Update docs.json Navigation"
echo "=========================================="

node << 'NODESCRIPT'
const fs = require('fs');

const docsJsonPath = 'apps/docs/src/docs.json';
const docs = JSON.parse(fs.readFileSync(docsJsonPath, 'utf8'));

// Update navigation with new tabs
docs.navigation = {
  tabs: [
    {
      tab: "Guides",
      icon: "book-open",
      groups: [
        {
          group: "Get started",
          pages: ["index", "quickstart", "development"]
        },
        {
          group: "Monorepo",
          pages: [
            "guides/structure",
            "guides/packages",
            "guides/tooling",
            "guides/workflow",
            "guides/definition-of-done",
            "guides/scaffolding"
          ]
        }
      ]
    },
    {
      tab: "Constitution",
      icon: "shield",
      groups: [
        {
          group: "Laws",
          pages: [
            "constitution/index",
            "constitution/boundaries",
            "constitution/secrets",
            "constitution/http-and-events"
          ]
        }
      ]
    },
    {
      tab: "Architecture",
      icon: "landmark",
      groups: [
        {
          group: "Decisions",
          pages: [
            "adr/index",
            "adr/0001-monorepo-layout",
            "adr/0002-docs-on-mintlify",
            "adr/0003-tier-dependency-direction",
            "adr/0004-package-archetypes-and-layers",
            "adr/0005-di-container-and-legacy-decorators",
            "adr/0006-naming-exports-and-imports",
            "adr/0007-source-documentation-standard",
            "adr/0008-test-placement",
            "adr/0009-secrets-two-mechanisms",
            "adr/0010-services-are-independent-members",
            "adr/0011-rejected-and-deferred-technologies",
            "adr/0012-code-host-and-ci"
          ]
        }
      ]
    },
    {
      tab: "Standards",
      icon: "check-circle",
      groups: [
        {
          group: "Rules",
          pages: [
            "standards/members",
            "standards/packages",
            "standards/services",
            "standards/apps",
            "standards/code-style",
            "standards/testing",
            "standards/dependencies"
          ]
        }
      ]
    },
    {
      tab: "Runbooks",
      icon: "zap",
      groups: [
        {
          group: "Operations",
          pages: [
            "runbooks/secrets",
            "runbooks/ci",
            "runbooks/release",
            "runbooks/mobile-release"
          ]
        }
      ]
    },
    {
      tab: "Agents",
      icon: "cpu",
      groups: [
        {
          group: "Setup",
          pages: [
            "agents/index",
            "agents/roster",
            "agents/hooks",
            "agents/concurrent-sessions"
          ]
        }
      ]
    },
    {
      tab: "Writing docs",
      icon: "pen-line",
      groups: [
        {
          group: "Authoring",
          pages: [
            "writing/markdown",
            "writing/code",
            "writing/images",
            "writing/components",
            "writing/navigation",
            "writing/reusable-snippets",
            "writing/settings"
          ]
        }
      ]
    }
  ]
};

fs.writeFileSync(docsJsonPath, JSON.stringify(docs, null, 2));

console.log('✓ Updated docs.json navigation');
console.log('  Added tabs: Constitution, Standards, Runbooks, Agents');
console.log('  Updated Architecture tab with ADRs 0003-0012');
NODESCRIPT

echo ""
echo "✓ Subagent 05 complete"
