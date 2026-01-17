# Crawdwall API - Quick Reference

## 🎯 Base URL
```
http://localhost:3000
```

## 📋 Quick Endpoint Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/organizer/register` | No | Register as organizer |
| POST | `/auth/login` | No | Login user |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/auth/logout` | Yes | Logout user |

### Admin OTP
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/admin/request-otp` | No | Request OTP for admin |
| POST | `/auth/admin/verify-otp` | No | Verify OTP and login |
| POST | `/auth/admin/add-admin` | No | Add new admin user |

### Organizer Proposals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/organizer/proposals` | Yes | Create proposal |
| GET | `/organizer/proposals` | Yes | Get my proposals |
| GET | `/organizer/proposals/:id/history` | Yes | Get status history |

### Admin Review
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/proposals` | Yes | Get submitted proposals |
| GET | `/api/v1/admin/proposals/:id` | Yes | Get proposal details |
| POST | `/api/v1/admin/proposals/:id/vote` | Yes | Vote on proposal |

### Investor
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/investor/opportunities` | Yes | Get opportunities |
| GET | `/api/v1/investor/opportunities/:id` | Yes | Get opportunity details |
| GET | `/api/v1/investor/investments` | Yes | Get my investments |
| GET | `/api/v1/investor/escrow` | Yes | Get escrow activity |

### File Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload/proposals/:id/files` | Yes | Upload files |
| GET | `/upload/proposals/:id/files` | Yes | Get file info |
| DELETE | `/upload/proposals/:id/files/:type` | Yes | Delete file |

### System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |

## 🔑 Authentication

Add Bearer token to headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## 📦 Files Generated

1. **Crawdwall_API_Complete.postman_collection.json** - Import this into Postman
2. **POSTMAN_COLLECTION_README.md** - Detailed usage guide
3. **API_SUMMARY.md** - This quick reference

## ✅ What's Working

- ✅ PostgreSQL database with direct queries (Prisma removed)
- ✅ User registration and authentication
- ✅ JWT token-based auth
- ✅ All CRUD operations for proposals
- ✅ Admin review system
- ✅ Investor opportunities
- ✅ File upload system
- ✅ OTP-based admin authentication
- ✅ Role-based access control

## 🚀 Next Steps

1. Import `Crawdwall_API_Complete.postman_collection.json` into Postman
2. Set your `baseUrl` variable
3. Register a user or login
4. Start testing endpoints!

## 📝 Notes

- All endpoints return JSON
- Timestamps are in ISO 8601 format
- UUIDs are used for all IDs
- Passwords are hashed with bcrypt
- JWT tokens expire after 7 days
