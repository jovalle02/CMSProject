import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout({ admin }) {
  const location = useLocation();
  const isAdmin = admin || location.pathname.startsWith('/admin');

  return (
    <div className={`layout ${isAdmin ? 'layout--admin' : 'layout--public'}`}>
      <header className="header">
        <div className="header__inner">
          <Link to={isAdmin ? '/admin' : '/'} className="header__logo">
            {isAdmin ? 'CMS Admin' : 'Dynamic CMS'}
          </Link>
          <nav className="header__nav">
            {isAdmin ? (
              <>
                <Link to="/admin">Dashboard</Link>
                <Link to="/">View Site</Link>
              </>
            ) : (
              <>
                <Link to="/">Home</Link>
                <Link to="/admin">Admin</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
