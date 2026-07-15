'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Building2, HelpCircle } from 'lucide-react';
import { cmsService } from '@/services/cms.service';

interface ContactPageProps {
  params?: Promise<{ locale?: string }>;
}

export default function ContactUsPage({ params }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('General Admissions Inquiry');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setLoading(true);
    setErrorMsg('');

    const res = await cmsService.submitContactForm({
      name,
      email,
      phone,
      subject,
      department,
      message,
    });

    setLoading(false);
    if (res.success) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } else {
      setErrorMsg(res.message || 'Failed to submit form. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            We Are Here to Help
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Contact Us & Inquiries
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            Have questions regarding admissions, tuition fees, boarding facilities, or our Cambridge/Tahfidz dual track? Reach out to our administrative team.
          </p>
        </div>
      </section>

      {/* Contact Grid Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Contact Details & Office Hours */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 space-y-6">
              <h3 className="text-2xl font-bold text-emerald-950 pb-4 border-b border-emerald-200/60">
                School Contact Directory
              </h3>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-900 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 block">Main Campus Address</strong>
                    <span>Plot 18, Education District, Islamic Knowledge Avenue, West Africa</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-900 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 block">Direct Telephone / WhatsApp</strong>
                    <span>+234 (0) 800-YAHAYA-S (800-9242-927)</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Mon - Fri, 8:00 AM - 4:00 PM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-900 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 block">Admissions & General Email</strong>
                    <span>admissions@yahayaschool.edu</span>
                    <span>info@yahayaschool.edu</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 block">Administrative Office Hours</strong>
                    <span>Monday – Thursday: 8:00 AM – 4:30 PM</span>
                    <span>Friday: 8:00 AM – 1:00 PM (Juma\'ah Break)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200/80">
              <h4 className="text-lg font-bold text-emerald-950 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span>Quick Admissions Help</span>
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                If you are ready to apply for the 2026/2027 session, you do not need to wait for an email reply. You can start directly online.
              </p>
              <Link
                href="/online-registration"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900 hover:text-amber-600 transition-colors"
              >
                <span>Go to Online Registration Portal</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Contact Form Submission */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-md">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mb-3">
                Send Us a Message
              </h3>
              <p className="text-gray-600 text-sm mb-8">
                Fill out the form below and our admissions registrar or relevant head of department will respond within 24 business hours.
              </p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4 animate-in fade-in">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                  <h4 className="text-2xl font-bold text-emerald-950">Inquiry Received!</h4>
                  <p className="text-gray-600 text-sm max-w-md mx-auto">
                    Alhamdulillah! Your message has been routed to the appropriate department. A member of our staff will get in touch with you shortly via email or phone.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Abdullah Sulaiman"
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. abdullah@gmail.com"
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 ..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                        Department / Inquiry Type
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                      >
                        <option value="General Admissions Inquiry">General Admissions Inquiry</option>
                        <option value="Tahfidz Al-Qur'an Track">Tahfidz Al-Qur\'an Track</option>
                        <option value="Tuition & Bursary Fees">Tuition & Bursary Fees</option>
                        <option value="Hostel Boarding Facilities">Hostel Boarding Facilities</option>
                        <option value="Waqf & Sadaqah Jariyah">Waqf & Sadaqah Jariyah Fund</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Summary of your inquiry..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                      Message / Question *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please provide details of your question or the student grade level you are inquiring about..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-emerald-900 hover:bg-emerald-800 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? 'Submitting Message...' : 'Send Message to School Administration'}</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
