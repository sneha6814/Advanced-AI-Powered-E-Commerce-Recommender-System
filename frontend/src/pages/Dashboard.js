import { jwtDecode } from 'jwt-decode';
import { getToken } from '../utils/auth';

function Dashboard() {
  const token = getToken();
  const user = token ? jwtDecode(token) : null;

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <p>Welcome, {user.name || 'User'}!</p>
          <p>Email: {user.email || 'Unknown'}</p>
        </div>
      ) : (
        <p>No user info found.</p>
      )}
    </div>
  );
}

export default Dashboard;
