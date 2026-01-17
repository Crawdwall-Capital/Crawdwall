import json

def create_request(name, method, path, description, body=None, auth=False, response_example=None):
    """Helper to create a request object"""
    request = {
        "name": name,
        "request": {
            "method": method,
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": {
                "raw": f"{{{{baseUrl}}}}{path}",
                "host": ["{{baseUrl}}"],
                "path": path.strip('/').split('/')
            },
            "description": description
        }
    }
    
    if auth:
        request["request"]["auth"] = {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{authToken}}", "type": "string"}]
        }
    
    if body:
        request["request"]["body"] = {
            "mode": "raw",
            "raw": json.dumps(body, indent=2),
            "options": {"raw": {"language": "json"}}
        }
    
    if response_example:
        request["response"] = [{
            "name": "Success Response",
            "status": "OK" if method == "GET" else "Created" if method == "POST" else "OK",
            "code": 200 if method == "GET" else 201 if method == "POST" else 200,
            "_postman_previewlanguage": "json",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": json.dumps(response_example, indent=2)
        }]
    
    return request

# Initialize collection
collection = {
    "info": {
        "_postman_id": "crawdwall-api-complete-v1",
        "name": "Crawdwall API - Complete Documentation",
        "description": "Complete API Documentation for Crawdwall Event Crowdfunding Platform\n\n## Features\n- User Authentication\n- Organizer Proposal Management\n- Admin Review System\n- Investor Opportunities\n- File Upload System\n- OTP-based Admin Authentication\n\n## Base URL\n`http://localhost:3000`\n\n## Authentication\nMost endpoints require Bearer token authentication.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "version": "1.0.0"
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:3000", "type": "string"},
        {"key": "authToken", "value": "", "type": "string"},
        {"key": "proposalId", "value": "", "type": "string"},
        {"key": "adminEmail", "value": "admin@example.com", "type": "string"}
    ],
    "item": []
}

print("Building Postman collection...")

# 1. AUTHENTICATION ENDPOINTS
auth_folder = {
    "name": "1. Authentication",
    "description": "User registration, login, and profile management",
    "item": []
}

auth_folder["item"].append(create_request(
    "Register User",
    "POST",
    "/auth/register",
    "Register a new user. Role can be ORGANIZER, INVESTOR, or ADMIN.",
    body={
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+1234567890",
        "password": "SecurePass123!",
        "role": "ORGANIZER"
    },
    response_example={
        "message": "Registration successful",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkIiwicm9sZSI6Ik9SR0FOSVpFUiJ9...",
        "role": "ORGANIZER"
    }
))

auth_folder["item"].append(create_request(
    "Register Organizer (Specific)",
    "POST",
    "/auth/organizer/register",
    "Register specifically as an organizer. Role is automatically set to ORGANIZER.",
    body={
        "name": "Alice Organizer",
        "email": "alice@example.com",
        "phoneNumber": "+1234567890",
        "password": "OrgPass123!"
    },
    response_example={
        "message": "Registration successful",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "role": "ORGANIZER"
    }
))

auth_folder["item"].append(create_request(
    "Login",
    "POST",
    "/auth/login",
    "Login with email and password to get authentication token.",
    body={
        "email": "john.doe@example.com",
        "password": "SecurePass123!"
    },
    response_example={
        "message": "Login successful",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "role": "ORGANIZER"
    }
))

auth_folder["item"].append(create_request(
    "Get Current User Profile",
    "GET",
    "/auth/me",
    "Get the profile of the currently authenticated user.",
    auth=True,
    response_example={
        "success": True,
        "data": {
            "id": "445257dd-2094-499a-bdbd-e2c5c980a038",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "ORGANIZER",
            "createdAt": "2026-01-16T10:00:00.000Z"
        }
    }
))

auth_folder["item"].append(create_request(
    "Logout",
    "POST",
    "/auth/logout",
    "Logout the current user (invalidate token).",
    auth=True,
    response_example={
        "message": "Logged out successfully"
    }
))

collection["item"].append(auth_folder)

print("✓ Authentication endpoints added")

# 2. ADMIN OTP AUTHENTICATION
admin_otp_folder = {
    "name": "2. Admin OTP Authentication",
    "description": "OTP-based authentication system for admin users",
    "item": []
}

admin_otp_folder["item"].append(create_request(
    "Request Admin OTP",
    "POST",
    "/auth/admin/request-otp",
    "Super admin requests OTP to be sent to another admin email.",
    body={
        "superAdminEmail": "thiscrawdwallcapital@gmail.com",
        "adminEmail": "{{adminEmail}}"
    },
    response_example={
        "message": "OTP sent successfully to admin email",
        "adminEmail": "admin@example.com"
    }
))

admin_otp_folder["item"].append(create_request(
    "Verify Admin OTP",
    "POST",
    "/auth/admin/verify-otp",
    "Verify OTP code to login as admin.",
    body={
        "email": "{{adminEmail}}",
        "otp": "123456"
    },
    response_example={
        "message": "Login successful",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "role": "ADMIN"
    }
))

admin_otp_folder["item"].append(create_request(
    "Add Admin User",
    "POST",
    "/auth/admin/add-admin",
    "Super admin adds a new admin user to the system.",
    body={
        "superAdminEmail": "thiscrawdwallcapital@gmail.com",
        "adminEmail": "newadmin@example.com",
        "adminName": "New Admin"
    },
    response_example={
        "success": True,
        "message": "Admin email newadmin@example.com authorized successfully",
        "admin": {
            "id": "uuid",
            "email": "newadmin@example.com",
            "name": "New Admin",
            "status": "ACTIVE",
            "createdBy": "thiscrawdwallcapital@gmail.com"
        }
    }
))

collection["item"].append(admin_otp_folder)

print("✓ Admin OTP endpoints added")

# 3. ORGANIZER PROPOSAL ENDPOINTS
organizer_folder = {
    "name": "3. Organizer - Proposals",
    "description": "Organizer endpoints for creating and managing proposals",
    "item": []
}

organizer_folder["item"].append(create_request(
    "Create Proposal",
    "POST",
    "/organizer/proposals",
    "Submit a new event proposal. Only for ORGANIZER role.",
    auth=True,
    body={
        "eventTitle": "Afrobeats Concert Lagos 2026",
        "description": "A spectacular Afrobeats concert featuring top Nigerian artists",
        "expectedRevenue": 5000000,
        "timeline": "6 months",
        "pitchVideoUrl": "https://example.com/pitch-video.mp4"
    },
    response_example={
        "id": "proposal-uuid",
        "status": "SUBMITTED",
        "createdAt": "2026-01-16T10:00:00.000Z"
    }
))

organizer_folder["item"].append(create_request(
    "Get My Proposals",
    "GET",
    "/organizer/proposals",
    "Get all proposals created by the authenticated organizer.",
    auth=True,
    response_example=[
        {
            "id": "proposal-uuid",
            "eventTitle": "Afrobeats Concert Lagos 2026",
            "status": "SUBMITTED",
            "lastUpdated": "2026-01-16T10:00:00.000Z"
        }
    ]
))

organizer_folder["item"].append(create_request(
    "Get Proposal Status History",
    "GET",
    "/organizer/proposals/{{proposalId}}/history",
    "Get the status change history for a specific proposal.",
    auth=True,
    response_example=[
        {
            "status": "SUBMITTED",
            "changedAt": "2026-01-16T10:00:00.000Z"
        },
        {
            "status": "IN_REVIEW",
            "changedAt": "2026-01-16T11:00:00.000Z"
        }
    ]
))

collection["item"].append(organizer_folder)

print("✓ Organizer endpoints added")

# 4. ADMIN REVIEW ENDPOINTS
admin_folder = {
    "name": "4. Admin - Review System",
    "description": "Admin endpoints for reviewing and voting on proposals",
    "item": []
}

admin_folder["item"].append(create_request(
    "Get All Submitted Proposals",
    "GET",
    "/api/v1/admin/proposals",
    "Get all proposals with SUBMITTED status for review.",
    auth=True,
    response_example={
        "success": True,
        "data": [
            {
                "id": "proposal-uuid",
                "eventTitle": "Afrobeats Concert Lagos 2026",
                "status": "SUBMITTED"
            }
        ]
    }
))

admin_folder["item"].append(create_request(
    "Get Proposal Details",
    "GET",
    "/api/v1/admin/proposals/{{proposalId}}",
    "Get detailed information about a specific proposal. Status changes to IN_REVIEW.",
    auth=True,
    response_example={
        "success": True,
        "data": {
            "id": "proposal-uuid",
            "title": "Afrobeats Concert Lagos 2026",
            "description": "A spectacular Afrobeats concert",
            "status": "IN_REVIEW",
            "documents": {
                "budget": "/uploads/budgets/file.pdf",
                "revenuePlan": "/uploads/reports/plan.pdf",
                "timeline": "6 months"
            }
        }
    }
))

admin_folder["item"].append(create_request(
    "Submit Vote on Proposal",
    "POST",
    "/api/v1/admin/proposals/{{proposalId}}/vote",
    "Submit a vote (ACCEPT or REJECT) with review comments.",
    auth=True,
    body={
        "vote": "ACCEPT",
        "riskAssessment": "Low risk - well-planned event with strong market demand",
        "revenueComment": "Revenue projections are realistic and achievable",
        "notes": "Recommend approval with standard terms"
    },
    response_example={
        "success": True,
        "data": {
            "currentAcceptVotes": 1,
            "proposalStatus": "APPROVED"
        }
    }
))

collection["item"].append(admin_folder)

print("✓ Admin endpoints added")

# 5. INVESTOR ENDPOINTS
investor_folder = {
    "name": "5. Investor - Opportunities",
    "description": "Investor endpoints for viewing approved investment opportunities",
    "item": []
}

investor_folder["item"].append(create_request(
    "Get All Investment Opportunities",
    "GET",
    "/api/v1/investor/opportunities",
    "Get all approved proposals available for investment. Optional eventType filter.",
    auth=True,
    response_example={
        "success": True,
        "data": [
            {
                "proposalId": "proposal-uuid",
                "title": "Afrobeats Concert Lagos 2026",
                "eventType": "CONCERT",
                "eventDate": "2026-06-20",
                "documentUrl": "/uploads/proposals/pitch.pdf"
            }
        ]
    }
))

investor_folder["item"].append(create_request(
    "Get Investment Opportunity Details",
    "GET",
    "/api/v1/investor/opportunities/{{proposalId}}",
    "Get detailed information about a specific approved opportunity.",
    auth=True,
    response_example={
        "success": True,
        "data": {
            "proposalId": "proposal-uuid",
            "title": "Afrobeats Concert Lagos 2026",
            "eventType": "CONCERT",
            "eventDate": "2026-06-20",
            "documentUrl": "/uploads/proposals/pitch.pdf",
            "status": "APPROVED"
        }
    }
))

investor_folder["item"].append(create_request(
    "Get My Investments",
    "GET",
    "/api/v1/investor/investments",
    "Get all investments made by the authenticated investor.",
    auth=True,
    response_example={
        "success": True,
        "data": []
    }
))

investor_folder["item"].append(create_request(
    "Get Escrow Activity",
    "GET",
    "/api/v1/investor/escrow",
    "Get escrow account activity and balance for the investor.",
    auth=True,
    response_example={
        "success": True,
        "data": {
            "balance": 0,
            "transactions": [],
            "pending": 0
        }
    }
))

collection["item"].append(investor_folder)

print("✓ Investor endpoints added")

# 6. FILE UPLOAD ENDPOINTS
upload_folder = {
    "name": "6. File Upload",
    "description": "Endpoints for uploading and managing proposal files",
    "item": []
}

upload_folder["item"].append({
    "name": "Upload Proposal Files",
    "request": {
        "method": "POST",
        "header": [],
        "body": {
            "mode": "formdata",
            "formdata": [
                {
                    "key": "pitchVideo",
                    "type": "file",
                    "src": "/path/to/video.mp4"
                },
                {
                    "key": "budgetFile",
                    "type": "file",
                    "src": "/path/to/budget.pdf"
                },
                {
                    "key": "revenuePlanFile",
                    "type": "file",
                    "src": "/path/to/revenue-plan.pdf"
                }
            ]
        },
        "url": {
            "raw": "{{baseUrl}}/upload/proposals/{{proposalId}}/files",
            "host": ["{{baseUrl}}"],
            "path": ["upload", "proposals", "{{proposalId}}", "files"]
        },
        "description": "Upload files for a proposal. Supports pitch video, budget file, and revenue plan.",
        "auth": {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{authToken}}", "type": "string"}]
        }
    },
    "response": [{
        "name": "Success Response",
        "status": "OK",
        "code": 200,
        "body": json.dumps({
            "message": "Files uploaded successfully",
            "proposal": {
                "id": "proposal-uuid",
                "eventTitle": "Afrobeats Concert",
                "pitchVideoUrl": "/uploads/pitchVideo/uuid.mp4",
                "budgetFile": "/uploads/budgetFile/uuid.pdf",
                "revenuePlanFile": "/uploads/revenuePlanFile/uuid.pdf"
            }
        }, indent=2)
    }]
})

upload_folder["item"].append(create_request(
    "Get Proposal Files",
    "GET",
    "/upload/proposals/{{proposalId}}/files",
    "Get information about uploaded files for a proposal.",
    auth=True,
    response_example={
        "proposalId": "proposal-uuid",
        "eventTitle": "Afrobeats Concert",
        "files": {
            "pitchVideo": {
                "url": "/uploads/pitchVideo/uuid.mp4",
                "name": "uuid.mp4"
            },
            "budgetFile": {
                "url": "/uploads/budgetFile/uuid.pdf",
                "name": "uuid.pdf"
            }
        }
    }
))

upload_folder["item"].append(create_request(
    "Delete Proposal File",
    "DELETE",
    "/upload/proposals/{{proposalId}}/files/pitchVideo",
    "Delete a specific file from a proposal. fileType can be: pitchVideo, budgetFile, revenuePlanFile",
    auth=True,
    response_example={
        "message": "pitchVideo deleted successfully",
        "proposalId": "proposal-uuid"
    }
))

collection["item"].append(upload_folder)

print("✓ Upload endpoints added")

# 7. SYSTEM ENDPOINTS
system_folder = {
    "name": "7. System",
    "description": "System health and utility endpoints",
    "item": []
}

system_folder["item"].append(create_request(
    "Health Check",
    "GET",
    "/health",
    "Check if the API server is running.",
    response_example={
        "status": "OK",
        "message": "Server is running"
    }
))

collection["item"].append(system_folder)

print("✓ System endpoints added")

# Write to file
output_file = "Crawdwall_API_Complete.postman_collection.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(collection, f, indent=2, ensure_ascii=False)

print(f"\n✅ Complete Postman collection generated: {output_file}")
print(f"📦 Total folders: {len(collection['item'])}")
total_requests = sum(len(folder['item']) for folder in collection['item'])
print(f"📝 Total requests: {total_requests}")
print("\n🚀 Import this file into Postman to get started!")
