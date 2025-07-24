# AIRCID - AI Research Case Identification & Data Integration Tool

A comprehensive frontend application for clinical researchers managing studies with GenAI integration.

## 🚀 Features

- **Dummy Authentication System**: Secure session management with JWT-like tokens
- **GenAI Integration**: Q&A, criteria refinement, form generation, and text summarization
- **Dynamic Form Rendering**: JSON Schema-based forms with validation
- **Interactive Dashboard**: Study management with enrollment statistics
- **Real-time Chat**: AI-powered sidebar for research assistance
- **Data Visualization**: Charts and graphs for study analytics
- **Responsive Design**: Material-UI components optimized for research workflows

## 🛠️ Tech Stack

- **Framework**: Next.js 13.5+ with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Generation**: @rjsf/core (React JSON Schema Form)
- **Charts**: Chart.js with react-chartjs-2
- **Authentication**: Custom JWT-like tokens with sessionStorage

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_GENAI_API_URL=http://localhost:8000
```

## 🔗 Backend Integration

This frontend integrates with a FastAPI backend that provides:

### Authentication
- **POST /token**: Generate JWT tokens for user authentication
- Supports user roles: `researcher`, `admin`
- Tokens are stored in sessionStorage and used for all API calls

### Document Management
- **POST /documents/upload**: Upload PDF, TXT, or image files
- **GET /documents/list**: List all uploaded documents
- **GET /documents/{id}**: Retrieve specific document content
- **DELETE /documents/{id}**: Delete documents
- Automatic text extraction and indexing for search

### Q&A System
- **POST /qna/ask**: Smart question-answering with context
- Uses uploaded documents as knowledge base
- Maintains conversation history for context
- Returns answers with source attribution

### Criteria Augmentation
- **POST /criteria/augment**: Refine clinical trial criteria
- **GET /criteria/versions/{id}**: Retrieve criteria versions
- **POST /criteria/versions/{id}/refine**: Manual refinement
- Version tracking and history management

### Form Generation
- **POST /forms/generate**: Auto-generate JSON schemas from objectives
- **GET /forms/versions/{id}**: Retrieve form versions
- **POST /forms/versions/{id}/refine**: Manual schema refinement
- Full JSON Schema support with validation

### Text Summarization
- **POST /text/summarize**: Generate summaries with context
- Configurable length: short, medium, long
- Raw LLM output available for debugging

## 🏗️ Project Structure

```
/aircid-frontend
├── /app                      # Next.js 13+ app directory
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing page with routing logic
│   └── globals.css          # Global styles
├── /pages                   # Main application pages
│   ├── login.tsx            # Authentication page
│   ├── dashboard.tsx        # Study management dashboard
│   └── study/[id].tsx       # Individual study details
├── /components              # Reusable UI components
│   ├── ProtectedRoute.tsx   # Route protection wrapper
│   ├── JsonFormRenderer.tsx # Dynamic form generation
│   ├── StatChart.tsx        # Data visualization charts
│   ├── GenAIChatSidebar.tsx # AI chat interface
│   ├── CriteriaRefiner.tsx  # AI criteria enhancement
│   ├── DocumentUpload.tsx   # Document management interface
│   ├── TextSummarizer.tsx   # AI text summarization
│   └── FormSchemaGenerator.tsx # AI form creation
├── /context                 # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   └── ChatContext.tsx      # Chat session management
├── /services                # API and business logic
│   ├── authService.ts       # Authentication utilities
│   ├── genaiService.ts      # GenAI API integration
│   └── formService.ts       # Form data management
├── /types                   # TypeScript type definitions
│   └── index.ts             # Shared interfaces
└── /utils                   # Helper utilities
    └── dummyToken.ts        # JWT simulation
```

## 🤖 GenAI Integration

### Backend API Integration

All GenAI features connect to the FastAPI backend:

1. **Q&A System** (`/qna/ask`) - Context-aware question answering
2. **Criteria Augmentation** (`/criteria/augment`) - Clinical criteria refinement
3. **Form Generation** (`/forms/generate`) - JSON schema auto-generation
4. **Text Summarization** (`/text/summarize`) - Document summarization
5. **Document Management** (`/documents/*`) - File upload and indexing

### Authentication

All API requests include JWT authentication:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 🔐 Authentication Flow

1. User enters username on `/login`
2. Frontend calls `/token` endpoint to get JWT from backend
3. Token stored in `sessionStorage` for session persistence
4. All API calls include `Authorization: Bearer <token>` header
5. Protected routes verify token presence

## 📱 Key Components

### Dashboard (`/dashboard`)
- Study overview with enrollment statistics
- Interactive charts (Bar, Pie, Line)
- Quick access to AI tools
- Floating chat button

### Study Detail (`/study/[id]`)
- Individual study management
- Dynamic form rendering
- Inline AI assistance tools
- Progress tracking

### AI Chat Sidebar
- Persistent conversation history
- Context-aware responses
- Source attribution
- Real-time interaction

### Document Upload
- Support for PDF, TXT, and image files
- Automatic text extraction and indexing
- Document list management
- Integration with Q&A system for enhanced responses

### Text Summarizer
- Configurable summary length (short/medium/long)
- Context-aware summarization
- Raw LLM output viewing option
- Copy-to-clipboard functionality

### Form Schema Generator
- AI-powered form creation from study objectives
- Live preview capability
- JSON Schema output
- Production-ready validation

### Criteria Refiner
- Plain text to structured criteria
- AI suggestions for improvement
- Rule-based recommendations
- Regulatory compliance hints

## 🎨 Design System

### Color Palette
- Primary: Material-UI Blue (`#1976d2`)
- Secondary: Teal (`#14B8A6`)
- Success: Green (`#4caf50`)
- Warning: Orange (`#ff9800`)
- Error: Red (`#f44336`)

### Typography
- Font: Inter (Google Fonts)
- Headings: 120% line height
- Body: 150% line height
- Maximum 3 font weights

### Layout
- 8px spacing system
- Consistent elevation (Material Design)
- Responsive breakpoints (mobile, tablet, desktop)
- Proper contrast ratios for accessibility

## 🔄 State Management

### AuthContext
```typescript
{
  user: User | null,
  token: string | null,
  isLoading: boolean,
  login: (username: string) => Promise<void>,
  logout: () => void,
  isAuthenticated: boolean
}
```

### ChatContext
```typescript
{
  messages: ChatMessage[],
  addMessage: (message) => void,
  clearMessages: () => void,
  isOpen: boolean,
  toggleChat: () => void
}
```

### Document State
```typescript
{
  documents: DocumentInfo[],
  uploadDocument: (file: File) => Promise<void>,
  deleteDocument: (id: number) => Promise<void>
}
```

## 📊 Data Models

### Study
```typescript
interface Study {
  id: string;
  title: string;
  objective: string;
  status: 'active' | 'completed' | 'draft';
  created_date: string;
  enrollment_target: number;
  enrollment_current: number;
  last_updated: string;
}
```

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  sources?: string[];
}
```

### Document
```typescript
interface DocumentInfo {
  id: number;
  filename: string;
  file_type: string;
  uploaded_at: string;
  content?: string;
}
```

## 🚧 Future Enhancements

### Backend Integration TODOs
- [ ] Implement `/api/forms/submit` endpoint
- [ ] Real-time notifications system
- [ ] Study collaboration features
- [ ] Advanced analytics dashboard

### Database Integration
- [ ] SQLite setup for offline capability
- [ ] Data synchronization mechanisms
- [ ] Backup and restore functionality

### Advanced Features
- [ ] Role-based permissions
- [ ] Audit trail logging
- [ ] Export capabilities (PDF, Excel)
- [ ] Mobile app companion

## 🧪 Testing

```bash
# Start the FastAPI backend first
# (See backend documentation for setup instructions)

# Install dependencies
npm install

# Run tests (when implemented)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend connection**: Ensure FastAPI server is running on port 8000
2. **Authentication errors**: Check token validity and backend /token endpoint
3. **File upload issues**: Verify file types (PDF, TXT, images) and size limits
4. **GenAI timeout**: Check backend availability and network connection
3. **Form validation**: Ensure schema compliance with JSON Schema Draft 7

### Debug Mode

Form submissions are logged to console for development:
```javascript
console.log('Form submission for study:', studyId);
console.log('Form data:', formData);
```

## 📄 License

This project is for demonstration purposes. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For questions and support, please open an issue on the repository or contact the development team.

---

**AIRCID** - Empowering clinical research with AI-driven insights and seamless data integration.