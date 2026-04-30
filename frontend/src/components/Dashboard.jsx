import { useEffect, useState } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {data && <pre>{JSON.stringify(data)}</pre>}
    </div>
  );
};

export default Dashboard;
