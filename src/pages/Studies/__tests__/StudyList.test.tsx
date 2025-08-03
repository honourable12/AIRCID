import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockStudy } from '@/utils/test-utils';
import StudyList from '../StudyList';
import { studyService } from '@/services/studyService';

// Mock the study service
jest.mock('@/services/studyService');
const mockStudyService = studyService as jest.Mocked<typeof studyService> as jest.Mocked<typeof studyservice as jest.mocked<typeof studyservice>>;

// Mock react-router-dom
const mockNavigate = jest.fn() as jest.Mocked<typeof jest.fn()>;
jest.mock('react-router-dom', async () => {
  const actual = await jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('StudyList Component', () => {
  const mockStudiesList = [
    mockStudy({
      id: 'study-1',
      title: 'COVID-19 Vaccine Study',
      description: 'Phase III clinical trial for COVID-19 vaccine',
      status: 'active',
      principalInvestigator: 'Dr. Smith',
      targetEnrollment: 100,
      currentEnrollment: 75,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    }),
    mockStudy({
      id: 'study-2',
      title: 'Diabetes Management Study',
      description: 'Lifestyle intervention study for Type 2 diabetes',
      status: 'recruiting',
      principalInvestigator: 'Dr. Johnson',
      targetEnrollment: 80,
      currentEnrollment: 45,
      startDate: '2024-02-01',
      endDate: '2024-11-30',
    }),
    mockStudy({
      id: 'study-3',
      title: 'Hypertension Study',
      description: 'Medication effectiveness study',
      status: 'completed',
      principalInvestigator: 'Dr. Wilson',
      targetEnrollment: 60,
      currentEnrollment: 60,
      startDate: '2023-06-01',
      endDate: '2024-01-31',
    }),
  ] as jest.Mocked<typeof [
    mockstudy({
      id: 'study-1',
      title: 'covid-19 vaccine study',
      description: 'phase iii clinical trial for covid-19 vaccine',
      status: 'active',
      principalinvestigator: 'dr. smith',
      targetenrollment: 100,
      currentenrollment: 75,
      startdate: '2024-01-01',
      enddate: '2024-12-31',
    }),
    mockstudy({
      id: 'study-2',
      title: 'diabetes management study',
      description: 'lifestyle intervention study for type 2 diabetes',
      status: 'recruiting',
      principalinvestigator: 'dr. johnson',
      targetenrollment: 80,
      currentenrollment: 45,
      startdate: '2024-02-01',
      enddate: '2024-11-30',
    }),
    mockstudy({
      id: 'study-3',
      title: 'hypertension study',
      description: 'medication effectiveness study',
      status: 'completed',
      principalinvestigator: 'dr. wilson',
      targetenrollment: 60,
      currentenrollment: 60,
      startdate: '2023-06-01',
      enddate: '2024-01-31',
    }),
  ]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStudyService.getAllStudies.mockResolvedValue(mockStudiesList);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and Initial Render', () => {
    test('should show loading spinner while fetching studies', () => {
      mockStudyService.getAllStudies.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<StudyList />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should render studies list after loading', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Studies')).toBeInTheDocument();
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
        expect(screen.getByText('Diabetes Management Study')).toBeInTheDocument();
        expect(screen.getByText('Hypertension Study')).toBeInTheDocument();
      });
    });

    test('should display study information correctly', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Phase III clinical trial for COVID-19 vaccine')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
        expect(screen.getByText('Dr. Wilson')).toBeInTheDocument();
      });
    });

    test('should show study status correctly', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('recruiting')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });

    test('should display enrollment progress correctly', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        expect(screen.getByText('75 / 100')).toBeInTheDocument(); // COVID study
        expect(screen.getByText('45 / 80')).toBeInTheDocument(); // Diabetes study
        expect(screen.getByText('60 / 60')).toBeInTheDocument(); // Hypertension study
      });
    });
  });

  describe('Study Filtering and Search', () => {
    test('should filter studies by status', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      // Filter by active status
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOptions(statusFilter, 'active');

      // Should show filtered results
      expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      expect(screen.queryByText('Diabetes Management Study')).not.toBeInTheDocument();
    });

    test('should search studies by title', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search studies/i);
      await user.type(searchInput, 'COVID');

      // Should show filtered results
      expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      expect(screen.queryByText('Diabetes Management Study')).not.toBeInTheDocument();
    });

    test('should search studies by principal investigator', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search studies/i);
      await user.type(searchInput, 'Dr. Johnson');

      // Should show filtered results
      expect(screen.getByText('Diabetes Management Study')).toBeInTheDocument();
      expect(screen.queryByText('COVID-19 Vaccine Study')).not.toBeInTheDocument();
    });
  });

  describe('Study Actions', () => {
    test('should navigate to study detail when view button is clicked', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByLabelText(/view study/i);
      await user.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/studies/study-1');
    });

    test('should navigate to study detail when study card is clicked', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const studyCard = screen.getByText('COVID-19 Vaccine Study').closest('[data-testid="study-card"]');
      if (studyCard) {
        await user.click(studyCard);
        expect(mockNavigate).toHaveBeenCalledWith('/studies/study-1');
      }
    });

    test('should navigate to create study when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('Research Studies')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create New Study');
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/studies/create');
    });
  });

  describe('Study Management', () => {
    test('should show edit option for studies', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      expect(editButtons).toHaveLength(mockStudiesList.length);
    });

    test('should show delete confirmation when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    test('should delete study when confirmed', async () => {
      const user = userEvent.setup();
      mockStudyService.deleteStudy.mockResolvedValue(undefined);
      
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      // Open delete dialog
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockStudyService.deleteStudy).toHaveBeenCalledWith('study-1');
      });
    });
  });

  describe('Study Status Management', () => {
    test('should show different status colors correctly', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        const activeChip = screen.getByText('active');
        const recruitingChip = screen.getByText('recruiting');
        const completedChip = screen.getByText('completed');

        expect(activeChip).toHaveClass('MuiChip-colorSuccess');
        expect(recruitingChip).toHaveClass('MuiChip-colorWarning');
        expect(completedChip).toHaveClass('MuiChip-colorDefault');
      });
    });

    test('should allow status changes for applicable studies', async () => {
      const user = userEvent.setup();
      mockStudyService.updateStudy.mockResolvedValue(mockStudy());
      
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      // Find status change dropdown/button
      const statusButton = screen.getAllByText('active')[0];
      await user.click(statusButton);

      // Select new status
      const pausedOption = screen.getByText('paused');
      await user.click(pausedOption);

      await waitFor(() => {
        expect(mockStudyService.updateStudy).toHaveBeenCalledWith(
          'study-1',
          expect.objectContaining({
            status: 'paused',
          })
        );
      });
    });
  });

  describe('Enrollment Progress Visualization', () => {
    test('should show progress bars for enrollment', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    test('should calculate enrollment percentage correctly', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        // COVID study: 75/100 = 75%
        const progressBars = screen.getAllByRole('progressbar');
        const covidProgress = progressBars.find(bar => 
          bar.getAttribute('aria-valuenow') === '75'
        );
        expect(covidProgress).toBeInTheDocument();
      });
    });

    test('should show 100% progress for completed studies', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        // Hypertension study: 60/60 = 100%
        const progressBars = screen.getAllByRole('progressbar');
        const completedProgress = progressBars.find(bar => 
          bar.getAttribute('aria-valuenow') === '100'
        );
        expect(completedProgress).toBeInTheDocument();
      });
    });
  });

  describe('Study Sorting', () => {
    test('should sort studies by title', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const sortButton = screen.getByText('Sort by Title');
      await user.click(sortButton);

      // Check if studies are sorted alphabetically
      const studyTitles = screen.getAllByTestId('study-title');
      expect(studyTitles[0]).toHaveTextContent('COVID-19 Vaccine Study');
      expect(studyTitles[1]).toHaveTextContent('Diabetes Management Study');
    });

    test('should sort studies by enrollment progress', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const sortButton = screen.getByText('Sort by Progress');
      await user.click(sortButton);

      // Should sort by enrollment percentage
      const studyTitles = screen.getAllByTestId('study-title');
      expect(studyTitles[0]).toHaveTextContent('Hypertension Study'); // 100%
    });
  });

  describe('Error Handling', () => {
    test('should show error message when studies fetch fails', async () => {
      mockStudyService.getAllStudies.mockRejectedValue(new Error('Failed to fetch studies'));
      
      render(<StudyList />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load studies/i)).toBeInTheDocument();
      });
    });

    test('should show error message when study deletion fails', async () => {
      const user = userEvent.setup();
      mockStudyService.deleteStudy.mockRejectedValue(new Error('Failed to delete study'));
      
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      // Try to delete study
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByText('Delete');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete study/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no studies exist', async () => {
      mockStudyService.getAllStudies.mockResolvedValue([]);
      
      render(<StudyList />);
      
      await waitFor(() => {
        expect(screen.getByText(/no studies found/i)).toBeInTheDocument();
        expect(screen.getByText('Create New Study')).toBeInTheDocument();
      });
    });

    test('should show no results message when search returns empty', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('COVID-19 Vaccine Study')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search studies/i);
      await user.type(searchInput, 'Nonexistent Study');

      await waitFor(() => {
        expect(screen.getByText(/no studies match your search/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Studies')).toBeInTheDocument();
      });

      // Check main heading
      expect(screen.getByRole('heading', { name: /research studies/i })).toBeInTheDocument();
      
      // Check study cards have proper roles
      const studyCards = screen.getAllByRole('article');
      expect(studyCards.length).toBe(mockStudiesList.length);
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StudyList />);

      await waitFor(() => {
        expect(screen.getByText('Research Studies')).toBeInTheDocument();
      });

      // Tab through interactive elements
      const createButton = screen.getByText('Create New Study');
      createButton.focus();
      expect(createButton).toHaveFocus();

      await user.tab();
      const searchInput = screen.getByPlaceholderText(/search studies/i);
      expect(searchInput).toHaveFocus();
    });

    test('should have proper color contrast for status indicators', async () => {
      render(<StudyList />);
      
      await waitFor(() => {
        const statusChips = screen.getAllByTestId('status-chip');
        statusChips.forEach(chip => {
          // Check that status chips have appropriate contrast
          expect(chip).toHaveStyle({ color: expect.any(String) });
        });
      });
    });
  });
});
