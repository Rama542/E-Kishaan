import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageToggle from '@/components/LanguageToggle';
import {
  Leaf,
  CloudRain,
  Sprout,
  TrendingUp,
  Zap,
  Trophy,
  ArrowRight,
  Github,
} from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation();

  const stats = [
    { label: t('landing.stats.modules'), value: '6' },
    { label: t('landing.stats.roi'), value: '24%' },
    { label: t('landing.stats.soilAccuracy'), value: '85%' },
    { label: t('landing.stats.cropsTracked'), value: '3+' },
  ];

  const features = [
    { icon: CloudRain, ...t('landing.features.weather', { returnObjects: true }) },
    { icon: Leaf, ...t('landing.features.soil', { returnObjects: true }) },
    { icon: Sprout, ...t('landing.features.crop', { returnObjects: true }) },
    { icon: TrendingUp, ...t('landing.features.market', { returnObjects: true }) },
    { icon: Zap, ...t('landing.features.solver', { returnObjects: true }) },
    { icon: Trophy, ...t('landing.features.profile', { returnObjects: true }) },
  ] as { icon: typeof CloudRain; title: string; description: string }[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent leading-tight">
                {t('common.appName')}
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">{t('common.tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link to="/signup">{t('common.signUp')}</Link>
            </Button>
            <Button asChild size="lg" className="text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Link to="/dashboard">
                {t('common.openDashboard')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-20 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
          {t('landing.heroTitlePrefix')}{' '}
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {t('landing.heroTitleHighlight')}
          </span>
        </h2>
        <p className="mt-6 text-xl text-gray-600 max-w-xl mx-auto">
          {t('landing.heroSubtitle')}
        </p>

        <div className="mt-8">
          <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <Link to="/dashboard">
              {t('common.openDashboard')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
          {t('landing.featuresTitle')}
        </h3>
        <p className="mt-3 text-lg text-gray-600 text-center max-w-xl mx-auto">
          {t('landing.featuresSubtitle')}
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-2">
                  <feature.icon className="w-6 h-6 text-green-700" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-none text-white">
          <CardContent className="py-12">
            <h3 className="text-3xl md:text-4xl font-bold">{t('landing.ctaTitle')}</h3>
            <p className="mt-3 text-lg text-green-50">
              {t('landing.ctaSubtitle')}
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 text-lg px-8 py-6">
              <Link to="/dashboard">
                {t('common.openDashboard')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-100 bg-white/60">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-base text-gray-600">
          <div className="flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span>{t('common.appNameShort')}</span>
          </div>
          <a
            href="https://github.com/Rama542/Agri-Smart"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-green-700 transition-colors"
          >
            <Github className="w-5 h-5" />
            {t('common.viewOnGithub')}
          </a>
          <span className="text-sm text-gray-400">© {new Date().getFullYear()} {t('common.appNameShort')}</span>
        </div>
      </footer>
    </div>
  );
}
