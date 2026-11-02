import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function NotFound() {
  useDocumentMeta({ title: 'Page not found', noindex: true });
  return (
    <section className="notfound">
      <div className="container">
        <span className="notfound__code" aria-hidden="true">404</span>
        <h1 className="display-lg">This road doesn&rsquo;t lead anywhere.</h1>
        <p className="lead">The page you are looking for may have moved or no longer exists.</p>
        <div className="notfound__actions">
          <Link to="/" className="btn btn--dark">Back to home</Link>
          <Link to="/vehicles" className="btn btn--outline">View vehicles</Link>
        </div>
      </div>
    </section>
  );
}
