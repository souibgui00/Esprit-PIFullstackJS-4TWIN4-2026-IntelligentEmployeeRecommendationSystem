import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Import the component via relative path to components folder
// Mock face scanner to avoid importing heavy face-api.js inside tests
jest.mock('@/components/auth/face-id-scanner', () => ({ FaceIdScanner: () => <div /> }))

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { name: 'Alice', email: 'alice@example.com', telephone: '123' },
    updateProfile: jest.fn().mockResolvedValue({}),
    changePassword: jest.fn().mockResolvedValue({}),
    registerFace: jest.fn().mockResolvedValue({}),
  })
}))

import { ProfileSettings } from '../../../components/profile/ProfileSettings'

describe('ProfileSettings', () => {
  it('renders profile fields and allows update', async () => {
    render(<ProfileSettings />)

    const name = screen.getByLabelText(/Full Name/i)
    const email = screen.getByLabelText(/Email Address/i)
    const phone = screen.getByLabelText(/Phone Number/i)
    const save = screen.getByRole('button', { name: /save changes/i })

    expect(name).toBeInTheDocument()
    expect(email).toBeInTheDocument()
    expect(phone).toBeInTheDocument()

    fireEvent.change(name, { target: { value: 'Alice Smith' } })
    fireEvent.click(save)

    expect(save).toBeInTheDocument()
  })
})
