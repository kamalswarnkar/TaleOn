#!/bin/bash

# TaleOn Environment Validation Script
# This script validates that all required environment variables are set for production deployment

set -e

echo "🔍 Validating TaleOn Environment Configuration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if variable is set
check_var() {
    local var_name=$1
    local var_value=$2
    local required=${3:-true}
    
    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name is not set (REQUIRED)${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  $var_name is not set (OPTIONAL)${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✅ $var_name is set${NC}"
        return 0
    fi
}

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
    echo ""
fi

# Check required variables
echo "🔧 Checking required environment variables..."
required_failed=0

check_var "NODE_ENV" "$NODE_ENV" true || required_failed=$((required_failed + 1))
check_var "PORT" "$PORT" true || required_failed=$((required_failed + 1))
check_var "MONGODB_URI" "$MONGODB_URI" true || required_failed=$((required_failed + 1))
check_var "JWT_SECRET" "$JWT_SECRET" true || required_failed=$((required_failed + 1))
check_var "SESSION_SECRET" "$SESSION_SECRET" true || required_failed=$((required_failed + 1))
check_var "GROQ_API_KEY" "$GROQ_API_KEY" true || required_failed=$((required_failed + 1))
check_var "FRONTEND_URL" "$FRONTEND_URL" true || required_failed=$((required_failed + 1))

echo ""
echo "🔧 Checking frontend environment variables..."
check_var "VITE_API_URL" "$VITE_API_URL" true || required_failed=$((required_failed + 1))
check_var "VITE_SOCKET_URL" "$VITE_SOCKET_URL" true || required_failed=$((required_failed + 1))

echo ""
echo "🔧 Checking optional environment variables..."
check_var "EMAIL_USER" "$EMAIL_USER" false
check_var "EMAIL_PASS" "$EMAIL_PASS" false
check_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" false
check_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" false
check_var "OPENAI_API_KEY" "$OPENAI_API_KEY" false

echo ""
echo "🔍 Validating URL formats..."

# Validate URL formats
validate_url() {
    local url=$1
    local name=$2
    
    if [[ $url =~ ^https?:// ]]; then
        echo -e "${GREEN}✅ $name has valid URL format${NC}"
        return 0
    else
        echo -e "${RED}❌ $name has invalid URL format (must start with http:// or https://)${NC}"
        return 1
    fi
}

url_validation_failed=0

if [ -n "$FRONTEND_URL" ]; then
    validate_url "$FRONTEND_URL" "FRONTEND_URL" || url_validation_failed=$((url_validation_failed + 1))
fi

if [ -n "$VITE_API_URL" ]; then
    validate_url "$VITE_API_URL" "VITE_API_URL" || url_validation_failed=$((url_validation_failed + 1))
fi

if [ -n "$VITE_SOCKET_URL" ]; then
    validate_url "$VITE_SOCKET_URL" "VITE_SOCKET_URL" || url_validation_failed=$((url_validation_failed + 1))
fi

echo ""
echo "🔍 Checking secret strength..."

# Check secret strength
check_secret_strength() {
    local secret=$1
    local name=$2
    
    if [ ${#secret} -ge 32 ]; then
        echo -e "${GREEN}✅ $name is sufficiently long (${#secret} characters)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is too short (${#secret} characters, minimum 32 required)${NC}"
        return 1
    fi
}

secret_validation_failed=0

if [ -n "$JWT_SECRET" ]; then
    check_secret_strength "$JWT_SECRET" "JWT_SECRET" || secret_validation_failed=$((secret_validation_failed + 1))
fi

if [ -n "$SESSION_SECRET" ]; then
    check_secret_strength "$SESSION_SECRET" "SESSION_SECRET" || secret_validation_failed=$((secret_validation_failed + 1))
fi

echo ""
echo "📊 Validation Summary:"

total_failed=$((required_failed + url_validation_failed + secret_validation_failed))

if [ $total_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed! Your environment is ready for deployment.${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Run: docker-compose up -d"
    echo "   2. Check health: curl http://127.0.0.1:5000/health"
    echo "   3. Access your app at: $FRONTEND_URL"
    exit 0
else
    echo -e "${RED}❌ Validation failed with $total_failed error(s)${NC}"
    echo ""
    echo "🔧 Fix the issues above before deploying."
    echo ""
    echo "📋 Common fixes:"
    echo "   - Copy env.production.template to .env and fill in your values"
    echo "   - Generate strong secrets: openssl rand -base64 32"
    echo "   - Ensure all URLs start with http:// or https://"
    echo "   - Set up your MongoDB database and get the connection string"
    exit 1
fi
