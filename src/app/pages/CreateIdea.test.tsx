import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { CreateIdea } from './CreateIdea';
import { IdeasProvider } from '../context/IdeasContext';
import { AuthProvider } from '../context/AuthContext';
import { mockUsers } from '../data/mockData';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function preseedOwner() {
  const u = mockUsers.find((x) => x.email === 'michael@venturelab.com')!;
  localStorage.setItem('vl_jwt', `test-token-${u.id}`);
  localStorage.setItem('vl_current_user', JSON.stringify({
    id: u.id, name: u.name, email: u.email, role: u.role,
  }));
}

function renderCreateIdea() {
  mockNavigate.mockClear();
  preseedOwner();
  return render(
    <MemoryRouter initialEntries={['/app/ideas/new']}>
      <AuthProvider>
        <IdeasProvider>
          <Routes>
            <Route path="/app/ideas/new" element={<CreateIdea />} />
          </Routes>
        </IdeasProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('CreateIdea', () => {
  it('renders the form heading', async () => {
    renderCreateIdea();
    expect(await screen.findByText('Create New Idea')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    renderCreateIdea();
    await screen.findByText('Create New Idea');
    fireEvent.click(screen.getByRole('button', { name: 'Save Idea' }));
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Industry is required')).toBeInTheDocument();
      expect(screen.getByText('Stage is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('shows error when title is too short', async () => {
    renderCreateIdea();
    await screen.findByText('Create New Idea');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'AB' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Idea' }));
    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('shows error when description is too short', async () => {
    renderCreateIdea();
    await screen.findByText('Create New Idea');
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Too short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Idea' }));
    await waitFor(() => {
      expect(screen.getByText('Description must be at least 20 characters')).toBeInTheDocument();
    });
  });

  it('navigates back on Cancel', async () => {
    renderCreateIdea();
    await screen.findByText('Create New Idea');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/app/ideas');
  });

  it('does not navigate when form has errors', async () => {
    renderCreateIdea();
    await screen.findByText('Create New Idea');
    fireEvent.click(screen.getByRole('button', { name: 'Save Idea' }));
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/ideas');
  });
});
