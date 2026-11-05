import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

describe('AccessDeniedPage Component', () => {
  it('renders attempted email and explains why authorization was denied', () => {
    render(
      <MemoryRouter initialEntries={['/access-denied?error=not_found&email=unknown.user@google.com']}>
        <AccessDeniedPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Employee Record Not Found')).toBeInTheDocument();
    expect(screen.getByText('unknown.user@google.com')).toBeInTheDocument();
    expect(screen.getByText(/Your Google identity was cryptographically verified/i)).toBeInTheDocument();

    const switchBtn = screen.getByRole('link', { name: /sign in with a different google account/i });
    expect(switchBtn).toBeInTheDocument();
    expect(switchBtn).toHaveAttribute('href', '/oauth2/authorization/google');
  });

  it('renders deactivated message when error=inactive', () => {
    render(
      <MemoryRouter initialEntries={['/access-denied?error=inactive&email=toby.flenderson@meridian.internal']}>
        <AccessDeniedPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Account Inactive or Deactivated')).toBeInTheDocument();
    expect(screen.getByText('toby.flenderson@meridian.internal')).toBeInTheDocument();
  });
});

