import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, IDLE_TIMEOUT_MS } from './AuthContext';

function CurrentUserDisplay() {
  const { currentUser } = useAuth();
  return <span data-testid="current">{currentUser?.name ?? 'none'}</span>;
}

function LoginButton({ email, password }: { email: string; password: string }) {
  const { login } = useAuth();
  return <button onClick={() => login(email, password)}>Login</button>;
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={() => logout()}>Logout</button>;
}

function RegisterButton({ email, role = 'Investor' as const }: { email: string; role?: 'StartupOwner' | 'Investor' }) {
  const { register } = useAuth();
  return (
    <button
      onClick={() =>
        register({ name: 'New User', email, password: 'pass123', role })
      }
    >
      Register
    </button>
  );
}

describe('AuthContext', () => {
  it('starts with no current user', async () => {
    render(
      <AuthProvider>
        <CurrentUserDisplay />
      </AuthProvider>
    );
    expect(screen.getByTestId('current').textContent).toBe('none');
  });

  it('login succeeds with correct credentials', async () => {
    render(
      <AuthProvider>
        <CurrentUserDisplay />
        <LoginButton email="michael@venturelab.com" password="password123" />
      </AuthProvider>
    );
    await act(async () => { fireEvent.click(screen.getByText('Login')); });
    await waitFor(() => expect(screen.getByTestId('current').textContent).toBe('Michael Chen'));
  });

  it('login fails with wrong password', async () => {
    let result: { success: boolean; error?: string } | null = null;
    function LoginCapture() {
      const { login } = useAuth();
      return (
        <button onClick={async () => { result = await login('michael@venturelab.com', 'wrong'); }}>
          Login
        </button>
      );
    }
    render(
      <AuthProvider>
        <LoginCapture />
      </AuthProvider>
    );
    await act(async () => { fireEvent.click(screen.getByText('Login')); });
    expect(result?.success).toBe(false);
    expect(result?.error).toMatch(/invalid/i);
  });

  it('login is case-insensitive for email', async () => {
    render(
      <AuthProvider>
        <CurrentUserDisplay />
        <LoginButton email="MICHAEL@venturelab.com" password="password123" />
      </AuthProvider>
    );
    await act(async () => { fireEvent.click(screen.getByText('Login')); });
    await waitFor(() => expect(screen.getByTestId('current').textContent).toBe('Michael Chen'));
  });

  it('logout clears current user', async () => {
    render(
      <AuthProvider>
        <CurrentUserDisplay />
        <LoginButton email="michael@venturelab.com" password="password123" />
        <LogoutButton />
      </AuthProvider>
    );
    await act(async () => { fireEvent.click(screen.getByText('Login')); });
    await waitFor(() => expect(screen.getByTestId('current').textContent).toBe('Michael Chen'));
    await act(async () => { fireEvent.click(screen.getByText('Logout')); });
    expect(screen.getByTestId('current').textContent).toBe('none');
    // Token should also have been cleared.
    expect(localStorage.getItem('vl_jwt')).toBeNull();
  });

  it('login persists a JWT in localStorage', async () => {
    render(
      <AuthProvider>
        <LoginButton email="emily@venturelab.com" password="password123" />
      </AuthProvider>
    );
    await act(async () => { fireEvent.click(screen.getByText('Login')); });
    await waitFor(() => expect(localStorage.getItem('vl_jwt')).toBeTruthy());
  });

  it('register adds a new user and logs them in', async () => {
    render(
      <AuthProvider>
        <CurrentUserDisplay />
        <RegisterButton email="newuser@test.com" />
      </AuthProvider>
    );
    await act(async () => { fireEvent.click(screen.getByText('Register')); });
    await waitFor(() => expect(screen.getByTestId('current').textContent).toBe('New User'));
  });

  it('register fails for duplicate email', async () => {
    let result: { success: boolean; error?: string } | null = null;
    function DupRegister() {
      const { register } = useAuth();
      return (
        <button
          onClick={async () => {
            result = await register({
              name: 'Dup', email: 'michael@venturelab.com',
              password: 'pass123', role: 'Investor',
            });
          }}
        >
          Dup
        </button>
      );
    }
    render(<AuthProvider><DupRegister /></AuthProvider>);
    await act(async () => { fireEvent.click(screen.getByText('Dup')); });
    expect(result?.success).toBe(false);
    expect(result?.error).toMatch(/already/i);
  });

  it('restores session from localStorage on mount', async () => {
    // Pretend the user logged in earlier — token + user already in storage.
    localStorage.setItem('vl_jwt', 'test-token-2');
    localStorage.setItem(
      'vl_current_user',
      JSON.stringify({ id: '2', name: 'Michael Chen', email: 'michael@venturelab.com', role: 'StartupOwner' }),
    );

    render(<AuthProvider><CurrentUserDisplay /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('current').textContent).toBe('Michael Chen'));
  });

  it('clears the session if the stored token is invalid', async () => {
    localStorage.setItem('vl_jwt', 'test-token-does-not-exist');
    localStorage.setItem(
      'vl_current_user',
      JSON.stringify({ id: 'gone', name: 'Ghost', email: 'g@x', role: 'Investor' }),
    );

    render(<AuthProvider><CurrentUserDisplay /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('current').textContent).toBe('none'));
    expect(localStorage.getItem('vl_jwt')).toBeNull();
  });

  it('throws when useAuth is used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<CurrentUserDisplay />)).toThrow('useAuth must be used within AuthProvider');
    console.error = consoleError;
  });

  it('auto-logs-out after IDLE_TIMEOUT_MS of inactivity', async () => {
    vi.useFakeTimers();
    try {
      render(
        <AuthProvider>
          <CurrentUserDisplay />
          <LoginButton email="michael@venturelab.com" password="password123" />
        </AuthProvider>
      );
      // Click + flush the login fetch under fake timers.
      await act(async () => {
        fireEvent.click(screen.getByText('Login'));
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByTestId('current').textContent).toBe('Michael Chen');

      // Idle past the window — should trigger logout.
      await act(async () => { await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS + 1000); });
      expect(screen.getByTestId('current').textContent).toBe('none');
      expect(localStorage.getItem('vl_jwt')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('user activity resets the idle timer', async () => {
    vi.useFakeTimers();
    try {
      render(
        <AuthProvider>
          <CurrentUserDisplay />
          <LoginButton email="michael@venturelab.com" password="password123" />
        </AuthProvider>
      );
      await act(async () => {
        fireEvent.click(screen.getByText('Login'));
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByTestId('current').textContent).toBe('Michael Chen');

      // Push almost to the edge, then "wiggle the mouse" → timer resets.
      await act(async () => { await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS - 5000); });
      await act(async () => {
        window.dispatchEvent(new MouseEvent('mousedown'));
        await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS - 5000);
      });
      // Still logged in — timer was reset by the mousedown.
      expect(screen.getByTestId('current').textContent).toBe('Michael Chen');
    } finally {
      vi.useRealTimers();
    }
  });
});
