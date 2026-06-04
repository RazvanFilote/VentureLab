import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { useIdeas, IdeasProvider } from './IdeasContext';
import { mockIdeas } from '../data/mockData';

function IdeaCount() {
  const { ideas } = useIdeas();
  return <span data-testid="count">{ideas.length}</span>;
}

function AddIdeaButton() {
  const { addIdea } = useIdeas();
  return (
    <button
      onClick={() =>
        addIdea({
          title: 'New Test Idea',
          industry: 'AI',
          stage: 'Idea',
          description: 'A description for the new test idea.',
          createdBy: 'Test Author',
        })
      }
    >
      Add
    </button>
  );
}

function DeleteFirstButton() {
  const { ideas, deleteIdea } = useIdeas();
  return (
    <button onClick={() => deleteIdea(ideas[0]?.id)}>Delete First</button>
  );
}

function UpdateFirstButton() {
  const { ideas, updateIdea } = useIdeas();
  return (
    <button
      onClick={() =>
        updateIdea(ideas[0]?.id, {
          title: 'Updated Title',
          industry: 'SaaS',
          stage: 'Beta',
          description: 'Updated description that is long enough.',
        })
      }
    >
      Update First
    </button>
  );
}

function FirstIdeaTitle() {
  const { ideas } = useIdeas();
  return <span data-testid="first-title">{ideas[0]?.title}</span>;
}

describe('IdeasContext', () => {
  it('provides initial ideas from mockData', async () => {
    render(
      <IdeasProvider>
        <IdeaCount />
      </IdeasProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockIdeas.length)));
  });

  it('adds a new idea', async () => {
    render(
      <IdeasProvider>
        <IdeaCount />
        <AddIdeaButton />
      </IdeasProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockIdeas.length)));
    await act(async () => { fireEvent.click(screen.getByText('Add')); });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockIdeas.length + 1)));
  });

  it('deletes an idea', async () => {
    render(
      <IdeasProvider>
        <IdeaCount />
        <DeleteFirstButton />
      </IdeasProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockIdeas.length)));
    await act(async () => { fireEvent.click(screen.getByText('Delete First')); });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockIdeas.length - 1)));
  });

  it('updates an idea', async () => {
    render(
      <IdeasProvider>
        <FirstIdeaTitle />
        <UpdateFirstButton />
      </IdeasProvider>
    );
    await waitFor(() => expect(screen.getByTestId('first-title').textContent).toBeTruthy());
    await act(async () => { fireEvent.click(screen.getByText('Update First')); });
    await waitFor(() => expect(screen.getByTestId('first-title').textContent).toBe('Updated Title'));
  });

  it('throws when useIdeas is used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<IdeaCount />)).toThrow(
      'useIdeas must be used within IdeasProvider'
    );
    console.error = consoleError;
  });

  it('new idea gets a unique id, correct createdAt and zero ratings', async () => {
    let capturedIdeas: ReturnType<typeof useIdeas>['ideas'] = [];

    function Capture() {
      const { ideas, addIdea } = useIdeas();
      capturedIdeas = ideas;
      return (
        <button
          onClick={() =>
            addIdea({
              title: 'Check Fields',
              industry: 'EdTech',
              stage: 'Launch',
              description: 'Checking that auto-assigned fields are correct.',
              createdBy: 'Test Author',
            })
          }
        >
          Add
        </button>
      );
    }

    render(
      <IdeasProvider>
        <Capture />
      </IdeasProvider>
    );

    await waitFor(() => expect(capturedIdeas.length).toBeGreaterThanOrEqual(mockIdeas.length));
    const before = capturedIdeas.length;
    await act(async () => { fireEvent.click(screen.getByText('Add')); });
    await waitFor(() => expect(capturedIdeas.length).toBe(before + 1));

    const newIdea = capturedIdeas[capturedIdeas.length - 1];
    expect(newIdea.avgRating).toBe(0);
    expect(newIdea.feedbackCount).toBe(0);
    expect(newIdea.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(newIdea.id).toBeTruthy();
  });
});
