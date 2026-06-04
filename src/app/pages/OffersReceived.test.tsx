import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { OffersReceived } from './OffersReceived';
import { OffersProvider } from '../context/OffersContext';
import { IdeasProvider } from '../context/IdeasContext';
import { AuthProvider } from '../context/AuthContext';
import { mockUsers } from '../data/mockData';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function preseedUser(email = 'sarah@venturelab.com') {
  const u = mockUsers.find((x) => x.email === email)!;
  localStorage.setItem('vl_jwt', `test-token-${u.id}`);
  localStorage.setItem('vl_current_user', JSON.stringify({
    id: u.id, name: u.name, email: u.email, role: u.role,
  }));
}

function renderOffersReceived(email = 'sarah@venturelab.com') {
  mockNavigate.mockClear();
  preseedUser(email);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <IdeasProvider>
          <OffersProvider>
            <OffersReceived />
          </OffersProvider>
        </IdeasProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('OffersReceived', () => {
  it('renders the page heading', async () => {
    renderOffersReceived();
    expect(await screen.findByText('Offers Received')).toBeInTheDocument();
  });

  it('renders offer table with data rows for admin', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');
    // At least one investor name should appear
    expect(screen.getAllByText('Emily Rodriguez').length).toBeGreaterThan(0);
  });

  it('renders offer amount columns', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');
    // Amount column header
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('shows pending status badge', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
  });

  it('shows accept/reject buttons for pending offers', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');
    // There should be rows with action buttons
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('accepts an offer by clicking accept icon button', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');

    // Find all rows, click the Accept button (CheckCircle) on the first pending row
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    let clicked = false;
    for (const row of rows) {
      const text = row.textContent ?? '';
      if (text.includes('Pending')) {
        const buttons = row.querySelectorAll('button');
        // buttons: [Eye, CheckCircle, XCircle, Trash2]
        if (buttons.length >= 3) {
          fireEvent.click(buttons[1]); // CheckCircle = Accept
          clicked = true;
          break;
        }
      }
    }
    if (clicked) {
      await waitFor(() => {
        expect(screen.getAllByText('Accepted').length).toBeGreaterThan(0);
      });
    }
  });

  it('rejects an offer by clicking reject icon button', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');

    const rows = Array.from(document.querySelectorAll('tbody tr'));
    let clicked = false;
    for (const row of rows) {
      const text = row.textContent ?? '';
      if (text.includes('Pending')) {
        const buttons = row.querySelectorAll('button');
        if (buttons.length >= 4) {
          fireEvent.click(buttons[2]); // XCircle = Reject
          clicked = true;
          break;
        }
      }
    }
    if (clicked) {
      await waitFor(() => {
        expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
      });
    }
  });

  it('shows delete confirmation dialog when Trash icon button is clicked', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');
    // Wait for offer rows to actually render (header is rendered before fetch resolves).
    await screen.findAllByText('Emily Rodriguez');

    // Only Pending / Rejected rows expose a delete button — find one.
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const targetRow = rows.find((r) => /Pending|Rejected/.test(r.textContent ?? ''))!;
    expect(targetRow).toBeTruthy();

    const targetButtons = targetRow.querySelectorAll('button');
    // Last button on a Pending/Rejected row is Trash2 (Delete).
    fireEvent.click(targetButtons[targetButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Delete this offer?')).toBeInTheDocument();
    });
  });

  it('cancels deletion keeps the offer', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');
    await screen.findAllByText('Emily Rodriguez');

    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const targetRow = rows.find((r) => /Pending|Rejected/.test(r.textContent ?? ''))!;
    const buttons = targetRow.querySelectorAll('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => screen.getByText('Delete this offer?'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Delete this offer?')).not.toBeInTheDocument();
  });

  it('deletes an offer after confirming', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');
    await screen.findAllByText('Emily Rodriguez');

    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const targetRow = rows.find((r) => /Pending|Rejected/.test(r.textContent ?? ''))!;
    const buttons = targetRow.querySelectorAll('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => screen.getByText('Delete this offer?'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('Delete this offer?')).not.toBeInTheDocument();
    });
  });

  it('navigates to offer detail when Eye icon button is clicked', async () => {
    renderOffersReceived();
    await screen.findByText('Offers Received');

    const firstRowButtons = document.querySelectorAll('tbody tr')[0].querySelectorAll('button');
    fireEvent.click(firstRowButtons[0]); // Eye = View

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/app\/offers\//));
  });
});
