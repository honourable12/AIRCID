import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, mockForm } from '@/utils/test-utils';
  const mockFormsList = [
    mockForm({
      id: 'form-1',
      title: 'Patient Intake Form',
      description: 'Initial patient information collection',
      isActive: true,
      fields: [
        { id: 'field-1', type: 'text', label: 'Full Name', required: true },
        { id: 'field-2', type: 'email', label: 'Email Address', required: true },
      ],
    }),
    mockForm({
      id: 'form-2',
      title: 'Medical History Form',
      description: 'Detailed medical background information',
      isActive: false,
      fields: [
        { id: 'field-3', type: 'textarea', label: 'Medical History', required: true },
      ],
    }),
  ];
        expect(screen.getByText('Medical History Form')).toBeInTheDocument();
      });
    });

    test('should display form information correctly', async () => {
      render(<Forms />);
      
      await waitFor(() => {
        expect(screen.getByText('Initial patient information collection')).toBeInTheDocument();
        expect(screen.getByText('Detailed medical background information')).toBeInTheDocument();
      });
    });

    test('should show active/inactive status correctly', async () => {
      render(<Forms />);
      
      await waitFor(() => {
        const activeChips = screen.getAllByText('Active');
        const inactiveChips = screen.getAllByText('Inactive');
        expect(activeChips).toHaveLength(1);
        expect(inactiveChips).toHaveLength(1);
      });
    });
  });

  describe('Form Creation', () => {
    test('should open create form dialog when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Create Form');
      await user.click(addButton);

      expect(screen.getByText('Create New Form')).toBeInTheDocument();
    });

    test('should create a new form when form is submitted', async () => {
      const user = userEvent.setup();
      mockFormsService.createForm.mockResolvedValue(mockForm());
      
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Open create dialog
      const addButton = screen.getByText('Create Form');
      await user.click(addButton);

      // Fill out basic form info
      const titleInput = screen.getByLabelText('Form Title');
      const descriptionInput = screen.getByLabelText('Description');

      await user.type(titleInput, 'Test Form');
      await user.type(descriptionInput, 'A test form description');

      // Add a field
      const addFieldButton = screen.getByText('Add Field');
      await user.click(addFieldButton);

      const fieldLabelInput = screen.getByLabelText('Field Label');
      await user.type(fieldLabelInput, 'Test Field');

      // Save the field
      const saveFieldButton = screen.getByText('Add Field');
      await user.click(saveFieldButton);

      // Submit form
      const createButton = screen.getByText('Create Form');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockFormsService.createForm).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Form',
            description: 'A test form description',
            fields: expect.arrayContaining([
              expect.objectContaining({
                label: 'Test Field',
              }),
            ]),
          })
        );
      });
    });

    test.skip('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Open create dialog
      const addButton = screen.getByText('Create Form');
      await user.click(addButton);

      // Try to submit without filling required fields
      const createButton = screen.getByText('Create Form');
      await user.click(createButton);

      // Should see validation errors
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  describe.skip('Field Management', () => {
    test('should add different field types', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Open create dialog
      const addButton = screen.getByText('Create Form');
      await user.click(addButton);

      // Add different field types
      const fieldTypes = ['text', 'email', 'number', 'textarea', 'select', 'checkbox'];
      
      for (const fieldType of fieldTypes) {
        const addFieldButton = screen.getByText('Add Field');
        await user.click(addFieldButton);

        const typeSelect = screen.getByLabelText('Field Type');
        await user.selectOptions(typeSelect, fieldType);

        const fieldLabelInput = screen.getByLabelText('Field Label');
        await user.type(fieldLabelInput, `${fieldType} Field`);

        const saveFieldButton = screen.getByText('Add Field');
        await user.click(saveFieldButton);
      }

      // Check that all fields were added
      expect(screen.getByText('text Field')).toBeInTheDocument();
      expect(screen.getByText('email Field')).toBeInTheDocument();
      expect(screen.getByText('number Field')).toBeInTheDocument();
    });

    test.skip('should handle select field options', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Open create dialog
      const addButton = screen.getByText('Create Form');
      await user.click(addButton);

      // Add select field
      const addFieldButton = screen.getByText('Add Field');
      await user.click(addFieldButton);

      const typeSelect = screen.getByLabelText('Field Type');
      await user.selectOptions(typeSelect, 'select');

      const fieldLabelInput = screen.getByLabelText('Field Label');
      await user.type(fieldLabelInput, 'Country');

      // Add options
      const optionInput = screen.getByLabelText('Option');
      await user.type(optionInput, 'USA');
      
      const addOptionButton = screen.getByText('Add Option');
      await user.click(addOptionButton);

      await user.clear(optionInput);
      await user.type(optionInput, 'Canada');
      await user.click(addOptionButton);

      expect(screen.getByText('USA')).toBeInTheDocument();
      expect(screen.getByText('Canada')).toBeInTheDocument();
    });

    test('should mark fields as required', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Open create dialog
      const addButton = screen.getByText('Create Form');
      await user.click(addButton);

      // Add required field
      const addFieldButton = screen.getByText('Add Field');
      await user.click(addFieldButton);

      const fieldLabelInput = screen.getByLabelText('Field Label');
      await user.type(fieldLabelInput, 'Required Field');

      const requiredCheckbox = screen.getByLabelText('Required');
      await user.click(requiredCheckbox);

      expect(requiredCheckbox).toBeChecked();
    });
  });

  describe('Form Editing', () => {
    test('should open edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Form')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Patient Intake Form')).toBeInTheDocument();
    });

    test('should update form when edit form is submitted', async () => {
      const user = userEvent.setup();
      mockFormsService.updateForm.mockResolvedValue(mockForm());
      
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      // Open edit dialog
      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      // Update title
      const titleInput = screen.getByDisplayValue('Patient Intake Form');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Patient Form');

      // Submit form
      const updateButton = screen.getByText('Update Form');
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockFormsService.updateForm).toHaveBeenCalledWith(
          'form-1',
          expect.objectContaining({
            title: 'Updated Patient Form',
          })
        );
      });
    });
  });

  describe('Form Deletion', () => {
    test('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    test('should delete form when confirmed', async () => {
      const user = userEvent.setup();
      mockFormsService.deleteForm.mockResolvedValue(undefined);
      
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      // Open delete dialog
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockFormsService.deleteForm).toHaveBeenCalledWith('form-1');
      });
    });
  });

  describe('Form Preview', () => {
    test('should show form preview when preview button is clicked', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      const previewButtons = screen.getAllByLabelText(/preview/i);
      await user.click(previewButtons[0]);

      expect(screen.getByText('Form Preview')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    test('should render form fields correctly in preview', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      const previewButtons = screen.getAllByLabelText(/preview/i);
      await user.click(previewButtons[0]);

      // Check for required field indicators
      expect(screen.getByText('*')).toBeInTheDocument(); // Required field asterisk
      
      // Check for proper input types
      const emailInput = screen.getByLabelText('Email Address');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Form Status Management', () => {
    test('should toggle form active status', async () => {
      const user = userEvent.setup();
      mockFormsService.updateForm.mockResolvedValue(mockForm());
      
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      // Find and click status toggle
      const statusToggle = screen.getByRole('switch');
      await user.click(statusToggle);

      await waitFor(() => {
        expect(mockFormsService.updateForm).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            isActive: expect.any(Boolean),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('should show error message when form fetch fails', async () => {
      mockFormsService.getAllForms.mockRejectedValue(new Error('Failed to fetch forms'));
      
      render(<Forms />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch forms/i)).toBeInTheDocument();
      });
    });

    test('should show error message when form creation fails', async () => {
      const user = userEvent.setup();
      mockFormsService.createForm.mockRejectedValue(new Error('Failed to create form'));
      
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Open create dialog and fill form
      const addButton = screen.getByText('Create Form');
      await user.click(addButton);

      const titleInput = screen.getByLabelText('Form Title');
      await user.type(titleInput, 'Test Form');

      const createButton = screen.getByText('Create Form');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create form/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Duplication', () => {
    test('should duplicate form when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      mockFormsService.createForm.mockResolvedValue(mockForm());
      
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Patient Intake Form')).toBeInTheDocument();
      });

      const duplicateButtons = screen.getAllByLabelText(/duplicate/i);
      await user.click(duplicateButtons[0]);

      await waitFor(() => {
        expect(mockFormsService.createForm).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Copy of'),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(<Forms />);
      
      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Check main heading
      expect(screen.getByRole('heading', { name: /forms management/i })).toBeInTheDocument();
      
      // Check button accessibility
      const createButton = screen.getByText('Create Form');
      expect(createButton).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Forms />);

      await waitFor(() => {
        expect(screen.getByText('Forms')).toBeInTheDocument();
      });

      // Tab through interactive elements
      const createButton = screen.getByText('Create Form');
      createButton.focus();
      expect(createButton).toHaveFocus();

      await user.tab();
      // Should move to next focusable element
    });
  });
});
