import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { t } from '../lib/i18n';

export default function HomePage() {
  return (
    <div className="page page--home">
      <section className="hero">
        <p className="eyebrow">ServiceHub</p>
        <h1>{t('welcome')}</h1>
        <p className="hero__copy">
          {t('apiNotice')}
        </p>
        <div className="hero__actions">
          <Link className="button button--primary" to="/login">
            {t('login')}
          </Link>
          <Link className="button button--secondary" to="/register">
            {t('register')}
          </Link>
        </div>
      </section>

      <div className="grid grid--2">
        <Card title="Foundation" subtitle="Environment + API contract + token handling">
          <ul className="list">
            <li>Public frontend env is configured.</li>
            <li>API base points to the real backend: http://localhost:5000/api</li>
            <li>Access tokens are attached to authenticated calls.</li>
          </ul>
        </Card>

        <Card title="Phase 1 scope" subtitle="Frontend shell only">
          <ul className="list">
            <li>Basic routing shell</li>
            <li>Shared design tokens</li>
            <li>Reusable primitive components</li>
            <li>I18n foundation</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
