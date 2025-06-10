#!/bin/bash

# Load fixtures for MTK Care backend
# Run this script from the project root directory

echo "Loading fixtures for MTK Care backend..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif command -v poetry &> /dev/null; then
    echo "Using poetry to run commands..."
    PYTHON_CMD="poetry run python"
else
    PYTHON_CMD="python"
fi

cd backend

# Set default if PYTHON_CMD wasn't set
PYTHON_CMD=${PYTHON_CMD:-python3}

# Load reference data (countries and languages)
echo "Loading reference data fixtures..."
$PYTHON_CMD manage.py loaddata apps/reference_data/fixtures/countries.json
$PYTHON_CMD manage.py loaddata apps/reference_data/fixtures/languages.json

# Load optionlists fixtures in order
echo "Loading optionlists fixtures..."
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/1_referral-types.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/2_referral-statuses.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/3_client-statuses.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/4_referral-priorities.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/5_referral-service-types.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/7_pronouns.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/8_ethnicity.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/9_primary-identity.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/10_secondary-identity.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/11_document-types.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/12_document-bypass-reasons.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/13_contact-phone-types.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/14_contact-email-types.json
$PYTHON_CMD manage.py loaddata apps/optionlists/fixtures/15_common-specific-service-tags.json

# Load client management fixtures
echo "Loading client management fixtures..."
$PYTHON_CMD manage.py loaddata apps/client_management/fixtures/client_option_lists.json

# Load external organisation management fixtures
echo "Loading external organisation management fixtures..."
$PYTHON_CMD manage.py loaddata apps/external_organisation_management/fixtures/optionlists_external_organisation_types.json

# Load user fixtures (group-role mappings)
echo "Loading user fixtures..."
$PYTHON_CMD manage.py loaddata apps/users/fixtures/grouprolemapping.json

echo "All fixtures loaded successfully!"