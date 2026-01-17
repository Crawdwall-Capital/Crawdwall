# 🎯 Crawdwall - Event Crowdfunding Platform

A comprehensive crowdfunding platform for events, connecting organizers with investors through a secure and transparent system.

## 🚀 Live API

**Production URL**: `https://crawdwall-backend.onrender.com` (after deployment)

**API Documentation**: Import `backend/Crawdwall_API_Complete.postman_collection.json` into Postman

## 📋 Project Structure

```
Crawdwall/
├── backend/                 # Node.js API Server
│   ├── src/                # Source code
│   ├── package.json        # Backend dependencies
│   ├── render.yaml         # Deployment config
│   └── Crawdwall_API_Complete.postman_collection.json
├── frontend/               # Frontend (Future)
├── render.yaml             # Root deployment config
└── README.md              # This file
```

## 🎯 Features

### For Organizers
- ✅ User registration and authentication
- ✅ Event proposal submission
- ✅ Proposal status tracking
- ✅ File upload (budgets, revenue plans)
- ✅ Real-time status updates

### For Investors
- ✅ Browse approved investment opportunities
- ✅ View detailed event information
- ✅ Investment tracking
- ✅ Escrow account management

### For Admins
- ✅ Proposal review system
- ✅ Voting and approval workflow
- ✅ OTP-based authentication
- ✅ Admin user management

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **File Upload**: Multer
- **Security**: Helmet, CORS, bcrypt

### Infrastructure
- **Hosting**: Render (Free tier)
- **Database**: Render PostgreSQL
- **SSL**: Automatic HTTPS
- **Monitoring**: Built-in health checks

## 🚀 Quick Start

### Local Development
```bash
# Clone repository
git clone https://github.com/Crawdwall-Capital/Crawdwall.git
cd Crawdwall

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Install and run
npm install
npm run migrate
npm run dev
```

### API Testing
1. Import `backend/Crawdwall_API_Complete.postman_collection.json` into Postman
2. Set `baseUrl` to `http://localhost:3000` (local) or production URL
3. Test all 22 endpoints

## 📦 API Endpoints

### Authentication (5 endpoints)
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user
- `POST /auth/organizer/register` - Register as organizer

### Admin OTP (3 endpoints)
- `POST /auth/admin/request-otp` - Request admin OTP
- `POST /auth/admin/verify-otp` - Verify OTP and login
- `POST /auth/admin/add-admin` - Add new admin

### Organizer Proposals (3 endpoints)
- `POST /organizer/proposals` - Create proposal
- `GET /organizer/proposals` - Get my proposals
- `GET /organizer/proposals/:id/history` - Get status history

### Admin Review (3 endpoints)
- `GET /api/v1/admin/proposals` - Get submitted proposals
- `GET /api/v1/admin/proposals/:id` - Get proposal details
- `POST /api/v1/admin/proposals/:id/vote` - Vote on proposal

### Investor (4 endpoints)
- `GET /api/v1/investor/opportunities` - Get opportunities
- `GET /api/v1/investor/opportunities/:id` - Get opportunity details
- `GET /api/v1/investor/investments` - Get my investments
- `GET /api/v1/investor/escrow` - Get escrow activity

### File Upload (3 endpoints)
- `POST /upload/proposals/:id/files` - Upload files
- `GET /upload/proposals/:id/files` - Get file info
- `DELETE /upload/proposals/:id/files/:type` - Delete file

### System (1 endpoint)
- `GET /health` - Health check

**Total: 22 endpoints** with complete documentation

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-based Access** - ORGANIZER, INVESTOR, ADMIN roles
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Input Validation** - Joi schema validation
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **CORS Protection** - Configured for security
- ✅ **Helmet Security** - HTTP security headers
- ✅ **Environment Variables** - Sensitive data protection

## 🚀 Deployment

### Deploy to Render (Recommended)
1. Fork this repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Click "Apply" - Done! ✨

**Deployment time**: ~15 minutes
**Cost**: Free tier available

### Manual Deployment
See `backend/RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📊 Database Schema

### Core Tables
- **User** - User accounts and authentication
- **Admin** - Admin user management
- **Proposal** - Event proposals from organizers
- **StatusHistory** - Proposal status tracking
- **Review** - Admin reviews and votes
- **InvestorInterest** - Investment tracking
- **OTP** - One-time password management

### Relationships
- Users can have multiple proposals
- Proposals have status history
- Admins can review proposals
- Investors can express interest

## 🧪 Testing

### Test Credentials
```json
{
  "email": "apitest@example.com",
  "password": "ApiTest123!",
  "role": "ORGANIZER"
}
```

### Health Check
```bash
curl https://your-api-url.onrender.com/health
```

### Registration Test
```bash
curl -X POST https://your-api-url.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "password": "TestPass123!",
    "role": "ORGANIZER"
  }'
```

## 📚 Documentation

- **API Guide**: `backend/Crawdwall_API_Complete.postman_collection.json`
- **Deployment**: `backend/RENDER_DEPLOYMENT_GUIDE.md`
- **Environment Setup**: `backend/ENVIRONMENT_SETUP.md`
- **Local Development**: `backend/LOCAL_DEVELOPMENT_GUIDE.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- **Issues**: Create GitHub issues for bugs/features
- **Documentation**: Check the guides in `backend/` directory
- **API Testing**: Use the provided Postman collection

## 📄 License

MIT License - see LICENSE file for details

## 🎉 Status

- ✅ **Backend API**: Complete (22 endpoints)
- ✅ **Database**: PostgreSQL with 8 tables
- ✅ **Authentication**: JWT with role-based access
- ✅ **Documentation**: Complete Postman collection
- ✅ **Deployment**: Ready for Render
- 🚧 **Frontend**: Coming soon

---

**Built with ❤️ by Crawdwall Capital**

*Empowering event organizers and connecting them with investors worldwide.*