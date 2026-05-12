import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import EmployeesPage from '../../../app/employees/page'

// Mock aliased components so the page import resolves to our stubs
jest.mock('@/components/employees/employee-table', () => ({ EmployeeTable: ({ onSelectEmployee }) => (
  <div>
    <button onClick={() => onSelectEmployee({ id: 'e1', name: 'E One' })}>Select</button>
  </div>
)}))
jest.mock('@/components/employees/employee-profile', () => ({ EmployeeProfile: ({ employee }) => (
  <div>Profile: {employee?.name}</div>
)}))

// Mock dashboard parts referenced by the page
jest.mock('@/components/dashboard/sidebar', () => ({ Sidebar: () => <div /> }))
jest.mock('@/components/dashboard/header', () => ({ Header: ({ title }) => <div>{title}</div> }))

describe('Employees page', () => {
  it('shows employee profile after selection', async () => {
    render(<EmployeesPage />)
    const btn = await screen.findByRole('button', { name: /select/i })
    expect(btn).toBeInTheDocument()
    await userEvent.click(btn)
    expect(await screen.findByText(/Profile: E One/)).toBeInTheDocument()
  })
})
