import { useEffect, useState } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/dashboard')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError('Failed to load dashboard'); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {data?.user && <p>Welcome, {data.user.name}</p>}
      {data?.departments && (
        <section>
          <h2>Departments</h2>
          {data.departments.length === 0
            ? <p>No departments found</p>
            : data.departments.map(d => (
                <div key={d.id}>{d.name} — {d.employeeCount} employees</div>
              ))
          }
        </section>
      )}
      {data?.activities && (
        <section>
          <h2>Recent Activities</h2>
          {data.activities.length === 0
            ? <p>No recent activities</p>
            : data.activities.map(a => (
                <div key={a.id}>{a.title}</div>
              ))
          }
        </section>
      )}
      <button onClick={fetchData}>Refresh</button>
    </div>
  );
};

export default Dashboard;
