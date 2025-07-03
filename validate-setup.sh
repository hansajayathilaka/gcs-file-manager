#!/bin/bash

# FileManager Setup Validation Script
# This script validates that the environment is ready for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 FileManager Setup Validation${NC}"
echo "================================"
echo ""

# Initialize counters
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check and report
check_item() {
    local description="$1"
    local command="$2"
    local success_msg="$3"
    local failure_msg="$4"
    
    echo -n "Checking $description... "
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✅${NC}"
        if [ -n "$success_msg" ]; then
            echo "   $success_msg"
        fi
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC}"
        if [ -n "$failure_msg" ]; then
            echo -e "   ${RED}$failure_msg${NC}"
        fi
        ((CHECKS_FAILED++))
    fi
}

# Check prerequisites
echo -e "${BLUE}📋 Prerequisites${NC}"
check_item "Terraform installation" "command -v terraform" "$(terraform version | head -1)" "Install from: https://terraform.io/downloads"
check_item "Google Cloud CLI" "command -v gcloud" "$(gcloud version | head -1)" "Install from: https://cloud.google.com/sdk/docs/install"
check_item "Git installation" "command -v git" "$(git --version)" "Install Git"
check_item "jq installation" "command -v jq" "$(jq --version)" "Install jq for JSON processing"
echo ""

# Check authentication
echo -e "${BLUE}🔐 Authentication${NC}"
CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)
if [ -n "$CURRENT_ACCOUNT" ]; then
    echo -e "Active account: ${GREEN}$CURRENT_ACCOUNT${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ No active gcloud authentication${NC}"
    echo -e "   ${RED}Run: gcloud auth login${NC}"
    ((CHECKS_FAILED++))
fi

CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -n "$CURRENT_PROJECT" ]; then
    echo -e "Current project: ${GREEN}$CURRENT_PROJECT${NC}"
    ((CHECKS_PASSED++))
    
    # Check if project is accessible
    if gcloud projects describe "$CURRENT_PROJECT" &>/dev/null; then
        echo -e "Project access: ${GREEN}✅ Accessible${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ Project not accessible${NC}"
        echo -e "   ${RED}Check project permissions${NC}"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${RED}❌ No active project set${NC}"
    echo -e "   ${RED}Run: gcloud config set project YOUR_PROJECT_ID${NC}"
    ((CHECKS_FAILED++))
fi
echo ""

# Check billing (if project is set)
if [ -n "$CURRENT_PROJECT" ]; then
    echo -e "${BLUE}💳 Billing${NC}"
    if gcloud billing projects describe "$CURRENT_PROJECT" &>/dev/null; then
        BILLING_ACCOUNT=$(gcloud billing projects describe "$CURRENT_PROJECT" --format="value(billingAccountName)" 2>/dev/null)
        if [ -n "$BILLING_ACCOUNT" ]; then
            echo -e "Billing account: ${GREEN}✅ Enabled${NC}"
            echo "   Account: $(basename "$BILLING_ACCOUNT")"
            ((CHECKS_PASSED++))
        else
            echo -e "${RED}❌ No billing account linked${NC}"
            echo -e "   ${YELLOW}Enable billing: https://console.cloud.google.com/billing${NC}"
            ((CHECKS_FAILED++))
        fi
    else
        echo -e "${RED}❌ Cannot check billing status${NC}"
        echo -e "   ${YELLOW}Enable billing: https://console.cloud.google.com/billing${NC}"
        ((CHECKS_FAILED++))
    fi
    echo ""
fi

# Check required APIs (if project is set)
if [ -n "$CURRENT_PROJECT" ]; then
    echo -e "${BLUE}🔌 Required APIs${NC}"
    REQUIRED_APIS=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "artifactregistry.googleapis.com"
        "storage.googleapis.com"
        "iam.googleapis.com"
        "cloudresourcemanager.googleapis.com"
    )
    
    for api in "${REQUIRED_APIS[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            echo -e "API $api: ${GREEN}✅ Enabled${NC}"
            ((CHECKS_PASSED++))
        else
            echo -e "API $api: ${YELLOW}⚠️ Not enabled${NC}"
            echo -e "   ${YELLOW}Will be enabled automatically by Terraform${NC}"
        fi
    done
    echo ""
fi

# Check Terraform configuration
echo -e "${BLUE}🏗️ Terraform Configuration${NC}"
if [ -f "terraform/main.tf" ]; then
    echo -e "Terraform config: ${GREEN}✅ Found${NC}"
    ((CHECKS_PASSED++))
    
    # Check if backend is configured
    if grep -q "backend \"gcs\"" terraform/main.tf; then
        echo -e "GCS backend: ${GREEN}✅ Configured${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "GCS backend: ${RED}❌ Not configured${NC}"
        echo -e "   ${RED}This should not happen with the new setup${NC}"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "Terraform config: ${RED}❌ Not found${NC}"
    echo -e "   ${RED}Run from project root directory${NC}"
    ((CHECKS_FAILED++))
fi
echo ""

# Check bootstrap scripts
echo -e "${BLUE}🚀 Bootstrap Scripts${NC}"
check_item "Linux/Mac bootstrap script" "test -f terraform/bootstrap.sh" "Ready to run" "Script missing"
check_item "Windows PowerShell script" "test -f terraform/bootstrap.ps1" "Ready to run" "Script missing"
echo ""

# Summary
echo -e "${BLUE}📊 Validation Summary${NC}"
echo "===================="
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Environment is ready for deployment!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Run the bootstrap script:"
    echo "   cd terraform"
    echo "   ./bootstrap.sh        # Linux/Mac"
    echo "   .\\bootstrap.ps1       # Windows PowerShell"
    echo ""
    echo "2. Follow the GitHub configuration instructions from the bootstrap output"
    echo ""
    echo "3. Use GitHub Actions for future deployments"
else
    echo -e "${RED}❌ Environment validation failed${NC}"
    echo ""
    echo -e "${YELLOW}Please fix the issues above before running the bootstrap script.${NC}"
    echo ""
    echo -e "${BLUE}Common fixes:${NC}"
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1 | grep -q "^$"; then
        echo "- Authenticate: gcloud auth login"
    fi
    if [ -z "$CURRENT_PROJECT" ]; then
        echo "- Set project: gcloud config set project YOUR_PROJECT_ID"
    fi
    echo "- Enable billing: https://console.cloud.google.com/billing"
    echo ""
fi

exit $CHECKS_FAILED
