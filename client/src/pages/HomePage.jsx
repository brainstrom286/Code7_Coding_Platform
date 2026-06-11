import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="landing">
      <div className="landing-card">
        <div className="logo">
          <span className="logo-icon">Code7</span>
          <h1>Mock Placement Platform</h1>
          <p>Mock test coding assessment platform</p>
        </div>
        <div className="landing-buttons">
          <Link to="/student/login" className="btn btn-primary btn-lg">Student Login</Link>
          <Link to="/student/register" className="btn btn-outline btn-lg">Student Register</Link>
          <Link to="/admin/login" className="btn btn-secondary btn-lg">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}
