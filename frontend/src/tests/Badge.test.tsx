import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/Badge';

describe('Badge Component', () => {
  it('renders ACTIVE status badge correctly', () => {
    render(<Badge variant="status" value="ACTIVE" />);
    const badge = screen.getByText('ACTIVE');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-emerald-800');
  });

  it('renders INACTIVE status badge correctly', () => {
    render(<Badge variant="status" value="INACTIVE" />);
    const badge = screen.getByText('INACTIVE');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-slate-600');
  });

  it('renders ADMIN role badge with prominent enterprise styling', () => {
    render(<Badge variant="role" value="ADMIN" />);
    const badge = screen.getByText('ADMIN');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-slate-900');
  });
});

