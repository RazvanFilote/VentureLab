import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { IdeaDetail } from './IdeaDetail';
import { IdeasProvider } from '../context/IdeasContext';
import { AuthProvider } from '../context/AuthContext';
import { FeedbackProvider } from '../context/FeedbackContext';
import { MilestonesProvider } from '../context/MilestonesContext';
import { mockIdeas, mockUsers } from '../data/mockData';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function preseedUser(email = 'michael@venturelab.com') {
  const u = mockUsers.find((x) => x.email === email)!;
  localStorage.setItem('vl_jwt', `test-token-${u.id}`);
  localStorage.setItem('vl_current_user', JSON.stringify({
    id: u.id, name: u.name, email: u.email, role: u.role,
  }));
}

function renderIdeaDetail(id = '1', email = 'michael@venturelab.com') {
  mockNavigate.mockClear();
  preseedUser(email);
  return render(
    <MemoryRouter initialEntries={[`/app/ideas/${id}`]}>
      <AuthProvider>
        <IdeasProvider>
          <FeedbackProvider>
            <MilestonesProvider>
              <Routes>
                <Route path="/app/ideas/:id" element={<IdeaDetail />} />
              </Routes>
            </MilestonesProvider>
          </FeedbackProvider>
        </IdeasProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('IdeaDetail', () => {
  it('renders the idea title', async () => {
    renderIdeaDetail('1');
    expect(await screen.findByText(mockIdeas[0].title)).toBeInTheDocument();
  });

  it('renders the idea industry and stage', async () => {
    renderIdeaDetail('1');
    await screen.findByText(mockIdeas[0].title);
    expect(screen.getByText(mockIdeas[0].industry)).toBeInTheDocument();
    expect(screen.getAllByText(mockIdeas[0].stage).length).toBeGreaterThan(0);
  });

  it('renders the idea description', async () => {
    renderIdeaDetail('1');
    await screen.findByText(mockIdeas[0].title);
    expect(screen.getByText(mockIdeas[0].description)).toBeInTheDocument();
  });

  it('shows "Idea not found" for invalid id', async () => {
    renderIdeaDetail('nonexistent');
    await waitFor(() => {
      expect(screen.getByText('Idea not found')).toBeInTheDocument();
    });
  });

  it('shows feedback form', async () => {
    renderIdeaDetail('1');
    expect(await screen.findByText('Add Your Feedback')).toBeInTheDocument();
    expect(screen.getByLabelText('Comment')).toBeInTheDocument();
  });

  it('shows validation error for empty comment on feedback submit', async () => {
    renderIdeaDetail('1');
    await screen.findByText('Add Your Feedback');
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));
    await waitFor(() => {
      expect(screen.getByText('Comment is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for too-short comment', async () => {
    renderIdeaDetail('1');
    await screen.findByText('Add Your Feedback');
    fireEvent.change(screen.getByLabelText('Comment'), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));
    await waitFor(() => {
      expect(screen.getByText('Comment must be at least 5 characters')).toBeInTheDocument();
    });
  });

  it('adds feedback successfully', async () => {
    renderIdeaDetail('1');
    await screen.findByText('Add Your Feedback');
    fireEvent.change(screen.getByLabelText('Comment'), {
      target: { value: 'This is a great startup idea!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));
    await waitFor(() => {
      expect(screen.queryByText('Comment is required')).not.toBeInTheDocument();
    });
  });

  it('shows Edit and Delete buttons for idea owner', async () => {
    renderIdeaDetail('2'); // idea 2 is by Michael Chen
    await screen.findByText(mockIdeas[1].title);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows delete confirmation dialog when Delete is clicked', async () => {
    renderIdeaDetail('2');
    await screen.findByText(mockIdeas[1].title);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(screen.getByText('Delete this idea?')).toBeInTheDocument();
    });
  });

  it('cancels idea deletion', async () => {
    renderIdeaDetail('2');
    await screen.findByText(mockIdeas[1].title);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => screen.getByText('Delete this idea?'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText(mockIdeas[1].title)).toBeInTheDocument();
  });

  it('shows existing feedback items', async () => {
    renderIdeaDetail('1');
    await screen.findByText('Add Your Feedback');
    // There is mock feedback for idea 1
    await waitFor(() => {
      expect(screen.getAllByText(/Emily Rodriguez/).length).toBeGreaterThan(0);
    });
  });
});
