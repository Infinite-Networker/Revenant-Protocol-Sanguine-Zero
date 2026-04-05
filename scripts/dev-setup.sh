#!/usr/bin/env bash
# ============================================================
#  REVENANT PROTOCOL: SANGUINE ZERO
#  dev-setup.sh — Developer Environment Setup
#  © 2026 Cherry Computer Ltd.
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🩸  REVENANT PROTOCOL: SANGUINE ZERO                    ║"
echo "║   Developer Setup — Cherry Computer Ltd. © 2026           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Node.js version
REQUIRED_NODE=18
CURRENT_NODE=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo "0")

if [ "$CURRENT_NODE" -lt "$REQUIRED_NODE" ]; then
  echo -e "${RED}[ERROR] Node.js $REQUIRED_NODE+ required. Found: v$CURRENT_NODE${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js v$(node -v | sed 's/v//')${NC}"

# Install dependencies
echo -e "\n${GOLD}Installing dependencies...${NC}"
npm install

echo -e "\n${GOLD}Running test suite...${NC}"
npm test

echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   ✓  Setup complete!                                       ║"
echo "║                                                            ║"
echo "║   npm run dev     → Start development server              ║"
echo "║   npm test        → Run unit tests                        ║"
echo "║   npm run build   → Production build                      ║"
echo "║                                                            ║"
echo "║   Controls: WASD Move | Shift Dash | Z/X/C Attack        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
