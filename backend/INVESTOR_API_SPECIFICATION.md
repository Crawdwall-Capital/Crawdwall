# Investor API Specification

## Overview

Complete API specification for investor functionality in the Crawdwall platform.

## API Endpoints

### 1. Get Investor Profile

**Endpoint**: `GET /api/v1/auth/me`

**Description**: Retrieves the current investor's profile information.

**Authentication**: Bearer Token (JWT)

**Headers**:

- `Authorization: Bearer <token>`

**Success Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@gmail.com",
    "role": "INVESTOR",
    "createdAt": "2026-01-07T10:30:00Z"
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or expired token

---

### 2. View Approved Investment Opportunities

**Endpoint**: `GET /api/v1/investor/opportunities`

**Description**: Retrieves all approved investment opportunities. Optionally filtered by event type.

**Authentication**: Bearer Token (JWT)

**Headers**:

- `Authorization: Bearer <token>`

**Query Parameters (Optional)**:

- `eventType` - Filter by event type (e.g., CONCERT, FESTIVAL)

**Success Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "proposalId": "uuid",
      "title": "Afrobeats Concert Lagos",
      "eventType": "CONCERT",
      "eventDate": "2026-06-20",
      "documentUrl": "/uploads/proposals/afrobeats_proposal.pdf"
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User does not have INVESTOR role

---

### 3. View Single Approved Opportunity

**Endpoint**: `GET /api/v1/investor/opportunities/:proposalId`

**Description**: Retrieves details of a specific approved investment opportunity.

**Authentication**: Bearer Token (JWT)

**Headers**:

- `Authorization: Bearer <token>`

**Path Parameters**:

- `proposalId` (required): UUID of the proposal

**Success Response (200)**:

```json
{
  "success": true,
  "data": {
    "proposalId": "uuid",
    "title": "Afrobeats Concert Lagos",
    "eventType": "CONCERT",
    "eventDate": "2026-06-20",
    "documentUrl": "/uploads/proposals/afrobeats_proposal.pdf",
    "status": "APPROVED"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid proposal ID
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User does not have INVESTOR role
- `404 Not Found`: Proposal not found or not approved

---

### 4. View My Investments

**Endpoint**: `GET /api/v1/investor/investments`

**Description**: Retrieves the investor's current investments.

**Authentication**: Bearer Token (JWT)

**Headers**:

- `Authorization: Bearer <token>`

**Success Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "investmentId": "uuid",
      "proposalTitle": "Afrobeats Concert Lagos",
      "amount": 2000000,
      "status": "ONGOING",
      "expectedROI": "20%",
      "repaymentDate": "2026-09-20"
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User does not have INVESTOR role

---

### 5. View Escrow Activity (Read-Only)

**Endpoint**: `GET /api/v1/investor/escrow`

**Description**: Retrieves the investor's escrow account activity and balance.

**Authentication**: Bearer Token (JWT)

**Headers**:

- `Authorization: Bearer <token>`

**Success Response (200)**:

```json
{
  "success": true,
  "data": {
    "balance": 5000000,
    "transactions": [
      {
        "transactionId": "uuid",
        "amount": 2000000,
        "type": "INVESTMENT",
        "date": "2026-01-10T14:30:00Z",
        "status": "COMPLETED"
      }
    ],
    "pending": 0
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User does not have INVESTOR role

## Security Features

- **Role-Based Access Control**: Only users with `INVESTOR` role can access investor endpoints
- **Token Authentication**: All endpoints require valid JWT tokens
- **Data Validation**: All inputs are validated to prevent injection attacks
- **Proposal Status Verification**: Only approved proposals are accessible to investors

## Business Logic

- Only proposals with status `APPROVED` are returned to investors
- Investment opportunities are sorted by expected revenue (descending)
- Optional filtering by event type (`eventType` parameter)
- All dates follow ISO 8601 format

## Future Enhancements

- Investment tracking system (currently returns placeholder data)
- Escrow system implementation (currently returns placeholder data)
- Transaction history with detailed investment records
- ROI calculations and projections

## Implementation Notes

- The `eventType` field was added to the `Proposal` model to support filtering
- The API follows RESTful conventions with consistent response formats
- All responses include a `success` boolean for easy client-side handling
