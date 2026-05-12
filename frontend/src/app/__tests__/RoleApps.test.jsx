import React from 'react';
import { render } from '@testing-library/react';
import AdminApp from '../../AdminApp';
import EmployeeApp from '../../EmployeeApp';
import HRApp from '../../HRApp';
import ManagerApp from '../../ManagerApp';

const routeCalls = [];
const mockUseLocation = jest.fn();

jest.mock('@/components/PortalLayout', () => ({
  PortalLayout: ({ role, children }) => (
    <div data-testid="portal-layout" data-role={role}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/employees/employee-profile-route-page', () => ({
  EmployeeProfileRoutePage: () => <div data-testid="employee-profile-route" />,
}));

jest.mock('@/lib/data-store', () => ({
  useData: () => ({
    participations: [],
    loading: false,
    fetchCombinedScore: jest.fn().mockResolvedValue({ combinedScore: 0 }),
  }),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

jest.mock('react-router-dom', () => ({
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: (props) => {
    routeCalls.push(props);
    return <div data-testid={`route-${props.path || 'index'}`} />;
  },
  Navigate: ({ to, replace }) => (
    <div data-testid="navigate" data-to={to} data-replace={String(replace)} />
  ),
  useLocation: () => mockUseLocation(),
}));

describe('Role apps routing', () => {
  beforeEach(() => {
    routeCalls.length = 0;
    mockUseLocation.mockReturnValue({ pathname: '/admin' });
  });

  it('renders AdminApp with admin role by default', () => {
    const { getByTestId } = render(<AdminApp />);
    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'admin');
  });

  it('renders AdminApp with hr role when pathname starts with /hr', () => {
    mockUseLocation.mockReturnValue({ pathname: '/hr/anything' });
    const { getByTestId } = render(<AdminApp />);
    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'hr');
  });

  it('configures AdminApp wildcard redirect to role root', () => {
    render(<AdminApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/admin');
    expect(wildcard.element.props.replace).toBe(true);
  });

  it('renders EmployeeApp with employee role and wildcard redirect', () => {
    const { getByTestId } = render(<EmployeeApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'employee');
    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/employee');
    expect(wildcard.element.props.replace).toBe(true);
  });

  it('renders HRApp with hr role and wildcard redirect', () => {
    const { getByTestId } = render(<HRApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'hr');
    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/hr');
    expect(wildcard.element.props.replace).toBe(true);
  });

  it('renders ManagerApp with manager role and wildcard redirect', () => {
    const { getByTestId } = render(<ManagerApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'manager');
    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/manager');
    expect(wildcard.element.props.replace).toBe(true);
  });
});