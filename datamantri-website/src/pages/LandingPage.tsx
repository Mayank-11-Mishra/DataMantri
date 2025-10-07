import { ArrowRight, Database, Zap, Shield, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Logo from '../components/Logo';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ScrollProgress from '../components/ScrollProgress';
import SimpleVideoDemo from '../components/SimpleVideoDemo';

export default function LandingPage() {
  const { theme } = useTheme();

  const handleLogin = () => {
    window.location.href = 'http://localhost:8082';
  };

  const handleGetStarted = () => {
    window.location.href = 'http://localhost:8082';
  };

  return (
    <div className="min-h-screen bg-white">
      <ScrollProgress />
      <ThemeSwitcher />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition font-medium">Features</a>
              <a href="#demo" className="text-gray-600 hover:text-gray-900 transition font-medium">Demo</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition font-medium">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition font-medium">Contact</a>
              <button 
                onClick={handleLogin}
                className={`px-6 py-2 bg-gradient-to-r ${theme.gradient} text-white rounded-lg hover:shadow-lg transition font-semibold`}
              >
                Login
              </button>
            </nav>          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-blue-600">Your Data, Unified</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 animate-slide-up">
            The Ultimate
            <span className="gradient-text block mt-2">Data Management Platform</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-slide-up">
            Connect all your data sources, build stunning dashboards, and automate workflows—all in one place.
          </p>
          
          <div className="flex items-center justify-center gap-4 animate-slide-up">
            <button
              onClick={handleGetStarted}
              className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-semibold hover:shadow-2xl transition text-lg flex items-center gap-2`}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogin}
              className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition text-lg"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50 px-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float delay-1000"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <span className={`block mt-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                Manage Your Data
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From connecting data sources to building dashboards—all in one unified platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Database className="w-8 h-8" />,
                title: "Unified Data Sources",
                description: "Connect PostgreSQL, MySQL, MongoDB, BigQuery, and more—all in one platform",
                color: "from-blue-500 to-blue-600",
                stats: "50+ Integrations"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI-Powered Dashboards",
                description: "Generate beautiful dashboards with natural language prompts in seconds",
                color: "from-purple-500 to-purple-600",
                stats: "10x Faster"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Real-Time Analytics",
                description: "Get instant insights with live data visualization and automated reporting",
                color: "from-pink-500 to-pink-600",
                stats: "Live Updates"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Enterprise Security",
                description: "Bank-grade encryption, SSO, and role-based access control built-in",
                color: "from-green-500 to-green-600",
                stats: "SOC 2 Certified"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Team Collaboration",
                description: "Share dashboards, reports, and insights with your team effortlessly",
                color: "from-orange-500 to-orange-600",
                stats: "Unlimited Users"
              },
              {
                icon: <CheckCircle2 className="w-8 h-8" />,
                title: "Data Pipelines",
                description: "Automate ETL workflows with our powerful Airflow-style orchestration",
                color: "from-indigo-500 to-indigo-600",
                stats: "No-Code Setup"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer border-2 border-transparent hover:border-blue-200"
              >
                {/* Badge */}
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
                  {feature.stats}
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                {/* Hover decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-xl"></div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid md:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Active Users" },
              { number: "1M+", label: "Pipelines Run" },
              { number: "99.9%", label: "Uptime" },
              { number: "50+", label: "Integrations" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent mb-2`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <SimpleVideoDemo />

      {/* About Section */}
      <section id="about" className="py-20 bg-white px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>DataMantri</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to democratize data intelligence and make powerful analytics accessible to everyone
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h3>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2024, DataMantri was built by data engineers who were frustrated with the complexity 
                  of existing data tools. We believed there had to be a better way.
                </p>
                <p>
                  Today, DataMantri serves thousands of companies worldwide, from startups to enterprises, 
                  helping them connect, analyze, and act on their data in real-time.
                </p>
                <p>
                  Our platform combines the power of modern data engineering with the simplicity of no-code tools, 
                  making data intelligence accessible to everyone—from analysts to executives.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { number: '10K+', label: 'Active Users', color: 'from-blue-500 to-blue-600' },
                { number: '500M+', label: 'Queries/Month', color: 'from-purple-500 to-purple-600' },
                { number: '99.9%', label: 'Uptime', color: 'from-green-500 to-green-600' },
                { number: '50+', label: 'Integrations', color: 'from-orange-500 to-orange-600' }
              ].map((stat, index) => (
                <div key={index} className={`p-6 rounded-2xl bg-gradient-to-br ${stat.color} text-white text-center`}>
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-sm opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get In <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>Touch</span>
            </h2>
            <p className="text-xl text-gray-600">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    placeholder="john@company.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="Company Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea 
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                  placeholder="Tell us about your project..."
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className={`w-full py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-bold text-lg hover:shadow-2xl transition`}
              >
                Send Message
              </button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-gray-600 text-sm mb-1">Email</div>
                  <a href="mailto:hello@datamantri.com" className="text-blue-600 font-semibold hover:underline">
                    hello@datamantri.com
                  </a>
                </div>
                <div>
                  <div className="text-gray-600 text-sm mb-1">Phone</div>
                  <a href="tel:+15551234567" className="text-blue-600 font-semibold hover:underline">
                    +1 (555) 123-4567
                  </a>
                </div>
                <div>
                  <div className="text-gray-600 text-sm mb-1">Address</div>
                  <div className="text-gray-700 font-semibold">
                    San Francisco, CA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 bg-gradient-to-r ${theme.gradient} px-6`}>
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Data?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies using DataMantri to make better decisions
          </p>
          <button
            onClick={handleGetStarted}
            className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl transition"
          >
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`w-10 h-10 bg-gradient-to-br ${theme.gradient} rounded-lg flex items-center justify-center`}>
              <span className="text-xl font-bold">DM</span>
            </div>
            <span className="text-2xl font-bold">DataMantri</span>
          </div>
          <p className="text-gray-400 mb-8">Your complete data management solution</p>
          <div className="flex items-center justify-center gap-8 mb-8">
            <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
            <a href="#demo" className="text-gray-400 hover:text-white transition">Demo</a>
            <a href="#about" className="text-gray-400 hover:text-white transition">About</a>
            <a href="#contact" className="text-gray-400 hover:text-white transition">Contact</a>
            <button onClick={handleLogin} className="text-gray-400 hover:text-white transition">Login</button>
          </div>
          <p className="text-gray-500 text-sm">© 2024 DataMantri. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

