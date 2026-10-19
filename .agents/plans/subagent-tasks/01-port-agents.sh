#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 01: Port Agents from Figentra"
echo "=========================================="

node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');

const figentraAgentsDir = '/Users/akouta/Projects/.old/old/figentra/.agents/agents';
const stackraAgentsDir = '/Users/akouta/Projects/final-project/.agents/agents';

if (!fs.existsSync(stackraAgentsDir)) {
  fs.mkdirSync(stackraAgentsDir, { recursive: true });
}

if (!fs.existsSync(figentraAgentsDir)) {
  console.log('ERROR: Figentra agents directory not found');
  process.exit(1);
}

const agents = fs.readdirSync(figentraAgentsDir).filter(f => f.endsWith('.md'));

console.log(`\nTotal agents in Figentra: ${agents.length}\n`);

const sdlcAgents = [
  'code-reviewer', 'test-engineer', 'architecture-guardian', 'spec-executor',
  'spec-planner', 'spec-author', 'release-operations', 'package-steward',
  'dependency-steward', 'accessibility-reviewer', 'docs-governance'
];

const categories = { 
  coveredBySdlc: [], 
  productSpecific: [], 
  needed: [],
  skipped: []
};

for (const agentFile of agents) {
  const content = fs.readFileSync(path.join(figentraAgentsDir, agentFile), 'utf8');
  const name = agentFile.replace('.md', '');
  
  // Check if covered by sdlc plugin
  if (sdlcAgents.includes(name)) {
    categories.coveredBySdlc.push(name);
    continue;
  }
  
  // Check if Figentra-specific (vision, tenancy, product rules)
  if (content.includes('@figentra') || 
      content.includes('Figentra') ||
      content.includes('figentra') ||
      name.includes('vision') ||
      name.includes('tenancy') ||
      name.includes('product-')) {
    categories.productSpecific.push(name);
    continue;
  }
  
  // Needed for Stackra - port it
  categories.needed.push({ name, file: agentFile });
}

console.log('=== COVERED BY SDLC PLUGIN (skip) ===');
categories.coveredBySdlc.forEach(a => console.log(`  ✓ ${a}`));

console.log('\n=== PRODUCT-SPECIFIC (skip) ===');
categories.productSpecific.forEach(a => console.log(`  ✗ ${a}`));

console.log('\n=== PORTING TO STACKRA ===');
let ported = 0;

for (const agent of categories.needed) {
  try {
    let content = fs.readFileSync(path.join(figentraAgentsDir, agent.file), 'utf8');
    
    // De-brand
    content = content.replace(/@figentra/g, '@stackra');
    content = content.replace(/Figentra/g, 'Stackra');
    content = content.replace(/figentra/g, 'stackra');
    
    // Update ADR references (will be fixed by citation sweep later)
    content = content.replace(/ADR-0007/g, 'ADR-0005');
    content = content.replace(/ADR-0026/g, 'ADR-0004');
    content = content.replace(/ADR-0034/g, 'ADR-0017');
    
    fs.writeFileSync(path.join(stackraAgentsDir, agent.file), content);
    console.log(`  ✓ ${agent.name}`);
    ported++;
  } catch (err) {
    console.log(`  ✗ ${agent.name}: ${err.message}`);
    categories.skipped.push(agent.name);
  }
}

console.log(`\n=== COMPLETE ===`);
console.log(`Ported: ${ported} agents`);
console.log(`Skipped (sdlc): ${categories.coveredBySdlc.length}`);
console.log(`Skipped (product-specific): ${categories.productSpecific.length}`);
console.log(`Failed: ${categories.skipped.length}`);

// Write analysis report
fs.writeFileSync('.agents/plans/agent-port-report.json', JSON.stringify({
  ported: categories.needed.length,
  coveredBySdlc: categories.coveredBySdlc,
  productSpecific: categories.productSpecific,
  failed: categories.skipped
}, null, 2));

console.log('\nReport: .agents/plans/agent-port-report.json');
NODESCRIPT

echo ""
echo "✓ Subagent 01 complete"
