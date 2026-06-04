import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { useOffers, OffersProvider } from './OffersContext';
import { mockOffers } from '../data/mockData';

function OfferCount() {
  const { offers } = useOffers();
  return <span data-testid="count">{offers.length}</span>;
}

function AddOfferButton() {
  const { addOffer } = useOffers();
  return (
    <button
      onClick={() =>
        addOffer({
          ideaId: '1',
          ideaTitle: 'Test Idea',
          investorName: 'Test Investor',
          amount: 50000,
          equity: 10,
          message: 'Interested in this idea.',
        })
      }
    >
      Add
    </button>
  );
}

function DeleteFirstButton() {
  const { offers, deleteOffer } = useOffers();
  return <button onClick={() => deleteOffer(offers[0]?.id)}>Delete First</button>;
}

function AcceptFirstButton() {
  const { offers, updateOfferStatus } = useOffers();
  return (
    <button onClick={() => updateOfferStatus(offers[0]?.id, 'Accepted')}>
      Accept First
    </button>
  );
}

function RejectFirstButton() {
  const { offers, updateOfferStatus } = useOffers();
  return (
    <button onClick={() => updateOfferStatus(offers[0]?.id, 'Rejected')}>
      Reject First
    </button>
  );
}

function FirstOfferStatus() {
  const { offers } = useOffers();
  return <span data-testid="status">{offers[0]?.status}</span>;
}

describe('OffersContext', () => {
  it('provides initial offers from mockData', async () => {
    render(
      <OffersProvider>
        <OfferCount />
      </OffersProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockOffers.length)));
  });

  it('adds a new offer with Pending status', async () => {
    let capturedOffers: ReturnType<typeof useOffers>['offers'] = [];

    function Capture() {
      const { offers, addOffer } = useOffers();
      capturedOffers = offers;
      return (
        <button
          onClick={() =>
            addOffer({
              ideaId: '2',
              ideaTitle: 'Some Idea',
              investorName: 'Investor X',
              amount: 100000,
              equity: 15,
              message: 'Great opportunity here.',
            })
          }
        >
          Add
        </button>
      );
    }

    render(
      <OffersProvider>
        <Capture />
      </OffersProvider>
    );

    await waitFor(() => expect(capturedOffers.length).toBeGreaterThanOrEqual(mockOffers.length));
    const before = capturedOffers.length;
    await act(async () => { fireEvent.click(screen.getByText('Add')); });
    await waitFor(() => expect(capturedOffers.length).toBe(before + 1));

    const newOffer = capturedOffers[capturedOffers.length - 1];
    expect(newOffer.status).toBe('Pending');
    expect(newOffer.ideaId).toBe('2');
    expect(newOffer.amount).toBe(100000);
    expect(newOffer.id).toBeTruthy();
  });

  it('increases offer count after add', async () => {
    render(
      <OffersProvider>
        <OfferCount />
        <AddOfferButton />
      </OffersProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockOffers.length)));
    await act(async () => { fireEvent.click(screen.getByText('Add')); });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockOffers.length + 1)));
  });

  it('deletes an offer', async () => {
    render(
      <OffersProvider>
        <OfferCount />
        <DeleteFirstButton />
      </OffersProvider>
    );
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockOffers.length)));
    await act(async () => { fireEvent.click(screen.getByText('Delete First')); });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe(String(mockOffers.length - 1)));
  });

  it('accepts an offer', async () => {
    render(
      <OffersProvider>
        <FirstOfferStatus />
        <AcceptFirstButton />
      </OffersProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBeTruthy());
    await act(async () => { fireEvent.click(screen.getByText('Accept First')); });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('Accepted'));
  });

  it('rejects an offer', async () => {
    render(
      <OffersProvider>
        <FirstOfferStatus />
        <RejectFirstButton />
      </OffersProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBeTruthy());
    await act(async () => { fireEvent.click(screen.getByText('Reject First')); });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('Rejected'));
  });

  it('throws when useOffers is used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<OfferCount />)).toThrow(
      'useOffers must be used within OffersProvider'
    );
    console.error = consoleError;
  });
});
