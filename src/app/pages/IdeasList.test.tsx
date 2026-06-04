import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { IdeasList } from './IdeasList';
import { IdeasProvider } from '../context/IdeasContext';
import { AuthProvider } from '../context/AuthContext';
import { FeedbackProvider } from '../context/FeedbackContext';
import { mockIdeas, mockUsers } from '../data/mockData';

// Pre-seed localStorage so AuthProvider boots already logged in as Sarah (Admin).
function preseedAdmin() {
  const u = mockUsers.find((x) => x.email === 'sarah@venturelab.com')!;
  localStorage.setItem('vl_jwt', `test-token-${u.id}`);
  localStorage.setItem('vl_current_user', JSON.stringify({
    id: u.id, name: u.name, email: u.email, role: u.role,
  }));
}

function renderIdeasList() {
  preseedAdmin();
  return render(
    <MemoryRouter>
      <AuthProvider>
        <IdeasProvider>
          <FeedbackProvider>
            <IdeasList />
          </FeedbackProvider>
        </IdeasProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('IdeasList', () => {
  it('renders the page heading', () => {
    renderIdeasList();
    expect(screen.getByText('Startup Ideas')).toBeInTheDocument();
  });

  it('shows Create Idea button for admin user', async () => {
    renderIdeasList();
    expect(await screen.findByText('Create Idea')).toBeInTheDocument();
  });

  it('renders the first page of ideas', async () => {
    renderIdeasList();
    expect(await screen.findByText(mockIdeas[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockIdeas[4].title)).toBeInTheDocument();
  });

  it('shows industry for each idea', async () => {
    renderIdeasList();
    expect(await screen.findByText(mockIdeas[0].industry)).toBeInTheDocument();
  });

  it('shows stage badges', async () => {
    renderIdeasList();
    await screen.findByText(mockIdeas[0].title);
    expect(screen.getAllByText(mockIdeas[0].stage).length).toBeGreaterThan(0);
  });

  it('deletes an idea when confirmed', async () => {
    renderIdeasList();
    await screen.findByText(mockIdeas[0].title);

    const titleCell = screen.getByText(mockIdeas[0].title);
    const row = titleCell.closest('tr')!;
    const rowButtons = Array.from(row.querySelectorAll('button'));
    // 3 buttons: View, Edit, Delete
    fireEvent.click(rowButtons[2]);

    expect(screen.getByText('Delete this idea?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(screen.queryByText(mockIdeas[0].title)).not.toBeInTheDocument()
    );
  });

  it('cancels deletion when Cancel is clicked', async () => {
    renderIdeasList();
    await screen.findByText(mockIdeas[0].title);

    const row = screen.getByText(mockIdeas[0].title).closest('tr')!;
    fireEvent.click(Array.from(row.querySelectorAll('button'))[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText(mockIdeas[0].title)).toBeInTheDocument();
  });

  it('shows empty state when all ideas are deleted', async () => {
    renderIdeasList();
    await screen.findByText(mockIdeas[0].title);

    for (let i = 0; i < mockIdeas.length + 2; i++) {
      const rows = document.querySelectorAll('tbody tr');
      // Stop once the table only has the "No ideas found." placeholder row.
      const isEmpty = Array.from(rows).every((r) =>
        (r.textContent ?? '').includes('No ideas found.')
      );
      if (rows.length === 0 || isEmpty) break;

      const firstRowButtons = Array.from(rows[0].querySelectorAll('button'));
      if (firstRowButtons.length < 3) break;
      fireEvent.click(firstRowButtons[2]);
      // Confirmation dialog with a Delete button.
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      // Wait for the confirmation to close before clicking again.
      await waitFor(() =>
        expect(screen.queryByText('Delete this idea?')).not.toBeInTheDocument()
      );
    }
    await waitFor(() =>
      expect(screen.getByText('No ideas found.')).toBeInTheDocument()
    );
  });
});
