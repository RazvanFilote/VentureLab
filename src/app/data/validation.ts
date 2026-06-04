export interface IdeaFormData {
  title: string;
  industry: string;
  stage: string;
  description: string;
}

export interface IdeaValidationErrors {
  title?: string;
  industry?: string;
  stage?: string;
  description?: string;
}

const VALID_INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "AI",
  "SaaS",
  "E-commerce",
  "Other",
];

const VALID_STAGES = ["Idea", "MVP", "Beta", "Launch"];

export function validateIdea(data: IdeaFormData): IdeaValidationErrors {
  const errors: IdeaValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = "Title is required";
  } else if (data.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters";
  } else if (data.title.trim().length > 100) {
    errors.title = "Title must be at most 100 characters";
  }

  if (!data.industry) {
    errors.industry = "Industry is required";
  } else if (!VALID_INDUSTRIES.includes(data.industry)) {
    errors.industry = "Invalid industry selected";
  }

  if (!data.stage) {
    errors.stage = "Stage is required";
  } else if (!VALID_STAGES.includes(data.stage)) {
    errors.stage = "Invalid stage selected";
  }

  if (!data.description.trim()) {
    errors.description = "Description is required";
  } else if (data.description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters";
  } else if (data.description.trim().length > 500) {
    errors.description = "Description must be at most 500 characters";
  }

  return errors;
}

export function hasErrors(errors: IdeaValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

// ─── Offer ────────────────────────────────────────────────────────────────────

export interface OfferFormData {
  amount: string;
  equity: string;
  message: string;
}

export interface OfferValidationErrors {
  amount?: string;
  equity?: string;
  message?: string;
}

export function validateOffer(data: OfferFormData): OfferValidationErrors {
  const errors: OfferValidationErrors = {};
  const amount = Number(data.amount);
  const equity = Number(data.equity);

  if (!data.amount.trim()) {
    errors.amount = "Amount is required";
  } else if (isNaN(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive number";
  } else if (amount > 10_000_000) {
    errors.amount = "Amount must be at most €10,000,000";
  }

  if (!data.equity.trim()) {
    errors.equity = "Equity is required";
  } else if (isNaN(equity) || equity < 0) {
    errors.equity = "Equity must be 0 or greater";
  } else if (equity > 100) {
    errors.equity = "Equity cannot exceed 100%";
  }

  if (!data.message.trim()) {
    errors.message = "Message is required";
  } else if (data.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  } else if (data.message.trim().length > 500) {
    errors.message = "Message must be at most 500 characters";
  }

  return errors;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export interface FeedbackFormData {
  rating: number;
  comment: string;
}

export interface FeedbackValidationErrors {
  rating?: string;
  comment?: string;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginValidationErrors {
  email?: string;
  password?: string;
}

export function validateLogin(data: LoginFormData): LoginValidationErrors {
  const errors: LoginValidationErrors = {};
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Invalid email format";
  }
  if (!data.password) {
    errors.password = "Password is required";
  }
  return errors;
}

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export interface RegisterValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

const VALID_ROLES = ["StartupOwner", "Investor"];

export function validateRegister(data: RegisterFormData): RegisterValidationErrors {
  const errors: RegisterValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (data.name.trim().length > 60) {
    errors.name = "Name must be at most 60 characters";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Invalid email format";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  } else if (data.password.length > 100) {
    errors.password = "Password must be at most 100 characters";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!data.role) {
    errors.role = "Please select a role";
  } else if (!VALID_ROLES.includes(data.role)) {
    errors.role = "Invalid role selected";
  }

  return errors;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export function validateFeedback(data: FeedbackFormData): FeedbackValidationErrors {
  const errors: FeedbackValidationErrors = {};

  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    errors.rating = "Rating must be between 1 and 5";
  }

  if (!data.comment.trim()) {
    errors.comment = "Comment is required";
  } else if (data.comment.trim().length < 5) {
    errors.comment = "Comment must be at least 5 characters";
  } else if (data.comment.trim().length > 300) {
    errors.comment = "Comment must be at most 300 characters";
  }

  return errors;
}
