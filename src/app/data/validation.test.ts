import { describe, it, expect } from 'vitest';
import { validateIdea, hasErrors, validateOffer, validateFeedback, validateLogin, validateRegister } from './validation';

const validData = {
  title: 'My Startup Idea',
  industry: 'AI',
  stage: 'MVP',
  description: 'A detailed description that is long enough to pass validation.',
};

describe('validateIdea', () => {
  it('returns no errors for valid data', () => {
    expect(validateIdea(validData)).toEqual({});
  });

  // Title
  it('requires title', () => {
    const errors = validateIdea({ ...validData, title: '' });
    expect(errors.title).toBe('Title is required');
  });

  it('requires title to be at least 3 characters', () => {
    const errors = validateIdea({ ...validData, title: 'AB' });
    expect(errors.title).toBe('Title must be at least 3 characters');
  });

  it('requires title to be at most 100 characters', () => {
    const errors = validateIdea({ ...validData, title: 'A'.repeat(101) });
    expect(errors.title).toBe('Title must be at most 100 characters');
  });

  it('accepts title with exactly 3 characters', () => {
    const errors = validateIdea({ ...validData, title: 'ABC' });
    expect(errors.title).toBeUndefined();
  });

  it('accepts title with exactly 100 characters', () => {
    const errors = validateIdea({ ...validData, title: 'A'.repeat(100) });
    expect(errors.title).toBeUndefined();
  });

  it('ignores whitespace-only title', () => {
    const errors = validateIdea({ ...validData, title: '   ' });
    expect(errors.title).toBe('Title is required');
  });

  // Industry
  it('requires industry', () => {
    const errors = validateIdea({ ...validData, industry: '' });
    expect(errors.industry).toBe('Industry is required');
  });

  it('rejects invalid industry', () => {
    const errors = validateIdea({ ...validData, industry: 'Unknown' });
    expect(errors.industry).toBe('Invalid industry selected');
  });

  it('accepts valid industries', () => {
    const validIndustries = ['FinTech', 'HealthTech', 'EdTech', 'AI', 'SaaS', 'E-commerce', 'Other'];
    for (const industry of validIndustries) {
      const errors = validateIdea({ ...validData, industry });
      expect(errors.industry).toBeUndefined();
    }
  });

  // Stage
  it('requires stage', () => {
    const errors = validateIdea({ ...validData, stage: '' });
    expect(errors.stage).toBe('Stage is required');
  });

  it('rejects invalid stage', () => {
    const errors = validateIdea({ ...validData, stage: 'PreSeed' });
    expect(errors.stage).toBe('Invalid stage selected');
  });

  it('accepts valid stages', () => {
    const validStages = ['Idea', 'MVP', 'Beta', 'Launch'];
    for (const stage of validStages) {
      const errors = validateIdea({ ...validData, stage });
      expect(errors.stage).toBeUndefined();
    }
  });

  // Description
  it('requires description', () => {
    const errors = validateIdea({ ...validData, description: '' });
    expect(errors.description).toBe('Description is required');
  });

  it('requires description to be at least 20 characters', () => {
    const errors = validateIdea({ ...validData, description: 'Too short' });
    expect(errors.description).toBe('Description must be at least 20 characters');
  });

  it('requires description to be at most 500 characters', () => {
    const errors = validateIdea({ ...validData, description: 'A'.repeat(501) });
    expect(errors.description).toBe('Description must be at most 500 characters');
  });

  it('accepts description with exactly 20 characters', () => {
    const errors = validateIdea({ ...validData, description: 'A'.repeat(20) });
    expect(errors.description).toBeUndefined();
  });

  it('accepts description with exactly 500 characters', () => {
    const errors = validateIdea({ ...validData, description: 'A'.repeat(500) });
    expect(errors.description).toBeUndefined();
  });

  it('ignores whitespace-only description', () => {
    const errors = validateIdea({ ...validData, description: '   ' });
    expect(errors.description).toBe('Description is required');
  });

  it('can return multiple errors at once', () => {
    const errors = validateIdea({ title: '', industry: '', stage: '', description: '' });
    expect(errors.title).toBeDefined();
    expect(errors.industry).toBeDefined();
    expect(errors.stage).toBeDefined();
    expect(errors.description).toBeDefined();
  });
});

describe('hasErrors', () => {
  it('returns false when errors object is empty', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('returns true when there is at least one error', () => {
    expect(hasErrors({ title: 'Title is required' })).toBe(true);
  });

  it('returns true when multiple errors exist', () => {
    expect(hasErrors({ title: 'error', description: 'error' })).toBe(true);
  });
});

// ─── validateOffer ────────────────────────────────────────────────────────────

const validOffer = { amount: '50000', equity: '10', message: 'Very interested in this startup concept.' };

describe('validateOffer', () => {
  it('returns no errors for valid data', () => {
    expect(validateOffer(validOffer)).toEqual({});
  });

  it('requires amount', () => {
    expect(validateOffer({ ...validOffer, amount: '' }).amount).toBe('Amount is required');
  });

  it('rejects zero amount', () => {
    expect(validateOffer({ ...validOffer, amount: '0' }).amount).toBe('Amount must be a positive number');
  });

  it('rejects negative amount', () => {
    expect(validateOffer({ ...validOffer, amount: '-100' }).amount).toBe('Amount must be a positive number');
  });

  it('rejects amount above max', () => {
    expect(validateOffer({ ...validOffer, amount: '10000001' }).amount).toBe('Amount must be at most €10,000,000');
  });

  it('accepts amount at exactly the max', () => {
    expect(validateOffer({ ...validOffer, amount: '10000000' }).amount).toBeUndefined();
  });

  it('requires equity', () => {
    expect(validateOffer({ ...validOffer, equity: '' }).equity).toBe('Equity is required');
  });

  it('accepts equity of 0', () => {
    expect(validateOffer({ ...validOffer, equity: '0' }).equity).toBeUndefined();
  });

  it('rejects equity above 100', () => {
    expect(validateOffer({ ...validOffer, equity: '101' }).equity).toBe('Equity cannot exceed 100%');
  });

  it('accepts equity of exactly 100', () => {
    expect(validateOffer({ ...validOffer, equity: '100' }).equity).toBeUndefined();
  });

  it('requires message', () => {
    expect(validateOffer({ ...validOffer, message: '' }).message).toBe('Message is required');
  });

  it('rejects message shorter than 10 characters', () => {
    expect(validateOffer({ ...validOffer, message: 'Short' }).message).toBe('Message must be at least 10 characters');
  });

  it('rejects message longer than 500 characters', () => {
    expect(validateOffer({ ...validOffer, message: 'A'.repeat(501) }).message).toBe('Message must be at most 500 characters');
  });

  it('accepts message of exactly 10 characters', () => {
    expect(validateOffer({ ...validOffer, message: 'A'.repeat(10) }).message).toBeUndefined();
  });
});

// ─── validateFeedback ─────────────────────────────────────────────────────────

const validFeedback = { rating: 4, comment: 'Great idea, very innovative!' };

describe('validateFeedback', () => {
  it('returns no errors for valid data', () => {
    expect(validateFeedback(validFeedback)).toEqual({});
  });

  it('rejects rating of 0', () => {
    expect(validateFeedback({ ...validFeedback, rating: 0 }).rating).toBe('Rating must be between 1 and 5');
  });

  it('rejects rating of 6', () => {
    expect(validateFeedback({ ...validFeedback, rating: 6 }).rating).toBe('Rating must be between 1 and 5');
  });

  it('accepts ratings 1 through 5', () => {
    for (const r of [1, 2, 3, 4, 5]) {
      expect(validateFeedback({ ...validFeedback, rating: r }).rating).toBeUndefined();
    }
  });

  it('rejects non-integer rating', () => {
    expect(validateFeedback({ ...validFeedback, rating: 3.5 }).rating).toBe('Rating must be between 1 and 5');
  });

  it('requires comment', () => {
    expect(validateFeedback({ ...validFeedback, comment: '' }).comment).toBe('Comment is required');
  });

  it('rejects whitespace-only comment', () => {
    expect(validateFeedback({ ...validFeedback, comment: '   ' }).comment).toBe('Comment is required');
  });

  it('rejects comment shorter than 5 characters', () => {
    expect(validateFeedback({ ...validFeedback, comment: 'Hi' }).comment).toBe('Comment must be at least 5 characters');
  });

  it('rejects comment longer than 300 characters', () => {
    expect(validateFeedback({ ...validFeedback, comment: 'A'.repeat(301) }).comment).toBe('Comment must be at most 300 characters');
  });

  it('accepts comment of exactly 5 characters', () => {
    expect(validateFeedback({ ...validFeedback, comment: 'Hello' }).comment).toBeUndefined();
  });

  it('accepts comment of exactly 300 characters', () => {
    expect(validateFeedback({ ...validFeedback, comment: 'A'.repeat(300) }).comment).toBeUndefined();
  });
});

// ─── validateLogin ────────────────────────────────────────────────────────────

const validLogin = { email: 'user@example.com', password: 'secret123' };

describe('validateLogin', () => {
  it('returns no errors for valid data', () => {
    expect(validateLogin(validLogin)).toEqual({});
  });

  it('requires email', () => {
    expect(validateLogin({ ...validLogin, email: '' }).email).toBe('Email is required');
  });

  it('rejects invalid email format', () => {
    expect(validateLogin({ ...validLogin, email: 'notanemail' }).email).toBe('Invalid email format');
    expect(validateLogin({ ...validLogin, email: 'missing@' }).email).toBe('Invalid email format');
  });

  it('accepts valid email formats', () => {
    expect(validateLogin({ ...validLogin, email: 'a@b.co' }).email).toBeUndefined();
  });

  it('requires password', () => {
    expect(validateLogin({ ...validLogin, password: '' }).password).toBe('Password is required');
  });
});

// ─── validateRegister ─────────────────────────────────────────────────────────

const validRegister = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret123',
  confirmPassword: 'secret123',
  role: 'Investor',
};

describe('validateRegister', () => {
  it('returns no errors for valid data', () => {
    expect(validateRegister(validRegister)).toEqual({});
  });

  it('requires name', () => {
    expect(validateRegister({ ...validRegister, name: '' }).name).toBe('Name is required');
  });

  it('rejects name shorter than 2 characters', () => {
    expect(validateRegister({ ...validRegister, name: 'A' }).name).toBe('Name must be at least 2 characters');
  });

  it('rejects name longer than 60 characters', () => {
    expect(validateRegister({ ...validRegister, name: 'A'.repeat(61) }).name).toBe('Name must be at most 60 characters');
  });

  it('requires email', () => {
    expect(validateRegister({ ...validRegister, email: '' }).email).toBe('Email is required');
  });

  it('rejects invalid email', () => {
    expect(validateRegister({ ...validRegister, email: 'bad' }).email).toBe('Invalid email format');
  });

  it('requires password', () => {
    expect(validateRegister({ ...validRegister, password: '' }).password).toBe('Password is required');
  });

  it('rejects password shorter than 6 characters', () => {
    expect(validateRegister({ ...validRegister, password: '12345', confirmPassword: '12345' }).password).toBe('Password must be at least 6 characters');
  });

  it('requires confirm password', () => {
    expect(validateRegister({ ...validRegister, confirmPassword: '' }).confirmPassword).toBe('Please confirm your password');
  });

  it('rejects mismatched passwords', () => {
    expect(validateRegister({ ...validRegister, confirmPassword: 'different' }).confirmPassword).toBe('Passwords do not match');
  });

  it('requires role', () => {
    expect(validateRegister({ ...validRegister, role: '' }).role).toBe('Please select a role');
  });

  it('rejects invalid role', () => {
    expect(validateRegister({ ...validRegister, role: 'Admin' }).role).toBe('Invalid role selected');
  });

  it('accepts StartupOwner role', () => {
    expect(validateRegister({ ...validRegister, role: 'StartupOwner' }).role).toBeUndefined();
  });

  it('accepts Investor role', () => {
    expect(validateRegister({ ...validRegister, role: 'Investor' }).role).toBeUndefined();
  });
});
