import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useEffect } from 'react';
import { BookmarksProvider, useBookmarks } from './BookmarksContext';
import { AuthProvider } from './AuthContext';
import { useAuth } from './AuthContext';

function LoginHelper() {
  const { login } = useAuth();
  useEffect(() => { login('emily@venturelab.com', 'password123'); }, []);
  return null;
}

function BookmarkDisplay({ ideaId }: { ideaId: string }) {
  const { isBookmarked, savedIdeaIds } = useBookmarks();
  return (
    <>
      <span data-testid="saved-count">{savedIdeaIds.length}</span>
      <span data-testid="is-saved">{isBookmarked(ideaId) ? 'yes' : 'no'}</span>
    </>
  );
}

function ToggleButton({ ideaId }: { ideaId: string }) {
  const { toggleBookmark } = useBookmarks();
  return <button onClick={() => toggleBookmark(ideaId)}>Toggle</button>;
}

function renderBookmarks(ideaId = 'idea-1') {
  return render(
    <AuthProvider>
      <BookmarksProvider>
        <LoginHelper />
        <BookmarkDisplay ideaId={ideaId} />
        <ToggleButton ideaId={ideaId} />
      </BookmarksProvider>
    </AuthProvider>
  );
}

describe('BookmarksContext', () => {
  it('starts with no saved ideas', async () => {
    renderBookmarks();
    await screen.findByTestId('saved-count');
    expect(screen.getByTestId('saved-count').textContent).toBe('0');
  });

  it('isBookmarked returns false for unsaved idea', async () => {
    renderBookmarks();
    await screen.findByTestId('is-saved');
    expect(screen.getByTestId('is-saved').textContent).toBe('no');
  });

  it('toggleBookmark adds an idea to saved', async () => {
    renderBookmarks();
    await screen.findByTestId('saved-count');
    act(() => screen.getByText('Toggle').click());
    expect(screen.getByTestId('saved-count').textContent).toBe('1');
    expect(screen.getByTestId('is-saved').textContent).toBe('yes');
  });

  it('toggleBookmark removes already saved idea', async () => {
    renderBookmarks();
    await screen.findByTestId('saved-count');
    act(() => screen.getByText('Toggle').click()); // add
    act(() => screen.getByText('Toggle').click()); // remove
    expect(screen.getByTestId('saved-count').textContent).toBe('0');
    expect(screen.getByTestId('is-saved').textContent).toBe('no');
  });

  it('throws when used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    function Bad() {
      const { savedIdeaIds } = useBookmarks();
      return <span>{savedIdeaIds.length}</span>;
    }
    expect(() => render(<Bad />)).toThrow('useBookmarks must be used within BookmarksProvider');
    console.error = consoleError;
  });
});
