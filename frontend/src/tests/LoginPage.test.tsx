import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';

describe('LoginPage Component', () => {
  it('renders login form in the exact required order: fields, primary button, OR divider, Google button', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    // Left Panel brand identity
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeInTheDocument();
    expect(
      screen.getByText('Access your company workspace with your email and password.')
    ).toBeInTheDocument();

    // 1. Email field
    const emailInput = screen.getByLabelText(/work email/i);
    expect(emailInput).toBeInTheDocument();

    // 2. Password field with Forgot? link
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forgot\?/i })).toBeInTheDocument();

    // 3. Helper text
    expect(
      screen.getByText(/By continuing, you agree to the Terms of Use and Privacy Policy/i)
    ).toBeInTheDocument();

    // 4. Primary full-width button "Sign in"
    const signInBtn = screen.getByRole('button', { name: /^sign in$/i });
    expect(signInBtn).toBeInTheDocument();

    // 5. OR divider
    expect(screen.getByText('OR')).toBeInTheDocument();

    // 6. Secondary outlined Google button
    const googleBtn = screen.getByRole('link', { name: /continue with google/i });
    expect(googleBtn).toBeInTheDocument();
    expect(googleBtn).toHaveAttribute('href', '/oauth2/authorization/google');

    // 7. Bottom link to create account
    expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument();

    // Verify DOM sequence of form elements
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    const formElements = form?.querySelectorAll('input, button[type="submit"], a[href="/oauth2/authorization/google"]');
    expect(formElements).toBeDefined();
    if (formElements) {
      expect(formElements[0]).toBe(emailInput);
      expect(formElements[1]).toBe(passwordInput);
      expect(formElements[2]).toBe(signInBtn);
      expect(formElements[3]).toBe(googleBtn);
    }

    // Check footer outside the card
    expect(screen.getByText(/Back to Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Meridian Enterprise Systems/i)).toBeInTheDocument();

    // Verification: "Authentication vs Authorization" box and "ENTERPRISE IDENTITY" divider removed
    expect(screen.queryByText(/Authentication vs Authorization/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ENTERPRISE IDENTITY/i)).not.toBeInTheDocument();
  });

  it('validates empty inputs and bad email formats on blur and submit', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/work email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const signInBtn = screen.getByRole('button', { name: /^sign in$/i });

    // Blur empty fields
    fireEvent.blur(emailInput);
    expect(screen.getByText('Please enter your work email')).toBeInTheDocument();

    fireEvent.blur(passwordInput);
    expect(screen.getByText('Please enter your password')).toBeInTheDocument();

    // Enter invalid email format
    fireEvent.change(emailInput, { target: { value: 'notanemail' } });
    fireEvent.blur(emailInput);
    expect(screen.getByText('Please enter a valid work email address')).toBeInTheDocument();

    // Submitting with invalid email
    fireEvent.click(signInBtn);
    expect(screen.getByText('Please enter a valid work email address')).toBeInTheDocument();
  });

  it('displays generic error "Invalid email or password" on credential submission', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/work email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const signInBtn = screen.getByRole('button', { name: /^sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'employee@meridian.internal' } });
    fireEvent.change(passwordInput, { target: { value: 'SecretPass123!' } });

    fireEvent.click(signInBtn);

    // Shows loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    // Displays generic bad credentials error in aria-live alert banner
    await waitFor(
      () => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Invalid email or password');
      },
      { timeout: 2000 }
    );
  });

  it('switches between Login and Register views without full page reload, preserving typed email', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const loginEmailInput = screen.getByLabelText(/work email/i);
    fireEvent.change(loginEmailInput, { target: { value: 'sarah.connor@meridian.internal' } });

    // Switch to Register
    const createAccountBtn = screen.getByRole('button', { name: /create an account/i });
    fireEvent.click(createAccountBtn);

    // Now in Register mode
    expect(screen.getByText("Looks like you're new here")).toBeInTheDocument();
    expect(
      screen.getByText('Create your account. HR will approve it before you get access.')
    ).toBeInTheDocument();

    // Register fields
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    const regEmailInput = screen.getByLabelText(/work email/i);
    expect(regEmailInput).toBeInTheDocument();
    expect(regEmailInput).toHaveValue('sarah.connor@meridian.internal'); // Preserved!

    expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument();

    // Switch back to Login
    const signInLink = screen.getByRole('button', { name: /^sign in$/i });
    fireEvent.click(signInLink);

    // Back to Login mode with email preserved
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toHaveValue('sarah.connor@meridian.internal');
  });

  it('updates live password strength meter and rule checklist in register mode', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <LoginPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Initial password entry (weak: only lowercase)
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    expect(screen.getByText('Very weak')).toBeInTheDocument();

    // Meets 8+ chars and uppercase
    fireEvent.change(passwordInput, { target: { value: 'LongerWord' } });
    expect(screen.getByText('Fair')).toBeInTheDocument();

    // Adds number
    fireEvent.change(passwordInput, { target: { value: 'LongerWord1' } });
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Adds symbol (Strong)
    fireEvent.change(passwordInput, { target: { value: 'LongerWord1!' } });
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('navigates to "Check your inbox" and "Awaiting HR approval" after register submission', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Marcus Sterling' } });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'marcus@meridian.internal' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Pass123!Secure' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Pass123!Secure' },
    });

    const createBtn = screen.getByRole('button', { name: /^create account$/i });
    fireEvent.click(createBtn);

    // Transitions to "Check your inbox"
    await waitFor(
      () => {
        expect(screen.getByText('Check your inbox')).toBeInTheDocument();
        expect(screen.getByText('marcus@meridian.internal')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Click "I've verified my email" to transition to "Awaiting HR approval"
    const verifiedBtn = screen.getByRole('button', { name: /i've verified my email/i });
    fireEvent.click(verifiedBtn);

    expect(screen.getByText('Awaiting HR approval')).toBeInTheDocument();
    expect(screen.getByText(/Pending HR Review/i)).toBeInTheDocument();

    // "Back to Sign in" takes user back to Login view
    const backBtn = screen.getByRole('button', { name: /back to sign in/i });
    fireEvent.click(backBtn);

    expect(screen.getByRole('heading', { name: /^login$/i })).toBeInTheDocument();
  });
});
