import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { mockUser, mockStudy, mockPatient, mockForm } from './test-utils';

// Base API URL
const API_BASE = 'http://localhost:3001/api';

// Mock data
const mockUsers = [
  mockUser({ id: 'user-1', email: 'admin@healthresearch.com', role: 'admin' }),
  mockUser({ id: 'user-2', email: 'coordinator@healthresearch.com', role: 'coordinator' }),
  mockUser({ id: 'user-3', email: 'researcher@healthresearch.com', role: 'researcher' }),
];

const mockStudies = [
  mockStudy({
    id: 'study-1',
    title: 'COVID-19 Vaccine Efficacy Study',
    description: 'Phase III randomized controlled trial evaluating COVID-19 vaccine efficacy',
    status: 'active',
    principalInvestigator: 'Dr. Sarah Johnson',
    targetEnrollment: 1000,
    currentEnrollment: 750,
    enrollmentCount: 750,
    startDate: '2024-01-15',
    endDate: '2024-12-31',
  }),
  mockStudy({
    id: 'study-2',
    title: 'Diabetes Management Digital Health Study',
    description: 'Evaluating digital health interventions for Type 2 diabetes management',
    status: 'recruiting',
    principalInvestigator: 'Dr. Michael Chen',
    targetEnrollment: 500,
    currentEnrollment: 234,
    enrollmentCount: 234,
    startDate: '2024-03-01',
    endDate: '2025-02-28',
  }),
  mockStudy({
    id: 'study-3',
    title: 'Hypertension Medication Comparison',
    description: 'Comparative effectiveness research on hypertension medications',
    status: 'completed',
    principalInvestigator: 'Dr. Emily Rodriguez',
    targetEnrollment: 300,
    currentEnrollment: 300,
    enrollmentCount: 300,
    startDate: '2023-06-01',
    endDate: '2024-05-31',
  }),
  mockStudy({
    id: 'study-4',
    title: 'Mental Health App Intervention',
    description: 'Randomized trial of mobile app intervention for anxiety and depression',
    status: 'draft',
    principalInvestigator: 'Dr. James Wilson',
    targetEnrollment: 800,
    currentEnrollment: 0,
    enrollmentCount: 0,
    startDate: '2024-09-01',
    endDate: '2025-08-31',
  }),
];

const mockPatients = [
  mockPatient({
    id: 'patient-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    age: 45,
    gender: 'male',
    dateOfBirth: '1979-03-15',
    enrolledStudies: ['study-1'],
    medicalHistory: [
      { condition: 'Hypertension', diagnosisDate: '2018-02-10', severity: 'mild' },
      { condition: 'Type 2 Diabetes', diagnosisDate: '2020-06-22', severity: 'moderate' },
    ],
  }),
  mockPatient({
    id: 'patient-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1-555-0456',
    age: 32,
    gender: 'female',
    dateOfBirth: '1992-07-08',
    enrolledStudies: ['study-1', 'study-2'],
    medicalHistory: [
      { condition: 'Asthma', diagnosisDate: '2015-04-18', severity: 'mild' },
    ],
  }),
  mockPatient({
    id: 'patient-3',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@email.com',
    phone: '+1-555-0789',
    age: 58,
    gender: 'male',
    dateOfBirth: '1966-11-30',
    enrolledStudies: ['study-3'],
    medicalHistory: [
      { condition: 'Hypertension', diagnosisDate: '2010-01-05', severity: 'moderate' },
      { condition: 'High Cholesterol', diagnosisDate: '2012-09-14', severity: 'mild' },
    ],
  }),
  mockPatient({
    id: 'patient-4',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1-555-0321',
    age: 28,
    gender: 'female',
    dateOfBirth: '1996-05-12',
    enrolledStudies: ['study-2'],
    medicalHistory: [],
  }),
];

const mockForms = [
  mockForm({
    id: 'form-1',
    title: 'Patient Intake Form',
    description: 'Standard patient information collection form',
    isActive: true,
    fields: [
      { id: 'field-1', type: 'text', label: 'Full Name', required: true },
      { id: 'field-2', type: 'email', label: 'Email Address', required: true },
      { id: 'field-3', type: 'tel', label: 'Phone Number', required: true },
      { id: 'field-4', type: 'date', label: 'Date of Birth', required: true },
      { id: 'field-5', type: 'select', label: 'Gender', required: true, options: ['male', 'female', 'other'] },
    ],
  }),
  mockForm({
    id: 'form-2',
    title: 'Medical History Form',
    description: 'Comprehensive medical history collection',
    isActive: true,
    fields: [
      { id: 'field-6', type: 'textarea', label: 'Current Medications', required: false },
      { id: 'field-7', type: 'textarea', label: 'Medical Conditions', required: false },
      { id: 'field-8', type: 'textarea', label: 'Allergies', required: false },
      { id: 'field-9', type: 'select', label: 'Insurance Type', required: true, options: ['Private', 'Medicare', 'Medicaid', 'Uninsured'] },
    ],
  }),
  mockForm({
    id: 'form-3',
    title: 'Study Consent Form',
    description: 'Informed consent for research participation',
    isActive: false,
    fields: [
      { id: 'field-10', type: 'checkbox', label: 'I consent to participate in this study', required: true },
      { id: 'field-11', type: 'checkbox', label: 'I consent to data sharing for research purposes', required: false },
      { id: 'field-12', type: 'text', label: 'Emergency Contact Name', required: true },
      { id: 'field-13', type: 'tel', label: 'Emergency Contact Phone', required: true },
    ],
  }),
];

const mockChatMessages = [
  {
    id: 'msg-1',
    content: 'Hello! I\'m your AI research assistant. I can help you with study design, patient enrollment analysis, data interpretation, and research best practices. What would you like to explore today?',
    sender: 'ai',
    timestamp: '2024-08-02T09:00:00Z',
  },
];

// MSW server setup
export const server = setupServer(
  // Authentication endpoints
  rest.post(`${API_BASE}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body as any;
    const user = mockUsers.find(u => u.email === email);
    
    if (user && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user,
            token: 'mock-jwt-token-' + user.id,
          },
          message: 'Login successful',
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid credentials',
      })
    );
  }),

  rest.post(`${API_BASE}/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logout successful',
      })
    );
  }),

  // Dashboard endpoints
  rest.get(`${API_BASE}/dashboard/stats`, (req, res, ctx) => {
    const stats = {
      totalStudies: mockStudies.length,
      activeStudies: mockStudies.filter(s => s.status === 'active').length,
      totalEnrollment: mockStudies.reduce((sum, s) => sum + (s.currentEnrollment || 0), 0),
      averageEnrollmentRate: Math.round(
        mockStudies.reduce((sum, s) => 
          sum + (s.targetEnrollment ? ((s.currentEnrollment || 0) / s.targetEnrollment) * 100 : 0), 0
        ) / mockStudies.length
      ),
      recentActivity: [
        {
          id: 'activity-1',
          description: 'New patient enrolled in COVID-19 Vaccine Study',
          timestamp: '2024-08-02T08:30:00Z',
        },
        {
          id: 'activity-2',
          description: 'Study protocol updated for Diabetes Management Study',
          timestamp: '2024-08-02T07:15:00Z',
        },
        {
          id: 'activity-3',
          description: 'Data export completed for Hypertension Study',
          timestamp: '2024-08-01T16:45:00Z',
        },
      ],
    };

    return res(ctx.status(200), ctx.json(stats));
  }),

  rest.get(`${API_BASE}/dashboard/recent-studies`, (req, res, ctx) => {
    const limit = parseInt(req.url.searchParams.get('limit') || '5');
    const recentStudies = mockStudies
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);

    return res(ctx.status(200), ctx.json(recentStudies));
  }),

  // Studies endpoints
  rest.get(`${API_BASE}/studies`, (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10');
    const status = req.url.searchParams.get('status');
    const search = req.url.searchParams.get('q');

    let filteredStudies = [...mockStudies];

    if (status) {
      filteredStudies = filteredStudies.filter(s => s.status === status);
    }

    if (search) {
      filteredStudies = filteredStudies.filter(s => 
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.principalInvestigator.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedStudies = filteredStudies.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        data: paginatedStudies,
        pagination: {
          page,
          pageSize,
          total: filteredStudies.length,
          totalPages: Math.ceil(filteredStudies.length / pageSize),
        },
      })
    );
  }),

  rest.get(`${API_BASE}/studies/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const study = mockStudies.find(s => s.id === id);

    if (study) {
      return res(ctx.status(200), ctx.json(study));
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Study not found',
      })
    );
  }),

  rest.post(`${API_BASE}/studies`, (req, res, ctx) => {
    const studyData = req.body as any;
    const newStudy = mockStudy({
      id: `study-${Date.now()}`,
      ...studyData,
      currentEnrollment: 0,
      enrollmentCount: 0,
    });

    mockStudies.push(newStudy);

    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newStudy,
        message: 'Study created successfully',
      })
    );
  }),

  rest.put(`${API_BASE}/studies/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const updateData = req.body as any;
    const studyIndex = mockStudies.findIndex(s => s.id === id);

    if (studyIndex !== -1) {
      mockStudies[studyIndex] = { ...mockStudies[studyIndex], ...updateData };
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: mockStudies[studyIndex],
          message: 'Study updated successfully',
        })
      );
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Study not found',
      })
    );
  }),

  rest.delete(`${API_BASE}/studies/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const studyIndex = mockStudies.findIndex(s => s.id === id);

    if (studyIndex !== -1) {
      mockStudies.splice(studyIndex, 1);
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Study deleted successfully',
        })
      );
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Study not found',
      })
    );
  }),

  // Patients endpoints
  rest.get(`${API_BASE}/patients`, (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10');
    const gender = req.url.searchParams.get('gender');
    const search = req.url.searchParams.get('q');

    let filteredPatients = [...mockPatients];

    if (gender) {
      filteredPatients = filteredPatients.filter(p => p.gender === gender);
    }

    if (search) {
      filteredPatients = filteredPatients.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        data: paginatedPatients,
        pagination: {
          page,
          pageSize,
          total: filteredPatients.length,
          totalPages: Math.ceil(filteredPatients.length / pageSize),
        },
      })
    );
  }),

  rest.get(`${API_BASE}/patients/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const patient = mockPatients.find(p => p.id === id);

    if (patient) {
      return res(ctx.status(200), ctx.json(patient));
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Patient not found',
      })
    );
  }),

  rest.post(`${API_BASE}/patients`, (req, res, ctx) => {
    const patientData = req.body as any;
    const newPatient = mockPatient({
      id: `patient-${Date.now()}`,
      ...patientData,
      age: new Date().getFullYear() - new Date(patientData.dateOfBirth).getFullYear(),
      enrolledStudies: [],
      medicalHistory: patientData.medicalHistory || [],
    });

    mockPatients.push(newPatient);

    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newPatient,
        message: 'Patient created successfully',
      })
    );
  }),

  rest.put(`${API_BASE}/patients/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const updateData = req.body as any;
    const patientIndex = mockPatients.findIndex(p => p.id === id);

    if (patientIndex !== -1) {
      mockPatients[patientIndex] = { ...mockPatients[patientIndex], ...updateData };
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: mockPatients[patientIndex],
          message: 'Patient updated successfully',
        })
      );
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Patient not found',
      })
    );
  }),

  rest.delete(`${API_BASE}/patients/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const patientIndex = mockPatients.findIndex(p => p.id === id);

    if (patientIndex !== -1) {
      mockPatients.splice(patientIndex, 1);
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Patient deleted successfully',
        })
      );
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Patient not found',
      })
    );
  }),

  // Forms endpoints
  rest.get(`${API_BASE}/forms`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockForms));
  }),

  rest.get(`${API_BASE}/forms/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const form = mockForms.find(f => f.id === id);

    if (form) {
      return res(ctx.status(200), ctx.json(form));
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Form not found',
      })
    );
  }),

  rest.post(`${API_BASE}/forms`, (req, res, ctx) => {
    const formData = req.body as any;
    const newForm = mockForm({
      id: `form-${Date.now()}`,
      ...formData,
    });

    mockForms.push(newForm);

    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newForm,
        message: 'Form created successfully',
      })
    );
  }),

  rest.put(`${API_BASE}/forms/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const updateData = req.body as any;
    const formIndex = mockForms.findIndex(f => f.id === id);

    if (formIndex !== -1) {
      mockForms[formIndex] = { ...mockForms[formIndex], ...updateData };
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: mockForms[formIndex],
          message: 'Form updated successfully',
        })
      );
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Form not found',
      })
    );
  }),

  rest.delete(`${API_BASE}/forms/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const formIndex = mockForms.findIndex(f => f.id === id);

    if (formIndex !== -1) {
      mockForms.splice(formIndex, 1);
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Form deleted successfully',
        })
      );
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Form not found',
      })
    );
  }),

  // AI Chat endpoints
  rest.get(`${API_BASE}/chat/history`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockChatMessages));
  }),

  rest.post(`${API_BASE}/chat/message`, (req, res, ctx) => {
    const { message } = req.body as any;
    
    // Simulate AI response based on message content
    let aiResponse = 'I understand your question. Let me help you with that.';
    
    if (message.toLowerCase().includes('enrollment')) {
      aiResponse = `Based on your current studies, I can see that your COVID-19 Vaccine Study has excellent enrollment at 75% (750/1000 patients), while your Diabetes Management Study is at 47% (234/500 patients). 

To improve enrollment rates, consider:
1. Expanding eligibility criteria slightly if scientifically appropriate
2. Increasing community outreach and partnerships
3. Offering flexible scheduling options
4. Providing participation incentives within ethical guidelines

Would you like me to analyze specific demographic patterns in your enrollment data?`;
    } else if (message.toLowerCase().includes('study design')) {
      aiResponse = `I can help you with study design best practices. For clinical research, consider these key elements:

1. **Primary Endpoint**: Clear, measurable, and clinically meaningful
2. **Sample Size**: Powered to detect meaningful clinical differences
3. **Randomization**: Proper allocation concealment and stratification
4. **Blinding**: Appropriate level based on intervention type
5. **Inclusion/Exclusion Criteria**: Balanced between generalizability and safety

What specific aspect of study design would you like to explore further?`;
    } else if (message.toLowerCase().includes('data') || message.toLowerCase().includes('analysis')) {
      aiResponse = `For data analysis in clinical research, I recommend:

1. **Pre-specify Analysis Plan**: Define primary and secondary analyses before unblinding
2. **Handle Missing Data**: Use appropriate imputation methods (LOCF, MMRM, etc.)
3. **Multiple Comparisons**: Apply corrections when testing multiple endpoints
4. **Effect Size Interpretation**: Focus on clinical significance, not just statistical
5. **Sensitivity Analyses**: Test robustness of findings

Which dataset or analysis type are you working with? I can provide more specific guidance.`;
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date().toISOString(),
    };

    mockChatMessages.push({
      id: `msg-user-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
    }, newMessage);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: newMessage,
        message: 'Message sent successfully',
      })
    );
  }),

  rest.delete(`${API_BASE}/chat/history`, (req, res, ctx) => {
    mockChatMessages.length = 1; // Keep welcome message
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Chat history cleared successfully',
      })
    );
  }),

  // File upload endpoint
  rest.post(`${API_BASE}/upload`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          fileId: `file-${Date.now()}`,
          filename: 'uploaded-file.csv',
          url: '/uploads/uploaded-file.csv',
        },
        message: 'File uploaded successfully',
      })
    );
  }),

  // Data export endpoint
  rest.post(`${API_BASE}/export`, (req, res, ctx) => {
    const { studyId, format } = req.body as any;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          downloadUrl: `/downloads/study-${studyId}-data.${format}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        },
        message: 'Export prepared successfully',
      })
    );
  }),
);

// Start server in development mode
if (process.env.NODE_ENV === 'development') {
  server.listen({
    onUnhandledRequest: 'warn',
  });
}
