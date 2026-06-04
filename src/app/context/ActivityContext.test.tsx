import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ActivityProvider, useActivity } from './ActivityContext';

// Mock document.cookie
const cookieStore: Record<string, string> = {};
beforeEach(() => {
  Object.keys(cookieStore).forEach((k) => delete cookieStore[k]);
  vi.spyOn(document, 'cookie', 'get').mockImplementation(() =>
    Object.entries(cookieStore)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
  );
  Object.defineProperty(document, 'cookie', {
    get: () =>
      Object.entries(cookieStore)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('; '),
    set: (val: string) => {
      const [pair] = val.split(';');
      const [name, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (val.includes('1970')) {
        delete cookieStore[name.trim()];
      } else {
        cookieStore[name.trim()] = decodeURIComponent(value);
      }
    },
    configurable: true,
  });
});

function Display() {
  const { activity } = useActivity();
  return (
    <>
      <span data-testid="visits">{activity.pageVisits.length}</span>
      <span data-testid="ideas">{activity.recentlyViewedIdeas.length}</span>
      <span data-testid="filter">{activity.lastFilter}</span>
      <span data-testid="offers">{activity.offersSentCount}</span>
      <span data-testid="feedback">{activity.feedbackGivenCount}</span>
    </>
  );
}

function Controls() {
  const { trackPageVisit, trackIdeaView, trackFilterUsed, trackOfferSent, trackFeedbackGiven, clearActivity } = useActivity();
  return (
    <>
      <button onClick={() => trackPageVisit('/test')}>Visit</button>
      <button onClick={() => trackIdeaView('idea-1')}>View Idea</button>
      <button onClick={() => trackFilterUsed('AI')}>Filter</button>
      <button onClick={() => trackOfferSent()}>Offer</button>
      <button onClick={() => trackFeedbackGiven()}>Feedback</button>
      <button onClick={() => clearActivity()}>Clear</button>
    </>
  );
}

function renderActivity() {
  return render(
    <ActivityProvider>
      <Display />
      <Controls />
    </ActivityProvider>
  );
}

describe('ActivityContext', () => {
  it('starts with no page visits', () => {
    renderActivity();
    expect(screen.getByTestId('visits').textContent).toBe('0');
  });

  it('tracks page visits', () => {
    renderActivity();
    act(() => screen.getByText('Visit').click());
    expect(screen.getByTestId('visits').textContent).toBe('1');
  });

  it('tracks multiple page visits', () => {
    renderActivity();
    act(() => screen.getByText('Visit').click());
    act(() => screen.getByText('Visit').click());
    expect(screen.getByTestId('visits').textContent).toBe('2');
  });

  it('tracks recently viewed ideas', () => {
    renderActivity();
    act(() => screen.getByText('View Idea').click());
    expect(screen.getByTestId('ideas').textContent).toBe('1');
  });

  it('deduplicates viewed ideas', () => {
    renderActivity();
    act(() => screen.getByText('View Idea').click());
    act(() => screen.getByText('View Idea').click());
    expect(screen.getByTestId('ideas').textContent).toBe('1');
  });

  it('tracks filter used', () => {
    renderActivity();
    act(() => screen.getByText('Filter').click());
    expect(screen.getByTestId('filter').textContent).toBe('AI');
  });

  it('tracks offers sent count', () => {
    renderActivity();
    act(() => screen.getByText('Offer').click());
    act(() => screen.getByText('Offer').click());
    expect(screen.getByTestId('offers').textContent).toBe('2');
  });

  it('tracks feedback given count', () => {
    renderActivity();
    act(() => screen.getByText('Feedback').click());
    expect(screen.getByTestId('feedback').textContent).toBe('1');
  });

  it('clears all activity', () => {
    renderActivity();
    act(() => screen.getByText('Visit').click());
    act(() => screen.getByText('Offer').click());
    act(() => screen.getByText('Clear').click());
    expect(screen.getByTestId('visits').textContent).toBe('0');
    expect(screen.getByTestId('offers').textContent).toBe('0');
  });

  it('throws when used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<Display />)).toThrow('useActivity must be used within ActivityProvider');
    console.error = consoleError;
  });
});
