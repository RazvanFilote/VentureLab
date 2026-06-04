import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { EditIdea } from './EditIdea';
import { IdeasProvider } from '../context/IdeasContext';
import { AuthProvider } from '../context/AuthContext';
import { mockIdeas, mockUsers } from '../data/mockData';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function preseedOwner() {
  const u = mockUsers.find((x) => x.email === 'michael@venturelab.com')!;
  localStorage.setItem('vl_jwt', `test-token-${u.id}`);
  localStorage.setItem('vl_current_user', JSON.stringify({
    id: u.id, name: u.name, email: u.email, role: u.role,
  }));
}

function renderEditIdea(id = '2') {
  mockNavigate.mockClear();
  preseedOwner();
  return render(
    <MemoryRouter initialEntries={[`/app/ideas/${id}/edit`]}>
      <AuthProvider>
        <IdeasProvider>
          <Routes>
            <Route path="/app/ideas/:id/edit" element={<EditIdea />} />
          </Routes>
        </IdeasProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('EditIdea', () => {
  it('renders the form heading', async () => {
    renderEditIdea();
    expect(await screen.findByText('Edit Idea')).toBeInTheDocument();
  });

  it('pre-fills the form with existing idea data', async () => {
    renderEditIdea('2');
    await screen.findByText('Edit Idea');
    const idea = mockIdeas.find((i) => i.id === '2')!;
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(idea.title);
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe(idea.description);
  });

  it('shows validation errors when submitting empty title', async () => {
    renderEditIdea('2');
    await screen.findByText('Edit Idea');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('shows error when title is too short', async () => {
    renderEditIdea('2');
    await screen.findByText('Edit Idea');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'AB' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('shows error when description is too short', async () => {
    renderEditIdea('2');
    await screen.findByText('Edit Idea');
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => {
      expect(screen.getByText('Description must be at least 20 characters')).toBeInTheDocument();
    });
  });

  it('navigates back on Cancel', async () => {
    renderEditIdea('2');
    await screen.findByText('Edit Idea');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/app/ideas/2');
  });

  it('shows "Idea not found" for invalid id', async () => {
    renderEditIdea('nonexistent');
    await waitFor(() => {
      expect(screen.getByText('Idea not found')).toBeInTheDocument();
    });
  });

  it('submits successfully and navigates for valid data', async () => {
    renderEditIdea('2');
    await screen.findByText('Edit Idea');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Title Here' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'This is a valid updated description that is long enough.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/ideas/2');
    });
  });

  it('does not navigate when form has validation errors', async () => {
    renderEditIdea('2');
    await screen.findByText('Edit Idea');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/ideas/2');
  });
});
