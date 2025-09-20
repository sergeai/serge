# LeadAI Platform

A comprehensive AI readiness assessment platform that helps businesses and marketing agencies evaluate their AI adoption potential through strategic, GDPR-compliant insights.

## 🚀 Features

- **User Authentication**: Secure sign-up/sign-in with email and Google OAuth
- **AI Readiness Audits**: Comprehensive analysis across multiple business dimensions
- **Dashboard Analytics**: Real-time insights into audit credits, subscription plans, and audit history
- **Multi-Analysis Types**: Website analysis, social media, operations, competitors, data readiness, and compliance
- **Subscription Management**: Tiered plans with different credit allocations
- **Responsive Design**: Modern, dark-themed UI optimized for all devices

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Icons**: Heroicons
- **Deployment**: Ready for Vercel/Netlify

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Google OAuth credentials (optional, for Google sign-in)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-audit-analysis
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. In the SQL Editor, run the schema from `supabase/schema.sql`

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 5. Set Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs in Supabase Auth settings

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Database Schema

The application uses the following main tables:

### Profiles
- User profile information
- Subscription plans and audit credits
- Company details

### Audits
- Audit requests and results
- AI readiness scores
- Analysis types and recommendations

### Subscriptions
- Subscription management
- Billing periods and status

## 🎨 UI Components

### Authentication Pages
- **Sign In**: Email/password and Google OAuth
- **Sign Up**: User registration with terms acceptance

### Dashboard
- **Overview**: Credits, plan status, and recent audits
- **New Audit**: Business email input and analysis type selection
- **Audit History**: Search and filter previous audits
- **Settings**: Profile management and subscription controls

## 🔒 Security Features

- Row Level Security (RLS) policies
- JWT-based authentication
- GDPR-compliant data handling
- Secure API endpoints

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Netlify

1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Configure environment variables

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎯 Business Logic

### Audit Credits System
- **Starter Plan**: 2 free credits
- **Professional Plan**: 10 credits/month ($29)
- **Enterprise Plan**: Unlimited credits ($99)

### AI Readiness Scoring
- **AI Resilient (80-100)**: Well-positioned for AI adoption
- **AI Adaptable (60-79)**: Solid foundation, needs adjustments
- **AI Vulnerable (0-59)**: Lacks key digital infrastructure

### Analysis Types
1. **Website Analysis**: AI integration potential assessment
2. **Social Media**: Content strategy and presence analysis
3. **Operations**: Process automation opportunities
4. **Competitors**: Market positioning and opportunities
5. **Data Readiness**: Infrastructure assessment
6. **Compliance**: GDPR and regulatory compliance
7. **AI Opportunity**: Comprehensive scoring and recommendations

## 🔧 Customization

### Theming
- Colors defined in `tailwind.config.js`
- Custom CSS classes in `app/globals.css`
- Dark theme optimized design

### Adding New Analysis Types
1. Update `analysisTypes` array in `new-audit/page.tsx`
2. Add corresponding icons and descriptions
3. Update database schema if needed

### Subscription Plans
- Modify plans in `settings/page.tsx`
- Update credit allocations in database
- Integrate with payment providers (Stripe recommended)

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are correctly set

2. **Google OAuth Not Working**
   - Verify redirect URIs in Google Console
   - Check OAuth credentials in Supabase
   - Ensure domain is authorized

3. **Build Errors**
   - Clear `.next` folder and rebuild
   - Check TypeScript errors
   - Verify all dependencies are installed

## 📈 Future Enhancements

- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Advanced audit reports
- [ ] API endpoints for integrations
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] White-label solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@aiauditanalysis.com
- Documentation: [docs.aiauditanalysis.com](https://docs.aiauditanalysis.com)
- Issues: GitHub Issues tab

---

**LeadAI** - Empowering businesses to thrive in the AI era through strategic, compliant insights.
