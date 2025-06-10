#!/bin/bash

# Load essential fixtures for MTK Care backend
# Run this script from the project root directory

echo "Loading essential fixtures for MTK Care backend..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

cd backend

# Try to find python3
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "Error: Python not found. Please install Python or activate your virtual environment."
    exit 1
fi

echo "Using Python command: $PYTHON_CMD"

# First run migrations to ensure roles are created
echo "0. Running migrations to ensure roles are created..."
$PYTHON_CMD manage.py migrate users || echo "   ⚠️  Failed to run migrations"

echo ""
# Load fixtures individually with error handling
echo "1. Loading reference data..."
echo "   - Countries..."
$PYTHON_CMD manage.py loaddata apps/reference_data/fixtures/countries.json || echo "   ⚠️  Failed to load countries"

echo "   - Languages..."
$PYTHON_CMD manage.py loaddata apps/reference_data/fixtures/languages.json || echo "   ⚠️  Failed to load languages"

echo ""
echo "2. Loading option lists..."
echo "   - Client statuses..."
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/3_client-statuses.json || echo "   ⚠️  Failed to load client statuses"

echo "   - Referral types..."
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/1_referral-types.json || echo "   ⚠️  Failed to load referral types"

echo "   - Referral statuses..."
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/2_referral-statuses.json || echo "   ⚠️  Failed to load referral statuses"

echo "   - Other option lists..."
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/4_referral-priorities.json || echo "   ⚠️  Failed"
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/5_referral-service-types.json || echo "   ⚠️  Failed"
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/7_pronouns.json || echo "   ⚠️  Failed"
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/8_ethnicity.json || echo "   ⚠️  Failed"

echo ""
echo "Essential fixtures loaded. You can now create clients and referrals."
echo ""
echo "Note: Some fixtures may have failed if they depend on data that doesn't exist yet."
echo "This is normal for a fresh database. The essential data for client creation should be loaded."