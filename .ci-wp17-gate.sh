set -u
cd "$(dirname "$0")"
D=.agents/specs/sta-340-call-shape-checks
pnpm spec:gate check "$D" 2>&1 | tail -60; echo "check-exit=${PIPESTATUS[0]}"
pnpm spec:gate tasks "$D/tasks.md" 2>&1 | tail -40; echo "tasks-exit=${PIPESTATUS[0]}"
