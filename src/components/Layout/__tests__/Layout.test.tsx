import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render } from '@/utils/test-utils';
import Layout from '../Layout';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
jest.mock('@/store/authStore');
const mockUseAuthStore = useAuthStore) as jest.Mocked<typeof useauthstore)>;

// Mock react-router-dom
const mockNavigate = jest.fn() as jest.Mocked<typeof jest.fn()>;
const mockLocation = { pathname: '/dashboard' } as jest.Mocked<typeof { pathname: '/dashboard' }>;
jest.mock('react-router-dom', async () => {
  const actual = await jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

describe('Layout Component', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'coordinator',
  } as jest.Mocked<typeof {
    id: 'user-1',
    email: 'test@example.com',
    firstname: 'john',
    lastname: 'doe',
    role: 'coordinator',
  }>;

  const mockAuthStore = {
    user: mockUser,
    token: 'mock-token',
    isAuthenticated: true,
    logout: jest.fn(),
  } as jest.Mocked<typeof {
    user: mockuser,
    token: 'mock-token',
    isauthenticated: true,
    logout: jest.fn(),
  }>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(mockAuthStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Header and Navigation', () => {
    test('should render header with app title', () => {
      render(<Layout />);
      
      expect(screen.getByText('Health Research Platform')).toBeInTheDocument();
    });

    test('should show user information in header', () => {
      render(<Layout />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    test('should show user role badge', () => {
      render(<Layout />);
      
      expect(screen.getByText('coordinator')).toBeInTheDocument();
    });

    test('should render logout button', () => {
      render(<Layout />);
      
      expect(screen.getByLabelText(/logout/i)).toBeInTheDocument();
    });

    test('should call logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const logoutButton = screen.getByLabelText(/logout/i);
      await user.click(logoutButton);
      
      expect(mockAuthStore.logout).toHaveBeenCalled();
    });
  });

  describe('Sidebar Navigation', () => {
    test('should render all navigation items', () => {
      render(<Layout />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Studies')).toBeInTheDocument();
      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('AI Chat')).toBeInTheDocument();
    });

    test('should highlight active navigation item', () => {
      render(<Layout />);
      
      // Assuming we're on dashboard route
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('active'); // or appropriate active class
    });

    test('should navigate when menu items are clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const studiesLink = screen.getByText('Studies');
      await user.click(studiesLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/studies');
    });

    test('should show navigation icons', () => {
      render(<Layout />);
      
      // Check for MUI icons
      expect(screen.getByTestId('DashboardIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ScienceIcon')).toBeInTheDocument();
      expect(screen.getByTestId('PeopleIcon')).toBeInTheDocument();
      expect(screen.getByTestId('AssignmentIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ChatIcon')).toBeInTheDocument();
    });
  });

  describe('Sidebar Collapse/Expand', () => {
    test('should toggle sidebar when menu button is clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const menuButton = screen.getByLabelText(/toggle sidebar/i);
      await user.click(menuButton);
      
      // Check if sidebar is collapsed
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('collapsed'); // or appropriate collapsed class
    });

    test('should show only icons when sidebar is collapsed', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const menuButton = screen.getByLabelText(/toggle sidebar/i);
      await user.click(menuButton);
      
      // Text should be hidden, icons should remain
      expect(screen.queryByText('Dashboard')).not.toBeVisible();
      expect(screen.getByTestId('DashboardIcon')).toBeInTheDocument();
    });

    test('should expand sidebar on hover when collapsed', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      // Collapse sidebar
      const menuButton = screen.getByLabelText(/toggle sidebar/i);
      await user.click(menuButton);
      
      // Hover over sidebar
      const sidebar = screen.getByRole('navigation');
      await user.hover(sidebar);
      
      // Should temporarily expand
      expect(screen.getByText('Dashboard')).toBeVisible();
    });
  });

  describe('Main Content Area', () => {
    test('should render main content outlet', () => {
      render(<Layout />);
      
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
      expect(screen.getByText('Outlet Content')).toBeInTheDocument();
    });

    test('should adjust content area when sidebar is collapsed', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const menuButton = screen.getByLabelText(/toggle sidebar/i);
      await user.click(menuButton);
      
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('sidebar-collapsed'); // or appropriate class
    });
  });

  describe('User Menu Dropdown', () => {
    test('should show user menu when avatar is clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const userAvatar = screen.getByRole('button', { name: /user menu/i });
      await user.click(userAvatar);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('should navigate to profile when profile option is clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const userAvatar = screen.getByRole('button', { name: /user menu/i });
      await user.click(userAvatar);
      
      const profileOption = screen.getByText('Profile');
      await user.click(profileOption);
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    test('should show user initials in avatar', () => {
      render(<Layout />);
      
      const avatar = screen.getByText('JD'); // John Doe initials
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Theme and Appearance', () => {
    test('should show theme toggle button', () => {
      render(<Layout />);
      
      expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
    });

    test('should toggle theme when theme button is clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const themeButton = screen.getByLabelText(/toggle theme/i);
      await user.click(themeButton);
      
      // Check if theme class changes
      const body = document.body;
      expect(body).toHaveClass('dark-theme'); // or light-theme
    });
  });

  describe('Notifications', () => {
    test('should show notifications button', () => {
      render(<Layout />);
      
      expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
    });

    test('should show notification badge when there are notifications', () => {
      // Mock store with notifications
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        notifications: [{ id: '1', message: 'New message', read: false }],
      });
      
      render(<Layout />);
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Badge count
    });

    test('should open notifications panel when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const notificationsButton = screen.getByLabelText(/notifications/i);
      await user.click(notificationsButton);
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should hide sidebar on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<Layout />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('mobile-hidden');
    });

    test('should show mobile menu button on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<Layout />);
      
      expect(screen.getByLabelText(/mobile menu/i)).toBeInTheDocument();
    });

    test('should show mobile sidebar when mobile menu is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<Layout />);
      
      const mobileMenuButton = screen.getByLabelText(/mobile menu/i);
      await user.click(mobileMenuButton);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('mobile-open');
    });
  });

  describe('Breadcrumbs', () => {
    test('should show breadcrumbs for current route', () => {
      render(<Layout />);
      
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    test('should navigate when breadcrumb is clicked', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      const homeLink = screen.getByText('Home');
      await user.click(homeLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator when navigating', () => {
      // Mock loading state
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        isLoading: true,
      });
      
      render(<Layout />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    test('should handle and display errors gracefully', () => {
      // Mock error state
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        error: 'Something went wrong',
      });
      
      render(<Layout />);
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<Layout />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      // Tab through navigation items
      await user.tab();
      expect(screen.getByText('Dashboard')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Studies')).toHaveFocus();
    });

    test('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(<Layout />);
      
      // Open user menu
      const userAvatar = screen.getByRole('button', { name: /user menu/i });
      await user.click(userAvatar);
      
      // First menu item should be focused
      expect(screen.getByText('Profile')).toHaveFocus();
    });

    test('should support screen readers', () => {
      render(<Layout />);
      
      // Check for proper ARIA labels
      expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = render(<Layout />);
      
      // Mock console.log to track renders
      const renderSpy = vi.spyOn(console, 'log');
      
      rerender(<Layout />);
      
      // Should not trigger additional renders if props haven't changed
      expect(renderSpy).not.toHaveBeenCalledWith('Layout rendered');
      
      renderSpy.mockRestore();
    });
  });
});
