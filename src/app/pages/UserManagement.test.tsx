import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { UserManagement } from './UserManagement';
import { AuthProvider } from '../context/AuthContext';
import { mockUsers } from '../data/mockData';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

/**
 * Pre-seed localStorage so AuthProvider boots already logged in — avoids the
 * async login round-trip in every test. The fetch mock in setup.ts uses the
 * shape `test-token-<userId>` to identify the bearer.
 */
function preseedAuth(email = 'sarah@venturelab.com') {
  const u = mockUsers.find((x) => x.email === email)!;
  localStorage.setItem('vl_jwt', `test-token-${u.id}`);
  localStorage.setItem('vl_current_user', JSON.stringify({
    id: u.id, name: u.name, email: u.email, role: u.role,
  }));
}

function renderUserManagement(email = 'sarah@venturelab.com') {
  preseedAuth(email);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    </MemoryRouter>
  );
}

async function waitForRowsToLoad() {
  // Michael Chen is in the seed and always on page 1 alongside Sarah; once he
  // appears we know the admin /api/users fetch has resolved and rows rendered.
  await screen.findByText('Michael Chen');
}

describe('UserManagement', () => {
  it('renders the user management page for admin', async () => {
    renderUserManagement();
    expect(await screen.findByText('User Management')).toBeInTheDocument();
  });

  it('shows permission denied for non-admin', async () => {
    renderUserManagement('michael@venturelab.com');
    await waitFor(() => {
      expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    });
  });

  it('renders users table with existing users', async () => {
    renderUserManagement();
    await waitForRowsToLoad();
    expect(screen.getByText('Michael Chen')).toBeInTheDocument();
    expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
  });

  it('shows Add User button for admin', async () => {
    renderUserManagement();
    await screen.findByText('User Management');
    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
  });

  it('opens add user dialog when Add User is clicked', async () => {
    renderUserManagement();
    await screen.findByText('User Management');
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty name', async () => {
    renderUserManagement();
    await screen.findByText('User Management');
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    await waitFor(() => screen.getByText('Add New User'));
    fireEvent.click(screen.getByRole('button', { name: 'Add User' }));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for role not selected', async () => {
    renderUserManagement();
    await screen.findByText('User Management');
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    await waitFor(() => screen.getByText('Add New User'));
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add User' }));
    await waitFor(() => {
      expect(screen.getByText('Please select a role')).toBeInTheDocument();
    });
  });

  it('adds a new user successfully', async () => {
    renderUserManagement();
    await waitForRowsToLoad();

    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    await waitFor(() => screen.getByText('Add New User'));

    const investorButtons = screen.getAllByText('Investor');
    fireEvent.click(investorButtons[investorButtons.length - 1]);

    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Test New User' } });
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'testnew@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat password'), { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add User' }));

    await waitFor(() => {
      expect(screen.queryByText('Add New User')).not.toBeInTheDocument();
    });
    // The new user lives on a later page; confirm POST /api/users was called.
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const postedUsers = fetchMock.mock.calls.filter(([url, init]) => {
      const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as Request).url;
      return u.includes('/api/users') && (init as RequestInit | undefined)?.method === 'POST';
    });
    expect(postedUsers.length).toBeGreaterThanOrEqual(1);
  });

  it('shows delete confirmation dialog', async () => {
    renderUserManagement();
    await waitForRowsToLoad();

    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const row of rows) {
      if (!row.textContent?.includes('Sarah Johnson')) {
        const buttons = Array.from(row.querySelectorAll('button'));
        const trashBtn = buttons[buttons.length - 1];
        if (trashBtn) {
          fireEvent.click(trashBtn);
          break;
        }
      }
    }

    await waitFor(() => {
      expect(screen.getByText('Delete this user?')).toBeInTheDocument();
    });
  });

  it('cancels user deletion', async () => {
    renderUserManagement();
    await waitForRowsToLoad();

    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const row of rows) {
      if (!row.textContent?.includes('Sarah Johnson')) {
        const buttons = Array.from(row.querySelectorAll('button'));
        const trashBtn = buttons[buttons.length - 1];
        if (trashBtn) { fireEvent.click(trashBtn); break; }
      }
    }

    await waitFor(() => screen.getByText('Delete this user?'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete this user?')).not.toBeInTheDocument();
  });

  it('deletes a user after confirming', async () => {
    renderUserManagement();
    await waitForRowsToLoad();

    let targetName: string | undefined;
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const row of rows) {
      const text = row.textContent ?? '';
      if (!text.includes('Sarah Johnson')) {
        const buttons = Array.from(row.querySelectorAll('button'));
        const trashBtn = buttons[buttons.length - 1];
        if (trashBtn) {
          // Capture the user's name from the first cell so we can assert removal.
          targetName = row.querySelector('td')?.textContent ?? undefined;
          fireEvent.click(trashBtn);
          break;
        }
      }
    }

    await waitFor(() => screen.getByText('Delete this user?'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('Delete this user?')).not.toBeInTheDocument();
    });
    if (targetName) {
      await waitFor(() => expect(screen.queryByText(targetName!)).not.toBeInTheDocument());
    }
  });
});
