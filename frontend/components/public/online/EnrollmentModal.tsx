'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import { useLenis } from 'lenis/react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

/**
 * Enrollment modal. Implemented from the Figma popup frames (789 x 780).
 *
 * One dialog with two tabs, as the two exports show:
 *   Pay Online   — amount, currency, course, then a checkout button
 *   Already Paid — an enrollment enquiry form
 *
 * Measured: card inset 105 from the modal edge (579 inner), header bar 44
 * tall, primary button 60 tall, 1px #048ED6 border on the card.
 *
 * No card details are collected here and none should be: the checkout button
 * is the hand-off point to a payment provider, which is not yet connected.
 */

const COURSES = [
  'Advanced Arabic Grammar',
  'Tajweed Foundations',
  'Islamic History',
  'English for Academic Study',
  'Qur’anic Arabic',
  'Fiqh Essentials',
  'English (speaking, Writing, and Listening)',
  'Arabic — Classical and Modern',
  "Qur'an Memorization (Hifz)",
  'Islamic Studies',
];

const CURRENCIES = ['USD - US Dollar', 'EUR - Euro', 'GBP - British Pound', 'LRD - Liberian Dollar'];

type Tab = 'pay' | 'paid';

export function EnrollmentModal({
  open,
  onClose,
  initialTab = 'pay',
  selectedCourse = '',
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
  selectedCourse?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sent, setSent] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const lenis = useLenis();

  // Same scroll lock the mobile menu and the media lightbox use; Lenis owns
  // scrolling, so overflow:hidden alone would not hold, but we need both.
  useEffect(() => {
    if (open) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis?.start();
      document.body.style.overflow = '';
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [open, lenis]);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSent(false);
    }
  }, [open, initialTab]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return handleClose();
      if (e.key !== 'Tab') return;
      const root = closeRef.current?.closest('[role="dialog"]');
      if (!root) return;
      const items = [
        ...root.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute('disabled'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreTo.current?.focus?.();
    };
  }, [open, handleClose]);

  if (!open) return null;

  const field =
    'h-[clamp(2.75rem,3.1vw,3.375rem)] w-full rounded-lg border border-[#D6E9F6] bg-[#F7FBFE] px-4 text-[#121C2A] outline-none transition-colors placeholder:text-[#8A939C] focus-visible:border-[#048ED6] text-[clamp(0.8125rem,0.83vw,1rem)]';
  const selectField =
    `${field} custom-select truncate`;
  const label =
    'block font-semibold text-[#121C2A] text-[clamp(0.75rem,0.78vw,0.9375rem)]';

  return (
    <div data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Enrollment"
      onClick={handleClose}
      className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-black/50 p-[clamp(1rem,3vw,2.5rem)] backdrop-blur-sm"
    >
      <style>{`
        .custom-select {
          appearance: none;
          padding-right: 2.5rem !important;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23121C2A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
          background-repeat: no-repeat !important;
          background-position: right 15px center !important;
          background-size: 16px 16px !important;
        }
        .react-tel-input .form-control {
          width: 100% !important;
          height: clamp(2.75rem, 3.1vw, 3.375rem) !important;
          border-radius: 0.5rem !important;
          border: 1px solid #D6E9F6 !important;
          background-color: #F7FBFE !important;
          color: #121C2A !important;
          font-size: clamp(0.8125rem, 0.83vw, 1rem) !important;
          padding-left: 3rem !important;
          transition: border-color 0.2s !important;
          font-family: inherit !important;
        }
        .react-tel-input .form-control:focus {
          border-color: #048ED6 !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .react-tel-input .flag-dropdown {
          border: none !important;
          background: transparent !important;
          border-radius: 0.5rem 0 0 0.5rem !important;
        }
        .react-tel-input .flag-dropdown.open {
          background: transparent !important;
          border: none !important;
        }
        .react-tel-input .flag-dropdown:hover, 
        .react-tel-input .flag-dropdown:focus {
          background: transparent !important;
        }
        .react-tel-input .selected-flag {
          background: transparent !important;
          width: 48px !important;
          padding: 0 0 0 16px !important;
        }
        .react-tel-input .selected-flag:hover, 
        .react-tel-input .selected-flag:focus {
          background: transparent !important;
        }
        .react-tel-input .selected-flag .arrow {
          display: none !important; /* Hide the small arrow for a cleaner look */
        }
        .react-tel-input .country-list {
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid #D6E9F6 !important;
          margin-top: 4px !important;
          width: 260px !important;
          max-width: 85vw !important;
          font-family: inherit !important;
          color: #121C2A !important;
          background-color: white !important;
        }
        .react-tel-input .country-list .search {
          padding: 10px !important;
          background-color: white !important;
        }
        .react-tel-input .country-list .search-box {
          width: 100% !important;
          margin: 0 !important;
          border-radius: 0.375rem !important;
          border: 1px solid #D6E9F6 !important;
          padding: 0.5rem 0.75rem !important;
          background-color: #F7FBFE !important;
          font-size: 0.875rem !important;
          outline: none !important;
          transition: border-color 0.2s !important;
          color: #121C2A !important;
        }
        .react-tel-input .country-list .search-box::placeholder {
          color: #8A939C !important;
        }
        .react-tel-input .country-list .search-emoji,
        .react-tel-input .country-list .search-icon {
          display: none !important;
        }
        .react-tel-input .country-list .search-box:focus {
          border-color: #048ED6 !important;
        }
        .react-tel-input .country-list .country {
          padding: 0.5rem 1rem !important;
        }
        .react-tel-input .country-list .country-name {
          display: none !important;
        }
        .react-tel-input .country-list .dial-code {
          color: #121C2A !important;
          margin-left: 0.5rem !important;
        }
        .react-tel-input .country-list .country.highlight {
          background-color: #EAF5FD !important;
        }
        .react-tel-input .country-list .country:hover {
          background-color: #F7FBFE !important;
        }
        .react-tel-input .country-list .no-entries-message {
          color: #8A939C !important;
          padding: 0.5rem 1rem !important;
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[49.3125rem] rounded-xl bg-white p-[clamp(1.25rem,2vw,2.4rem)] shadow-2xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 cursor-pointer top-4 grid h-8 w-8 place-items-center rounded-full bg-[#048ED6] text-white transition-colors hover:bg-[#037ab8]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Tabs */}
        <div role="tablist" aria-label="Enrollment options" className="flex items-center justify-center gap-3">
          {([['pay', 'Pay Online'], ['paid', 'Already Paid']] as const).map(([id, text]) => {
            const on = tab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setTab(id)}
                className={`h-[clamp(2.25rem,2.3vw,2.75rem)] cursor-pointer rounded-full border px-[clamp(1rem,1.35vw,1.625rem)] font-semibold transition-colors text-[clamp(0.75rem,0.78vw,0.9375rem)] ${
                  on
                    ? 'border-[#048ED6] bg-[#048ED6] text-white'
                    : 'border-[#048ED6] bg-white text-[#048ED6] hover:bg-[#EAF5FD]'
                }`}
              >
                {text}
              </button>
            );
          })}
        </div>

        {/* 579 inner width, 1px brand border in the design */}
        <div className="mx-auto mt-[clamp(1.25rem,2vw,2.4rem)] max-w-[36.1875rem] rounded-xl border border-[#048ED6] p-[clamp(1rem,1.66vw,2rem)]">
          {tab === 'pay' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Integration point: hand off to the payment provider here.
                // Nothing is charged and no confirmation is shown, because
                // claiming a completed payment would be a lie.
              }}
            >
              <p className="grid h-[clamp(2.5rem,2.3vw,2.75rem)] place-items-center rounded-lg bg-[#048ED6] font-semibold text-white text-[1rem]">
                Pay Online
              </p>

              <div className="mt-[clamp(1rem,1.66vw,2rem)] grid grid-cols-1 gap-[clamp(1rem,1.5vw,1.75rem)] sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="enr-name" className={label}>Full Name</label>
                  <input id="enr-name" name="name" required placeholder="e.g. John Doe" className={`${field} mt-2`} />
                </div>
                
                <div>
                  <label htmlFor="enr-email" className={label}>Email Address</label>
                  <input id="enr-email" name="email" type="email" required placeholder="e.g. john@example.com" className={`${field} mt-2`} />
                </div>

                <div>
                  <label htmlFor="enr-phone" className={label}>Phone Number</label>
                  <PhoneInput
                    country={'lr'}
                    enableSearch={true}
                    value={phoneValue}
                    onChange={setPhoneValue}
                    inputProps={{
                      name: 'phone',
                      id: 'enr-phone'
                    }}
                    containerClass="w-full mt-2"
                  />
                </div>
              </div>

              <div className="mt-[clamp(1rem,1.66vw,2rem)]">
                <label htmlFor="enr-course" className={label}>Course Selection</label>
                <select id="enr-course" name="course" className={`${selectField} mt-2`} defaultValue={selectedCourse || COURSES[0]}>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="mt-[clamp(1rem,1.66vw,2rem)] grid grid-cols-2 gap-[clamp(0.75rem,1.04vw,1.25rem)]">
                <div>
                  <label htmlFor="enr-amount" className={label}>Amount</label>
                  <input
                    id="enr-amount"
                    name="amount"
                    defaultValue="$500"
                    inputMode="decimal"
                    className={`${field} mt-2`}
                  />
                </div>
                <div>
                  <label htmlFor="enr-currency" className={label}>Currency</label>
                  <select id="enr-currency" name="currency" className={`${selectField} mt-2`}>
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-[clamp(1.25rem,2vw,2.4rem)] cursor-pointer flex h-[clamp(2.75rem,3.1vw,3.75rem)] w-full items-center justify-center gap-2 rounded-lg bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.875rem,0.94vw,1.125rem)]"
              >
                <CreditCard className="h-4 w-4" />
                Pay Securely Now
              </button>

              {/* The design's caption reads "safe, secure and tax-deductible".
                  Tax-deductibility is a claim about the payer's jurisdiction
                  and is not true of a course fee, so it is not repeated here. */}
              <p className="mt-3 text-center text-[#8A939C] text-[1rem]">
                Your payment is processed securely.
              </p>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <h2 className="font-serif text-[#121C2A] text-[clamp(1.5rem,2.08vw,2.5rem)]">Enroll Now</h2>

              {sent ? (
                <p role="status" className="mt-6 rounded-lg bg-[#EAF5FD] px-4 py-3 text-[#036CA3] text-[1rem]">
                  Thanks — we have your details and will be in touch shortly.
                </p>
              ) : (
                <>
                  <div className="mt-[clamp(1rem,1.66vw,2rem)] grid grid-cols-1 gap-[clamp(0.75rem,1.04vw,1.25rem)] sm:grid-cols-2">
                    <input name="name" required placeholder="Full Name" aria-label="Full name" className={field} />
                    <input name="email" type="email" required placeholder="Email Address" aria-label="Email address" className={field} />
                    <div className="sm:col-span-2 md:col-span-1">
                      <PhoneInput
                        country={'lr'}
                        enableSearch={true}
                        value={phoneValue}
                        onChange={setPhoneValue}
                        inputProps={{
                          name: 'phone',
                          'aria-label': 'Phone'
                        }}
                        containerClass="w-full"
                      />
                    </div>
                    <input name="country" placeholder="Country" aria-label="Country" className={field} />
                  </div>

                  <input name="topic" placeholder="Inquiry Topic" aria-label="Inquiry topic" className={`${field} mt-[clamp(0.75rem,1.04vw,1.25rem)]`} />

                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Your Message"
                    aria-label="Your message"
                    className="mt-[clamp(0.75rem,1.04vw,1.25rem)] w-full rounded-lg border border-[#D6E9F6] bg-[#F7FBFE] p-4 text-[#121C2A] outline-none transition-colors placeholder:text-[#8A939C] focus-visible:border-[#048ED6] text-[clamp(0.8125rem,0.83vw,1rem)]"
                  />

                  <button
                    type="submit"
                    className="mt-[clamp(1rem,1.66vw,2rem)] cursor-pointer h-[clamp(2.75rem,3.1vw,3.75rem)] w-full rounded-lg bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.875rem,0.94vw,1.125rem)]"
                  >
                    Send Message
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
