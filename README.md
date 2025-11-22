# NAMECARD.MY - Smart Networking App

A comprehensive smart networking application that revolutionizes business card management and professional networking.

## Overview

NAMECARD.MY is an innovative mobile application designed to digitize and streamline professional networking. The app allows users to create, share, and manage digital business cards while building meaningful professional connections.

## Features

### Core Functionality
- **Digital Business Cards**: Create and customize professional digital business cards
- **QR Code Sharing**: Instant contact sharing via QR codes
- **Contact Management**: Organize and manage professional contacts
- **Network Building**: Build and maintain professional networks
- **Authentication System**: Secure user authentication with Supabase

### Technical Stack
- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Mobile Development**: Cross-platform iOS and Android support
- **Database**: Real-time PostgreSQL database with Row Level Security (RLS)

## Project Structure

```
namecard-my/
├── components/          # React Native components
│   └── AuthScreen.tsx   # Authentication screen component
├── database/           # Database migrations and schema
│   └── migrations/     # SQL migration files
├── mcp-servers/        # MCP server configurations
├── NamecardMobile/     # Mobile app source code
└── docs/              # Documentation files
```

## Documentation

### Implementation Guides
- [Authentication Setup Guide](AUTHENTICATION-SETUP-GUIDE.md)
- [Database Schema Documentation](DATABASE-SCHEMA.md)
- [Development Roadmap](DEVELOPMENT-ROADMAP.md)
- [Context Engineering Guide](CONTEXT-ENGINEERING-GUIDE.md)

### Feature Specifications
- [Product Brief](NAMECARD-MY-PRODUCT-BRIEF.md)
- [Subscription Tiers](SUBSCRIPTION-TIERS.md)
- [UI/UX Wireframes](UI-UX-WIREFRAMES.md)
- [Premium Integration](PREMIUM-INTEGRATION-PROMPTS.md)

### Technical Documentation
- [Distributor System Design](DISTRIBUTOR-SYSTEM-DESIGN.md)
- [Implementation Status Analysis](IMPLEMENTATION-STATUS-ANALYSIS.md)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Supabase account
- React Native development environment

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jacobngai/namecard-my.git
cd namecard-my
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
expo start
```

## Development

### Database Setup
The project uses Supabase for backend services. Run the migration files in the `database/migrations/` directory to set up the database schema.

### Authentication
Authentication is handled through Supabase Auth with support for email/password and social logins.

### MCP Integration
The project includes MCP (Model Context Protocol) server configurations for AI-assisted development.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Contact

For questions or support, please contact the development team.

---

**NAMECARD.MY** - Revolutionizing Professional Networking