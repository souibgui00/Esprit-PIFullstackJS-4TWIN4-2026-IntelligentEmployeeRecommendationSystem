import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    api.get('/dashboard')
      .then(res => {
        setStats(res.data);
        return Promise.all([
          api.get('/dashboard/departments').catch(() => ({ data: [] })),
          api.get('/dashboard/activities').catch(() => ({ data: [] })),
        ]);
      })
      .then(([deptRes, actRes]) => {
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        setActivities(Array.isArray(actRes.data) ? actRes.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load dashboard');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!isAuthenticated) return null;
  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div role="alert">{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      {user && <p>Welcome, {user.name}</p>}
      {stats.users?.total !== undefined && <p>{stats.users.total}</p>}
      {stats.activities?.total !== undefined && <p>{stats.activities.total}</p>}
      {stats.departments?.total !== undefined && <p>{stats.departments.total}</p>}
      <section>
        <h2>Departments</h2>
        {departments.length === 0
          ? <p>No departments found</p>
          : departments.map(d => (
              <div key={d.id}>{d.name} — {d.employeeCount} employees</div>
            ))
        }
      </section>
      <section>
        <h2>Recent Activities</h2>
        {activities.length === 0
          ? <p>No recent activities</p>
          : activities.map(a => (
              <div key={a.id}>{a.title}</div>
            ))
        }
      </section>
      <button onClick={fetchData}>Refresh</button>
    </div>
  );
};

export default Dashboard;
