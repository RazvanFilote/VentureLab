import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Register } from './Register';
import { AuthProvider } from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderRegister() {
  mockNavigate.mockClear();
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Register', () => {
  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows role selection options', () => {
    renderRegister();
    expect(screen.getByText('Startup Owner')).toBeInTheDocument();
    expect(screen.getByText('Investor')).toBeInTheDocument();
  });

  it('shows validation error when no role selected', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Please select a role')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty name', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bademail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows auth error for duplicate email', async () => {
    renderRegister();
    fireEvent.click(screen.getByText('Investor'));
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Dup User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'michael@venturelab.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('navigates to /investor after successful Investor registration', async () => {
    renderRegister();
    fireEvent.click(screen.getByText('Investor'));
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Investor' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newinvestor@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/investor');
    });
  });

  it('navigates to /app after successful StartupOwner registration', async () => {
    renderRegister();
    fireEvent.click(screen.getByText('Startup Owner'));
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Owner' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newowner@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app');
    });
  });

  it('navigates back to home on Back button click', () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
