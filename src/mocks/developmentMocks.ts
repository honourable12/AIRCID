// Development API Mock
// This file provides API mocking for the running application (not just tests)

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// Mock data for development
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123', // In real app, this would be hashed
    firstname: 'Admin',
    lastname: 'User',
    role: 'admin',
  },
  {
    id: '2', 
    email: 'doctor@example.com',
    password: 'doctor123',
    firstname: 'Dr. Jane',
    lastname: 'Smith',
    role: 'doctor',
  },
  {
    id: '3',
    email: 'coordinator@example.com', 
    password: 'coordinator123',
    firstname: 'John',
    lastname: 'Doe',
    role: 'coordinator',
  },
];

const mockPatients = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    insurance: 'Blue Cross',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com', 
    phone: '555-0124',
    dateOfBirth: '1985-05-15',
    gender: 'female',
    address: '456 Oak Ave',
    city: 'Somewhere',
    state: 'NY',
    zipCode: '67890',
    insurance: 'Aetna',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockStudies = [
  {
    id: '1',
    patientId: '1',
    title: 'Chest X-Ray',
    description: 'Routine chest examination',
    studyDate: new Date().toISOString(),
    modality: 'X-Ray',
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    patientId: '2', 
    title: 'MRI Brain Scan',
    description: 'Neurological assessment',
    studyDate: new Date().toISOString(),
    modality: 'MRI',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockDashboardStats = {
  totalStudies: 156,
  activeStudies: 23,
  totalPatients: 89,
  pendingReviews: 12,
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'patient_enrolled',
    message: 'New patient enrolled in COVID-19 Vaccine Study',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    study: 'COVID-19 Vaccine Study',
  },
  {
    id: '2',
    type: 'study_completed',
    message: 'Study completed for John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    patient: 'John Doe',
  },
  {
    id: '3',
    type: 'form_created', 
    message: 'New patient intake form created',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
];

// Generate JWT-like token (for demo purposes only)
const generateMockToken = (user: any) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: user.id, 
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

// Mock API responses based on URL and method
export const mockApiResponse = async (url: string, options: any = {}) => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  
  console.log(`🔧 Mock API: ${method} ${url}`, body);
  
  // Add realistic delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
  
  // Authentication endpoints
  if (url.includes('/auth/login') && method === 'POST') {
    const { email, password } = body || {};
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      const token = generateMockToken(user);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
              role: user.role,
            },
            token,
          },
          message: 'Login successful',
        }),
      };
    } else {
      return {
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          message: 'Invalid email or password',
        }),
      };
    }
  }
  
  if (url.includes('/auth/logout') && method === 'POST') {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Logout successful',
      }),
    };
  }
  
  // Dashboard endpoints
  if (url.includes('/dashboard/stats')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockDashboardStats,
      }),
    };
  }
  
  if (url.includes('/dashboard/recent-studies')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockRecentActivity,
      }),
    };
  }
  
  // Patients endpoints
  if (url.includes('/patients') && method === 'GET') {
    const page = new URL(url, 'http://localhost').searchParams.get('page') || '1';
    const limit = new URL(url, 'http://localhost').searchParams.get('limit') || '10';
    
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockPatients,
        pagination: {
          page: parseInt(page),
          totalPages: 1,
          totalItems: mockPatients.length,
          itemsPerPage: parseInt(limit),
        },
      }),
    };
  }
  
  if (url.includes('/patients') && method === 'POST') {
    const newPatient = {
      id: String(mockPatients.length + 1),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPatients.push(newPatient);
    
    return {
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: newPatient,
        message: 'Patient created successfully',
      }),
    };
  }
  
  // Studies endpoints
  if (url.includes('/studies') && method === 'GET') {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockStudies,
        pagination: {
          page: 1,
          totalPages: 1,
          totalItems: mockStudies.length,
          itemsPerPage: 10,
        },
      }),
    };
  }
  
  // Forms endpoints
  if (url.includes('/forms') && method === 'GET') {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            name: 'Patient Intake Form',
            description: 'Initial patient information collection',
            schema: {
              type: 'object',
              properties: {
                personalInfo: {
                  type: 'object',
                  title: 'Personal Information',
                  properties: {
                    firstName: { type: 'string', title: 'First Name' },
                    lastName: { type: 'string', title: 'Last Name' },
                    email: { type: 'string', format: 'email', title: 'Email' },
                  },
                  required: ['firstName', 'lastName', 'email'],
                },
              },
            },
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    };
  }
  
  // AI Chat endpoints
  if (url.includes('/ai/chat') && method === 'POST') {
    const { message } = body || {};
    
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          response: `Thank you for your question about "${message}". As an AI medical assistant, I can help provide general information. However, please remember that this is not a substitute for professional medical advice. For your specific question, I would recommend consulting with a healthcare provider for personalized guidance.`,
          timestamp: new Date().toISOString(),
        },
      }),
    };
  }
  
  // Default response for unhandled endpoints
  return {
    ok: false,
    status: 404,
    json: async () => ({
      success: false,
      message: 'API endpoint not found in mock',
    }),
  };
};

// Override fetch only in development mode
if (isDevelopment) {
  const originalFetch = window.fetch;
  
  window.fetch = async (url: string | Request, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.url;
    
    // Only mock API calls (not other resources like images, etc.)
    if (urlString.includes('/api/') || urlString.includes('localhost:3001')) {
      return mockApiResponse(urlString, options);
    }
    
    // Use original fetch for non-API requests
    return originalFetch(url, options);
  };
  
  console.log('🔧 Development API mocking enabled');
  console.log('📧 Available login credentials:');
  console.log('  - admin@example.com / admin123 (Admin)');
  console.log('  - doctor@example.com / doctor123 (Doctor)');
  console.log('  - coordinator@example.com / coordinator123 (Coordinator)');
}

export default mockApiResponse;
