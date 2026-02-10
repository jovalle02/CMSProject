import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/public/Home';
import CollectionPage from './pages/public/CollectionPage';
import EntryPage from './pages/public/EntryPage';
import Dashboard from './pages/admin/Dashboard';
import CollectionForm from './pages/admin/CollectionForm';
import EntryList from './pages/admin/EntryList';
import EntryForm from './pages/admin/EntryForm';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:slug" element={<CollectionPage />} />
        <Route path="/:slug/:id" element={<EntryPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<Layout admin />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/collections/new" element={<CollectionForm />} />
        <Route path="/admin/collections/:id" element={<CollectionForm />} />
        <Route path="/admin/:slug" element={<EntryList />} />
        <Route path="/admin/:slug/new" element={<EntryForm />} />
        <Route path="/admin/:slug/:id" element={<EntryForm />} />
      </Route>
    </Routes>
  );
}
