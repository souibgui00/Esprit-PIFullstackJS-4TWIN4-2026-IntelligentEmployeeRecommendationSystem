"use client"

import { useState } from "react"
import { useAuth } from "../../lib/auth-context"
import { useNavigate } from "react-router-dom"
import { 
  BarChart3, 
  Users, 
  Brain, 
  Target, 
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Globe,
  Clock,
  Heart,
  LayoutDashboard,
  Search,
  Bell,
  ChevronRight
} from "lucide-react"

export default function LandingPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async (role) => {
    setIsLoading(true)
    const credentials = {
      admin: { email: "hr@skillmatch.com", password: "hr123" },
      manager: { email: "manager@skillmatch.com", password: "manager123" },
      employee: { email: "employee@skillmatch.com", password: "emp123" }
    }
    
    const result = await login(credentials[role].email, credentials[role].password)
    setIsLoading(false)
  }

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Recommendations",
      description: "Smart activity suggestions based on skills and career goals",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Target,
      title: "Skill Gap Analysis",
      description: "Identify and bridge skill gaps with personalized learning",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor development with comprehensive analytics",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Foster teamwork through collaborative activities",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: Award,
      title: "Achievement System",
      description: "Motivate with badges and recognition programs",
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Protect sensitive data with enterprise-grade security",
      color: "text-slate-600",
      bgColor: "bg-slate-50"
    }
  ]

  const stats = [
    { value: "95%", label: "Employee Satisfaction", icon: Heart },
    { value: "40%", label: "Skill Improvement", icon: TrendingUp },
    { value: "60%", label: "Time Saved", icon: Clock },
    { value: "100+", label: "Activities", icon: BookOpen }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp Inc.",
      content: "Transformed how we manage employee development. AI recommendations are spot-on!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Team Lead",
      company: "Innovation Labs",
      content: "Team skills have improved significantly since using the activity recommender.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Employee",
      company: "Global Solutions",
      content: "Love the personalized learning paths. It feels like the system knows my career goals.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">SkillMatch</h1>
                <p className="text-xs text-slate-500">Employee Development Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleDemoLogin("employee")}
                disabled={isLoading}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Demo
              </button>
              <button 
                onClick={() => handleDemoLogin("admin")}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                {isLoading ? "Loading..." : "Get Started"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-sm font-medium mb-6">
                <Zap className="w-3 h-3" />
                AI-Powered Development
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Transform Your
                <span className="text-slate-900"> Team's Skills</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
                Unlock your team's full potential with intelligent activity recommendations, 
                personalized learning paths, and comprehensive skill development tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => handleDemoLogin("admin")}
                  disabled={isLoading}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {isLoading ? "Loading..." : "Start Free Trial"}
                </button>
                <button 
                  onClick={() => handleDemoLogin("employee")}
                  disabled={isLoading}
                  className="px-6 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-semibold border border-slate-200 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  View Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-slate-100 rounded-2xl transform rotate-3"></div>
              <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">AI Analysis Complete</h3>
                      <p className="text-sm text-slate-600">5 new recommendations ready</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-emerald-600">+24%</div>
                      <div className="text-sm text-slate-600">Skill Growth</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">89%</div>
                      <div className="text-sm text-slate-600">Completion</div>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Team Progress</span>
                      <span className="text-sm text-slate-500">This Month</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-slate-900 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to manage, track, and enhance employee development
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 transition-all duration-200 h-full">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Trusted by Leading Companies
            </h2>
            <p className="text-xl text-slate-600">
              See what our customers have to say
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 ">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-slate-900 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Team?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of companies using AI-powered employee development
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleDemoLogin("admin")}
                disabled={isLoading}
                className="px-6 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                {isLoading ? "Loading..." : "Start Free Trial"}
              </button>
              <button 
                onClick={() => handleDemoLogin("employee")}
                disabled={isLoading}
                className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">SkillMatch</h3>
                  <p className="text-xs text-slate-400">Employee Development</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Empowering teams with intelligent activity recommendations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button className="hover:text-white transition-colors">Features</button></li>
                <li><button className="hover:text-white transition-colors">Pricing</button></li>
                <li><button className="hover:text-white transition-colors">Demo</button></li>
                <li><button className="hover:text-white transition-colors">API</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button className="hover:text-white transition-colors">About</button></li>
                <li><button className="hover:text-white transition-colors">Blog</button></li>
                <li><button className="hover:text-white transition-colors">Careers</button></li>
                <li><button className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button className="hover:text-white transition-colors">Help Center</button></li>
                <li><button className="hover:text-white transition-colors">Documentation</button></li>
                <li><button className="hover:text-white transition-colors">Community</button></li>
                <li><button className="hover:text-white transition-colors">Status</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 SkillMatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

