'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [email, setEmail] = useState('');

  const { login } = useAuth();
  const router = useRouter();


  const handleDashboardRedirect = () => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      window.location.href = '/login';
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const role = user?.role?.toLowerCase();

      if (role === 'candidate') {
        window.location.href = '/candidate/dashboard';
      } else if (role === 'coach') {
        window.location.href = '/coach/dashboard';
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      window.location.href = '/login';
    }
  };

  const features = [
    {
      icon: '👥',
      title: 'Expert Mentors',
      description: 'Connect with industry experts and experienced professionals ready to guide your career journey.',
    },
    {
      icon: '📚',
      title: 'Comprehensive Resources',
      description: 'Access curated learning materials, courses, and development tools tailored to your growth.',
    },
    {
      icon: '🎯',
      title: 'Personalized Growth Plans',
      description: 'Get customized roadmaps based on your goals and current skill level.',
    },
    {
      icon: '🌐',
      title: 'Global Community',
      description: 'Join a vibrant community of learners and professionals from around the world.',
    },
  ];

  const menteeTestimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      text: 'The mentorship program transformed my career. My mentor helped me navigate complex technical decisions and advance to a senior role within 18 months.',
      avatar: '👩‍💼',
    },
    {
      name: 'James Rodriguez',
      role: 'Product Manager',
      text: 'Amazing experience! I gained practical insights and built genuine professional relationships that opened new career opportunities.',
      avatar: '👨‍💼',
    },
    {
      name: 'Aisha Patel',
      role: 'UX Designer',
      text: 'The structured approach to mentorship really helped me focus on my goals. Highly recommend to anyone looking to level up.',
      avatar: '👩‍🎨',
    },
  ];

  const mentorTestimonials = [
    {
      name: 'Dr. Michael Thompson',
      role: 'Senior Director, Tech',
      text: 'Mentoring through this platform is rewarding. I love seeing my mentees grow and succeed. The platform makes the whole process seamless.',
      avatar: '👨‍🔬',
    },
    {
      name: 'Emma Wilson',
      role: 'Executive Coach',
      text: 'Great way to give back to the community. The matching algorithm is excellent - my mentees are always well-aligned with my expertise.',
      avatar: '👩‍💼',
    },
  ];

  const howitWorks = [
    {
      step: 1,
      title: 'Create Your Profile',
      description: 'Sign up and build a detailed profile highlighting your skills, goals, and interests.',
      icon: '📝',
    },
    {
      step: 2,
      title: 'Get Matched',
      description: 'Our AI algorithm pairs you with the perfect mentor or mentee based on compatibility.',
      icon: '🤝',
    },
    {
      step: 3,
      title: 'Start Learning',
      description: 'Begin regular sessions, access resources, and work on your personalized growth plan.',
      icon: '📖',
    },
    {
      step: 4,
      title: 'Achieve Your Goals',
      description: 'Track progress, celebrate milestones, and achieve your professional development goals.',
      icon: '🏆',
    },
  ];

  const faqs = [
    {
      question: 'How is mentee-mentor matching done?',
      answer: 'Our advanced AI algorithm analyzes profiles, goals, expertise, and availability to create optimal matches based on compatibility and mutual interests.',
    },
    {
      question: 'What is the time commitment required?',
      answer: 'Most mentorships involve 1-2 hours per week of direct mentoring. You can adjust this based on your schedule and mutual agreement.',
    },
    {
      question: 'Can I switch mentors if the match isn\'t working?',
      answer: 'Yes, absolutely. We understand that sometimes matches don\'t work out. You can request a new mentor after the first month.',
    },
    {
      question: 'Is there a cost to join the platform?',
      answer: 'The platform is free for mentees. Mentors can choose from free or premium membership options with additional benefits.',
    },
    {
      question: 'How long does a typical mentorship last?',
      answer: 'Mentorships typically last 3-12 months, but you can extend or conclude based on your needs and goals.',
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'We offer 24/7 customer support, regular training sessions, resources library, and a community forum for all members.',
    },
  ];

  const successStories = [
    {
      metric: '50K+',
      description: 'Active Members',
    },
    {
      metric: '15K+',
      description: 'Successful Matches',
    },
    {
      metric: '98%',
      description: 'Satisfaction Rate',
    },
    {
      metric: '$2.5M',
      description: 'Combined Salary Growth',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-600 via-blue-500 to-purple-600 text-white py-16 md:py-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Transform Your Career with Expert Mentorship
          </h1>
          <p className="text-lg md:text-xl mb-12 text-blue-100 max-w-2xl mx-auto">
            Connect with industry leaders, accelerate your growth, and unlock new opportunities in your professional journey.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 border-white"
              onClick={() => router.push('/login')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* About the Program */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About Our Program</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We believe everyone deserves access to quality mentorship. Our platform connects ambitious professionals with experienced mentors to foster meaningful growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} hoverable className="h-full">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Mentees Section */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">For Mentees</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Accelerate your professional growth with personalized guidance from experienced industry leaders.
          </p>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">✅</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personalized Career Guidance</h3>
                    <p className="text-gray-600 text-sm">Get advice tailored to your specific career goals and challenges.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">✅</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Skill Development</h3>
                    <p className="text-gray-600 text-sm">Learn new skills and best practices from industry experts.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">✅</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Network Expansion</h3>
                    <p className="text-gray-600 text-sm">Build meaningful connections in your industry.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">✅</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Career Acceleration</h3>
                    <p className="text-gray-600 text-sm">Advance faster with insider knowledge and opportunities.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-blue-200">
              <div className="text-center">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Success Testimonial</h3>
                <p className="text-gray-700 mb-6 italic">
                  &quot;My mentor helped me navigate a career transition smoothly. In just 6 months, I landed a role I thought was years away. This platform is invaluable!&quot;
                </p>
                <p className="font-semibold text-gray-900">{menteeTestimonials[0].name}</p>
                <p className="text-gray-600 text-sm">{menteeTestimonials[0].role}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {menteeTestimonials.map((testimonial, idx) => (
              <Card key={idx} hoverable>
                <div className="text-4xl mb-4 text-center">{testimonial.avatar}</div>
                <p className="text-gray-700 mb-4 italic">&quot;{testimonial.text}&quot;</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Mentors Section */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">For Mentors</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Share your expertise, build your legacy, and make a real impact on the next generation of professionals.
          </p>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div className="bg-linear-to-br from-purple-50 to-blue-50 rounded-lg p-8 border-2 border-purple-200">
              <div className="text-center">
                <div className="text-5xl mb-4">💼</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Mentor Impact</h3>
                <p className="text-gray-700 mb-6 italic">
                  &quot;Being a mentor has been incredibly rewarding. Watching my mentees grow and succeed is the best ROI on my time. Highly fulfilling!&quot;
                </p>
                <p className="font-semibold text-gray-900">{mentorTestimonials[0].name}</p>
                <p className="text-gray-600 text-sm">{mentorTestimonials[0].role}</p>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">⭐</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Give Back</h3>
                    <p className="text-gray-600 text-sm">Share your knowledge and help others achieve their goals.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">⭐</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Build Your Network</h3>
                    <p className="text-gray-600 text-sm">Connect with ambitious professionals eager to learn from you.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">⭐</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Enhance Your Reputation</h3>
                    <p className="text-gray-600 text-sm">Build your personal brand as a thought leader.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-2xl shrink-0">⭐</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Flexible Engagement</h3>
                    <p className="text-gray-600 text-sm">Mentor on your terms with flexible scheduling.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {mentorTestimonials.map((testimonial, idx) => (
              <Card key={idx} hoverable>
                <div className="text-4xl mb-4 text-center">{testimonial.avatar}</div>
                <p className="text-gray-700 mb-4 italic">&quot;{testimonial.text}&quot;</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">How It Works</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our proven 4-step process gets you matched and growing in no time.
          </p>

          <div className="grid md:grid-cols-4 gap-6 md:gap-4">
            {howitWorks.map((item, idx) => (
              <div key={idx} className="relative">
                <Card>
                  <div className="text-5xl mb-4 text-center">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Step {item.step}</h3>
                  <h4 className="text-base font-semibold text-blue-600 mb-2 text-center">{item.title}</h4>
                  <p className="text-sm text-gray-600 text-center">{item.description}</p>
                </Card>
                {idx < howitWorks.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 text-blue-600 text-2xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories / Stats */}
      <section className="py-16 md:py-24 px-4 bg-linear-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Our Impact</h2>
          <p className="text-lg text-blue-100 text-center mb-12 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their careers through our mentorship platform.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {successStories.map((story, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{story.metric}</div>
                <p className="text-blue-100">{story.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            Have questions? We have answers. Find out more about our mentorship program.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
                >
                  <span>{faq.question}</span>
                  <span
                    className={`text-2xl transition-transform ${
                      activeAccordion === idx ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {activeAccordion === idx && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-lg text-gray-600 mb-8">
            Subscribe to our newsletter for mentorship tips, success stories, and exclusive opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                console.log('Subscribe:', email);
                setEmail('');
              }}
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Coach</h3>
              <p className="text-sm mb-4">
                Connecting ambitious professionals with industry experts to transform careers and unlock potential.
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors" title="Facebook">f</a>
                <a href="#" className="hover:text-white transition-colors" title="Twitter">𝕏</a>
                <a href="#" className="hover:text-white transition-colors" title="LinkedIn">in</a>
                <a href="#" className="hover:text-white transition-colors" title="Instagram">📷</a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Mentees</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Mentors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 support@coach-platform.com</li>
                <li>📞 +1 (555) 123-4567</li>
                <li>📍 San Francisco, CA 94105</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Coach Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

