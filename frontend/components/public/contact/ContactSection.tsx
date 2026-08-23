'use client';

import React, { useId, useState } from 'react';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';

/**
 * Contact — enquiry form and the Campus Information panel.
 * Implemented from Figma node 384-1202 (contact page frame, 1920×2542).
 *
 * Design reference values (measured off the 1920 export):
 *   content block x384→1535 (1152, the same centred block the About cards use)
 *   form card 657 wide · 29 gutter · blue panel 466 wide, both from y493
 *   inputs 264 wide in the two-up rows, fill #EFF4FF · card padding 52
 *   map 1152×500 at y1165
 */

const SUBJECTS = [
  'Admissions Inquiry',
  'Academic Programs',
  'Fees and Payments',
  'Careers',
  'General Enquiry',
];

const CAMPUS = [
  {
    Icon: MapPin,
    label: 'Main Campus',
    lines: ['123 Wisdom Avenue', 'Educational District, ED 45678', 'Monrovia, Liberia'],
    url: 'https://www.google.com/maps/search/Monrovia+Liberia',
  },
  { Icon: Phone, label: 'Administration', lines: ['+971 4 123 4567'], url: 'tel:+97141234567' },
  { Icon: null, label: 'WhatsApps Us', lines: ['+971 4 123 4567'], whatsapp: true, url: 'https://wa.me/97141234567' },
  { Icon: Mail, label: 'Admissions Desk', lines: ['admissions@yahaya.edu'], url: 'mailto:admissions@yahaya.edu' },
  {
    Icon: Clock,
    label: 'Office Hours',
    lines: ['Monday - Friday: 8:00 AM - 4:00 PM', 'Friday Prayer Break: 12:00 PM - 2:00 PM'],
    url: '#',
  },
] as const;

const FIELD =
  'w-full h-[52px] rounded-lg bg-[#EFF4FF] px-4 text-[#121C2A] placeholder:text-[#9AA3AE] ' +
  'outline-none transition-shadow focus:ring-2 focus:ring-[#048ED6]/40 text-[clamp(0.8125rem,0.78vw,0.9375rem)]';
const LABEL = 'block mb-2 text-[#3F4941] text-[clamp(1rem,0.68vw,1.1rem)]';

export function ContactSection() {
  const id = useId();
  const [accepted, setAccepted] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(1.3rem,4.2vw,5rem)]">
        <div className="max-w-[1152px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,657fr)_minmax(0,466fr)] gap-[29px] items-stretch">

          {/* Enquiry form */}
          <div className="rounded-xl bg-white border border-black/[0.06] shadow-[0_2px_14px_rgba(16,24,40,0.06)] p-[clamp(1.5rem,2.7vw,3.25rem)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // NOT WIRED: there is no endpoint for this yet. Submitting only
                // flips local state — no message is sent anywhere. Point this at
                // the real handler (Strapi, a route handler, or a form service)
                // before the page goes live, or the form silently loses enquiries.
                setSent(true);
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[31px] gap-y-5">
                <div>
                  <label className={LABEL} htmlFor={`${id}-first`}>First Name</label>
                  <input id={`${id}-first`} name="firstName" className={FIELD} placeholder="Musa" required />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`${id}-last`}>Last Name</label>
                  <input id={`${id}-last`} name="lastName" className={FIELD} placeholder="Kamara" required />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`${id}-email`}>Email Address</label>
                  <input id={`${id}-email`} name="email" type="email" className={FIELD} placeholder="musakamara@gmail.com" required />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`${id}-phone`}>Phone Number</label>
                  <input id={`${id}-phone`} name="phone" type="tel" className={FIELD} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div className="mt-5">
                <label className={LABEL} htmlFor={`${id}-subject`}>Subject Area</label>
                <select id={`${id}-subject`} name="subject" className={`${FIELD} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239AA3AE%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_1rem_center] bg-[length:18px_18px] pr-12`}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="mt-5">
                <label className={LABEL} htmlFor={`${id}-message`}>Your Message</label>
                <textarea
                  id={`${id}-message`}
                  name="message"
                  rows={5}
                  className={`${FIELD} h-auto py-3 resize-y`}
                  placeholder="How can we assist you today?"
                  required
                />
              </div>

              <div className="mt-[clamp(1.25rem,1.9vw,2.25rem)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <label className="flex items-start gap-3 cursor-pointer max-w-[280px]">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-[3px] w-4 h-4 shrink-0 accent-[#048ED6]"
                    required
                  />
                  <span className="leading-[1.5] text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                    <span className="font-semibold text-[#121C2A]">Read the legal terms and service,</span>{' '}
                    <span className="text-[#7A828C]">I have accept it</span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!accepted}
                  className="inline-flex items-center justify-center gap-3 h-[52px] px-7 shrink-0 rounded-full bg-[#048ED6] text-white font-medium transition-colors hover:bg-[#037ab8] disabled:opacity-40 disabled:hover:bg-[#048ED6] disabled:cursor-not-allowed text-[clamp(0.8125rem,0.78vw,0.9375rem)]"
                >
                  Send Message
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {sent && (
                <p role="status" className="mt-4 text-[#048ED6] text-[1rem]">
                  Thank you — we&apos;ll be in touch shortly.
                </p>
              )}
            </form>
          </div>

          {/* Campus information */}
          <div className="relative overflow-hidden rounded-xl bg-[#048ED6] text-white p-[clamp(1.5rem,2.3vw,2.75rem)]">
            {/* folded corner, top-right */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-6 -right-6 w-[150px] h-[150px] rotate-45 bg-white/[0.07]"
            />

            <h2 className="relative font-serif leading-tight text-[clamp(1.5rem,1.77vw,2.125rem)]">
              Campus Information
            </h2>

            <ul className="relative mt-[clamp(1.5rem,2.1vw,2.5rem)] flex flex-col gap-[clamp(1.25rem,1.7vw,2rem)]">
              {CAMPUS.map((item) => (
                <li key={item.label} className="w-full relative">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <div className="flex gap-4">
                      <span className="mt-[2px] shrink-0">
                        {'whatsapp' in item && item.whatsapp ? (
                          <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-[#25D366]" aria-hidden>
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                          </svg>
                        ) : (
                          item.Icon && <item.Icon className="w-[19px] h-[19px] text-white/90" />
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="font-semibold text-[1rem]">{item.label}</p>
                        {item.lines.map((l) => (
                          <p key={l} className="text-white/85 leading-[1.55] text-[1rem]">
                            {l}
                          </p>
                        ))}
                      </div>
                    </div>
                  </a>
                </li>

              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactMap() {
  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) pb-[clamp(2rem,4.2vw,5rem)]">
        {/*
          The design shows a map of Monrovia. No map asset exists in the repo, so
          this is an OpenStreetMap embed — keyless and no third-party tracking,
          unlike a Google Maps embed. The bbox is central Monrovia, NOT the real
          campus: the address in the design ("123 Wisdom Avenue") is placeholder,
          so re-centre this once the actual coordinates are known.
        */}
        <div className="max-w-[1152px] mx-auto aspect-[1152/500] overflow-hidden rounded-xl border border-black/[0.06]">
          <iframe
            title="Yahaya International campus location"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-10.85%2C6.24%2C-10.66%2C6.36&layer=mapnik"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
