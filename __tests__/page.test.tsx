import { render, screen } from '@testing-library/react'
import Page from '../src/app/page'

// Mock the useRouter hook if Next.js uses it
jest.mock('next/navigation', () => ({
  useRouter() {
    return { prefetch: () => null };
  }
}));

describe('Orchestrator Dashboard', () => {
  it('renders the dashboard title', () => {
    render(<Page />)
    const heading = screen.getByText(/Railway/i)
    expect(heading).toBeInTheDocument()
  })
})
