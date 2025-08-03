import { render, mockUser, mockPatient, mockStudy } from '../test-utils';

describe('test-utils', () => {
  describe('mock factories', () => {
    test('should create mock user with defaults', () => {
      const user = mockUser();
      
      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        role: expect.any(String),
      });
    });

    test('should create mock user with overrides', () => {
      const user = mockUser({ email: 'custom@example.com', role: 'admin' });
      
      expect(user.email).toBe('custom@example.com');
      expect(user.role).toBe('admin');
    });

    test('should create mock patient with defaults', () => {
      const patient = mockPatient();
      
      expect(patient).toMatchObject({
        id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
        gender: expect.stringMatching(/^(male|female|other)$/),
      });
    });

    test('should create mock study with defaults', () => {
      const study = mockStudy();
      
      expect(study).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        status: expect.any(String),
      });
    });
  });

  describe('custom render', () => {
    test('should render a simple component', () => {
      const TestComponent = () => <div>Test Content</div>;
      
      const { getByText } = render(<TestComponent />);
      
      expect(getByText('Test Content')).toBeInTheDocument();
    });

    test('should provide theme context', () => {
      const TestComponent = () => (
        <div style={{ color: 'primary.main' }}>Themed Content</div>
      );
      
      const { getByText } = render(<TestComponent />);
      
      expect(getByText('Themed Content')).toBeInTheDocument();
    });
  });
});
