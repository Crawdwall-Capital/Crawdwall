import json

# Complete Postman Collection Generator for Crawdwall API

collection = {
    "info": {
        "_postman_id": "crawdwall-complete-api-2026",
        "name": "Crawdwall API - Complete Documentation",
        "description": "Complete API Documentation for Crawdwall Event Crowdfunding Platform\n\n## Authentication\nMost endpoints require Bearer token. Get token from login/register.\n\n## Base URL\nhttp://localhost:3000",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "version": "1.0.0"
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:3000", "type": "string"},
        {"key": "authToken", "value": "", "type": "string"},
        {"key": "proposalId", "value": "", "type": "string"},
        {"key": "userId", "value": "", "type": "string"}
    ],
    "item": []
}

def create_request(name, method, path, body=None, auth=False, description=""):
    req = {
        "name": name,
        "request": {
            "method": method,
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": {
                "raw": f"{{{{baseUrl}}}}{path}",
                "host": ["{{baseUrl}}"],
                "path": [p for p in path.split("/") if p]
            },
            "description": description
        },
        "response": []
    }
    
    if auth:
        req["request"]["auth"] = {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{authToken}}", "type": "string"}]
        }
    
    if body:
        req["request"]["body"] = {
            "mode": "raw",
            "raw": json.dumps(body, indent=2),
            "options": {"raw": {"language": "json"}}
        }
    
    return req

# 1. AUTHENTICATION
auth_items = []

auth_items.append(create_request(
    "Register User",
    "POST",
    "/auth/register",
    {
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+1234567890",
        "password": "SecurePass123!",
        "role": "ORGANIZER"
    },
    False,
    "Register a new user. Role can be: ORGANIZER, INVESTOR, or ADMIN"
))

auth_items.append(create_request(
    "Register Organizer (Specific)",
    "POST",
    "/auth/organizer/register",
    {
        "name": "Alice Organizer",
        "email": "alice@example.com",
        "phoneNumber": "+1234567890",
        "password": "OrgPass123!"
    },
    False,
    "Register specifically as an organizer"
))

auth_items.append(create_request(
    "Login",
    "POST",
    "/auth/login",
    {
        "email": "john@example.com",
        "password": "SecurePass123!"
    },
    False,
    "Login with email and password. Returns JWT token."
))

auth_items.append(create_request(
    "Get Current User Profile",
    "GET",
    "/auth/me",
    None,
    True,
    "Get currently logged in user profile"
))

auth_items.append(create_request(
    "Logout",
    "POST",
    "/auth/logout",
    None,
    True,
    "Logout current user"
))

auth_items.append(create_request(
    "Request Admin OTP",
    "POST",
    "/auth/admin/request-otp",
    {
        "superAdminEmail": "thiscrawdwallcapital@gmail.com",
        "adminEmail": "newadmin@example.com"
    },
    False,
    "Super admin requests OTP for new admin"
))

auth_items.append(create_request(
    "Verify Admin OTP",
    "POST",
    "/auth/admin/verify-otp",
    {
        "email": "newadmin@example.com",
        "otp": "123456"
    },
    False,
    "Verify OTP and get admin token"
))

auth_items.append(create_request(
    "Add Admin User",
    "POST",
    "/auth/admin/add-admin",
    {
        "superAdminEmail": "thiscrawdwallcapital@gmail.com",
        "adminEmail": "newadmin@example.com",
        "adminName": "New Admin"
    },
    False,
    "Super admin adds new admin user"
))

collection["item"].append({
    "name": "1. Authentication",
    "description": "User registration, login, and admin management",
    "item": auth_items
})

# 2. ORGANIZER - PROPOSALS
organizer_items = []

organizer_items.append(create_request(
    "Create Proposal",
    "POST",
    "/organizer/proposals",
    {
        "eventTitle": "Afrobeats Concert Lagos 2026",
        "description": "A spectacular Afrobeats concert featuring top artists",
        "expectedRevenue": 5000000,
        "timeline": "6 months",
        "pitchVideoUrl": "https://example.com/pitch.mp4"
    },
    True,
    "Create a new event proposal (Organizer only)"
))

organizer_items.append(create_request(
    "Get My Proposals",
    "GET",
    "/organizer/proposals",
    None,
    True,
    "Get all proposals created by current organizer"
))

organizer_items.append(create_request(
    "Get Proposal Status History",
    "GET",
    "/organizer/proposals/{{proposalId}}/history",
    None,
    True,
    "Get status change history for a specific proposal"
))

collection["item"].append({
    "name": "2. Organizer - Proposals",
    "description": "Proposal management for organizers",
    "item": organizer_items
})

# 3. ADMIN - REVIEW
admin_items = []

admin_items.append(create_request(
    "Get All Submitted Proposals",
    "GET",
    "/api/v1/admin/proposals",
    None,
    True,
    "Get all proposals with SUBMITTED status (Admin only)"
))

admin_items.append(create_request(
    "Get Proposal Details",
    "GET",
    "/api/v1/admin/proposals/{{proposalId}}",
    None,
    True,
    "Get detailed proposal information. Status changes to IN_REVIEW (Admin only)"
))

admin_items.append(create_request(
    "Submit Vote on Proposal",
    "POST",
    "/api/v1/admin/proposals/{{proposalId}}/vote",
    {
        "vote": "ACCEPT",
        "riskAssessment": "Low risk - well-planned event with strong market demand",
        "revenueComment": "Revenue projections are realistic and achievable",
        "notes": "Recommend approval with standard terms"
    },
    True,
    "Submit vote (ACCEPT/REJECT) and review for a proposal (Admin only)"
))

collection["item"].append({
    "name": "3. Admin - Review System",
    "description": "Admin proposal review and voting",
    "item": admin_items
})

# 4. INVESTOR - OPPORTUNITIES
investor_items = []

investor_items.append(create_request(
    "Get Investment Opportunities",
    "GET",
    "/api/v1/investor/opportunities",
    None,
    True,
    "Get all approved investment opportunities (Investor only)"
))

investor_items.append(create_request(
    "Get Investment Opportunities (Filtered)",
    "GET",
    "/api/v1/investor/opportunities?eventType=CONCERT",
    None,
    True,
    "Get approved opportunities filtered by event type"
))

investor_items.append(create_request(
    "Get Specific Opportunity",
    "GET",
    "/api/v1/investor/opportunities/{{proposalId}}",
    None,
    True,
    "Get detailed information about a specific investment opportunity"
))

investor_items.append(create_request(
    "Get My Investments",
    "GET",
    "/api/v1/investor/investments",
    None,
    True,
    "Get all investments made by current investor (Placeholder)"
))

investor_items.append(create_request(
    "Get Escrow Activity",
    "GET",
    "/api/v1/investor/escrow",
    None,
    True,
    "Get escrow account activity and balance (Placeholder)"
))

collection["item"].append({
    "name": "4. Investor - Opportunities",
    "description": "Investment opportunities for investors",
    "item": investor_items
})

# 5. FILE UPLOAD
upload_items = []

# Note: File upload requires multipart/form-data
upload_items.append({
    "name": "Upload Proposal Files",
    "request": {
        "method": "POST",
        "header": [],
        "body": {
            "mode": "formdata",
            "formdata": [
                {"key": "pitchVideo", "type": "file", "src": ""},
                {"key": "budgetFile", "type": "file", "src": ""},
                {"key": "revenuePlanFile", "type": "file", "src": ""}
            ]
        },
        "url": {
            "raw": "{{baseUrl}}/upload/proposals/{{proposalId}}/files",
            "host": ["{{baseUrl}}"],
            "path": ["upload", "proposals", "{{proposalId}}", "files"]
        },
        "description": "Upload files for a proposal (Organizer only). Accepts: pitchVideo, budgetFile, revenuePlanFile",
        "auth": {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{authToken}}", "type": "string"}]
        }
    },
    "response": []
})

upload_items.append(create_request(
    "Get Proposal Files",
    "GET",
    "/upload/proposals/{{proposalId}}/files",
    None,
    True,
    "Get information about uploaded files for a proposal"
))

upload_items.append(create_request(
    "Delete Proposal File",
    "DELETE",
    "/upload/proposals/{{proposalId}}/files/pitchVideo",
    None,
    True,
    "Delete a specific file. fileType can be: pitchVideo, budgetFile, revenuePlanFile"
))

collection["item"].append({
    "name": "5. File Upload",
    "description": "File upload and management for proposals",
    "item": upload_items
})

# 6. SYSTEM
system_items = []

system_items.append(create_request(
    "Health Check",
    "GET",
    "/health",
    None,
    False,
    "Check if server is running"
))

collection["item"].append({
    "name": "6. System",
    "description": "System health and status endpoints",
    "item": system_items
})

# Write to file
with open("Crawdwall_API_Complete.postman_collection.json", "w") as f:
    json.dump(collection, f, indent=2)

print(" Complete Postman collection generated!")
print(" File: Crawdwall_API_Complete.postman_collection.json")
print(" Total endpoints:", sum(len(folder["item"]) for folder in collection["item"]))
