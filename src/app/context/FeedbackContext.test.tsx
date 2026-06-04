import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { useFeedback, FeedbackProvider } from './FeedbackContext';
import { mockFeedback } from '../data/mockData';

function FeedbackCount() {
  const { feedback } = useFeedback();
  return <span data-testid="count">{feedback.length}</span>;
}

function AddFeedbackButton() {
  const { addFeedback } = useFeedback();
  return (
    <button
      onClick={() =>
        addFeedback({ ideaId: '1', user: 'Test User', rating: 4, comment: 'Very interesting idea!' })
      }
    >
      Add
    </button>
  );
}

function DeleteFirstButton() {
  const { feedback, deleteFeedback } = useFeedback();
  return <button onClick={() => deleteFeedback(feedback[0]?.id)}>Delete First</button>;
}

function UpdateFirstButton() {
  const { feedback, updateFeedback } = useFeedback();
  return (
    <button onClick={() => updateFeedback(feedback[0]?.id, { rating: 2, comment: 'Updated comment here.' })}>
      Update First
    </button>
  );
}

function FirstFeedbackComment() {
  const { feedback } = useFeedback();
  return <span data-testid="comment">{feedback[0]?.comment}</span>;
}

function FirstFeedbackRating() {
  const { feedback } = useFeedback();
  return <span data-testid="rating">{feedback[0]?.rating}</span>;
}

describe('FeedbackContext', () => {
  it('provides initial feedback from mockData', async () => {
    render(
      <FeedbackProvider>
        <FeedbackCount />
      </FeedbackProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockFeedback.length)));
  });

  it('adds new feedback', async () => {
    render(
      <FeedbackProvider>
        <FeedbackCount />
        <AddFeedbackButton />
      </FeedbackProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockFeedback.length)));
    await act(async () => { fireEvent.click(screen.getByText('Add')); });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockFeedback.length + 1)));
  });

  it('new feedback gets an id and createdAt date', async () => {
    let captured: ReturnType<typeof useFeedback>['feedback'] = [];

    function Capture() {
      const { feedback, addFeedback } = useFeedback();
      captured = feedback;
      return (
        <button onClick={() => addFeedback({ ideaId: '3', user: 'Sam', rating: 5, comment: 'This is a great idea!' })}>
          Add
        </button>
      );
    }

    render(
      <FeedbackProvider>
        <Capture />
      </FeedbackProvider>
    );

    await waitFor(() => expect(captured.length).toBeGreaterThanOrEqual(mockFeedback.length));
    const before = captured.length;
    await act(async () => { fireEvent.click(screen.getByText('Add')); });
    await waitFor(() => expect(captured.length).toBe(before + 1));

    const added = captured[captured.length - 1];
    expect(added.id).toBeTruthy();
    expect(added.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('deletes feedback', async () => {
    render(
      <FeedbackProvider>
        <FeedbackCount />
        <DeleteFirstButton />
      </FeedbackProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockFeedback.length)));
    await act(async () => { fireEvent.click(screen.getByText('Delete First')); });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockFeedback.length - 1)));
  });

  it('updates feedback comment and rating', async () => {
    render(
      <FeedbackProvider>
        <FirstFeedbackComment />
        <FirstFeedbackRating />
        <UpdateFirstButton />
      </FeedbackProvider>
    );
    await waitFor(() => expect(screen.getByTestId('comment').textContent).toBeTruthy());
    await act(async () => { fireEvent.click(screen.getByText('Update First')); });
    await waitFor(() => expect(screen.getByTestId('comment').textContent).toBe('Updated comment here.'));
    expect(screen.getByTestId('rating').textContent).toBe('2');
  });

  it('throws when useFeedback is used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<FeedbackCount />)).toThrow(
      'useFeedback must be used within FeedbackProvider'
    );
    console.error = consoleError;
  });
});
