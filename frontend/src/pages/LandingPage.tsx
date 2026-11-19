import { Link } from 'react-router-dom'
import {
  FileText, Brain, Target, BarChart3, Zap, Shield, ArrowRight
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

const features = [
  { icon: FileText, title: 'Smart Parsing', desc: 'Extract skills, experience, education from PDF/DOCX with 95%+ accuracy' },
  { icon: Brain, title: 'AI Analysis', desc: 'Get ATS score, section breakdown, weak phrase detection, and rewrite suggestions via Claude' },
  { icon: Target, title: 'Job Matching', desc: 'Hybrid semantic + skill matching across 200+ curated jobs with match % and gap analysis' },
  { icon: BarChart3, title: 'Skill Gaps', desc: 'Aggregated missing skills ranked by market demand with curated learning resources' },
  { icon: Zap, title: 'JD Matcher', desc: 'Paste any job description to see instant match score, keyword gaps, and tailored summary' },
  { icon: Shield, title: 'Application Tracker', desc: 'Save jobs, track applications through pipeline: Saved → Applied → Interview → Offer' },
]

const stats = [
  { value: '95%+', label: 'Parse Accuracy' },
  { value: '200+', label: 'Curated Jobs' },
  { value: '< 3s', label: 'Analysis Time' },
  { value: 'Free', label: 'Core Features' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-foreground">AI Resume Analyzer</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Transform Your Resume into
            <br />
            <span className="text-primary-600">Interview Opportunities</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your resume and get an instant ATS score, AI-powered improvements,
            personalized job matches, and a clear skill-gap roadmap — all in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Analyze My Resume
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="#features">
              <Button variant="outline" size="lg">See How It Works</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Everything You Need to Land Your Next Role</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            From parsing to interview prep — our AI analyzes every aspect of your professional profile.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to a better resume and targeted job search.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Resume', desc: 'Drag & drop your PDF or DOCX. Our parser extracts skills, experience, education, and more in seconds.' },
              { step: '02', title: 'Get AI Analysis', desc: 'Receive an ATS score (0-100), section breakdown, weak phrase detection, and AI-rewritten bullets.' },
              { step: '03', title: 'Apply Smarter', desc: 'See matched jobs with skill gaps, compare against any JD, and track applications in one dashboard.' },
            ].map((item) => (
              <div key={item.step} className="text-center p-6">
                <div className="text-4xl font-bold text-primary-600/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-primary-600 rounded-2xl p-12 sm:p-16">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Level Up Your Job Search?</h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've improved their resumes and landed interviews faster.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Free Analysis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>Built with React, FastAPI, and Anthropic Claude. Open source and production-ready.</p>
        </div>
      </footer>
    </div>
  )
}