'use client';

import React, { useState } from 'react';

/**
 * Newsletter sign-up.
 *
 * There is no endpoint behind this yet — submitting only flips local state,
 * exactly as the contact and career forms do. Wire all three to the same
 * handler when one exists.
 */
export function NewsletterCard() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="rounded-xl border border-[#D6E9F6] bg-white p-[clamp(1.25rem,1.6vw,1.9rem)]">
      <h3 className="font-serif text-[#121C2A] text-[clamp(1rem,1.15vw,1.375rem)]">Stay Updated</h3>
      <p className="mt-2 leading-[1.6] text-[#5A636D] text-[1rem]">
        Get the latest school news and event reminders straight to your inbox.
      </p>

      {sent ? (
        <p
          role="status"
          className="mt-4 rounded-lg bg-[#EAF5FD] px-4 py-3 text-[#036CA3] text-[1rem]"
        >
          Thanks — we&apos;ll be in touch at {email}.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="mt-4"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="h-[clamp(2.5rem,2.4vw,2.875rem)] w-full rounded-full border border-[#D6E9F6] px-4 text-[#121C2A] outline-none transition-colors placeholder:text-[#9AA3AD] focus-visible:border-[#048ED6] text-[clamp(0.75rem,0.73vw,0.875rem)]"
          />
          <button
            type="submit"
            className="mt-3 h-[clamp(2.5rem,2.4vw,2.875rem)] w-full rounded-full bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.75rem,0.73vw,0.875rem)]"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
