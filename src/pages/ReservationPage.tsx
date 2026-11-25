import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Reservation } from '../types';

const TIME_SLOTS = [
  '08:00',
  '09:30',
  '11:00',
  '12:30',
  '14:00',
  '16:00',
  '18:00',
  '19:30',
  '21:00',
];

const SEATING_AREAS: Reservation['seatingArea'][] = [
  'Main Roastery Lounge',
  'Golden Courtyard',
  'Espresso Bar Counter',
];

export function ReservationPage() {
  const { user, apiFetch, notify } = useStore();
  const todayDefault = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(todayDefault);
  const [time, setTime] = useState('19:30');
  const [guests, setGuests] = useState(2);
  const [seatingArea, setSeatingArea] = useState<Reservation['seatingArea']>('Golden Courtyard');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ reservation: Reservation }>('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          date,
          time,
          guests,
          seatingArea,
          customerName,
          customerPhone,
          customerEmail,
          specialRequests,
        }),
      });
      setConfirmed(res.reservation);
      notify(`Table reserved! Reference ${res.reservation.bookingCode}`, 'success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="max-w-2xl space-y-2 border-b border-[#1A120E]/10 pb-6">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
          Table Reservations
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1A120E]">
          Reserve Your Table at CAFEE
        </h1>
        <p className="text-sm sm:text-base text-[#5C493E]">
          Select your preferred date, seating ambiance, and party size for coffee tastings, brunch, or evening dining.
        </p>
      </div>

      {confirmed ? (
        <div className="bg-[#1A120E] text-[#FAF7F2] rounded-2xl p-8 sm:p-10 max-w-2xl space-y-6">
          <div className="flex items-center gap-2.5 text-[#D4A853] text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" />
            <span>Reservation Confirmed</span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-[#C4B7AA]">Booking Reference</p>
            <div className="font-mono text-3xl font-semibold text-[#D4A853] mt-1">
              {confirmed.bookingCode}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-white/12 text-sm">
            <div>
              <span className="text-xs text-[#C4B7AA] block">Guest</span>
              <span className="font-medium">{confirmed.customerName}</span>
            </div>
            <div>
              <span className="text-xs text-[#C4B7AA] block">Date</span>
              <span className="font-mono tabular-nums">{confirmed.date}</span>
            </div>
            <div>
              <span className="text-xs text-[#C4B7AA] block">Time</span>
              <span className="font-mono tabular-nums">{confirmed.time}</span>
            </div>
            <div>
              <span className="text-xs text-[#C4B7AA] block">Party Size</span>
              <span className="font-mono tabular-nums">{confirmed.guests} Guests</span>
            </div>
          </div>

          <p className="text-xs text-[#C4B7AA]">
            Seating Area: <span className="text-[#FAF7F2] font-medium">{confirmed.seatingArea}</span> · 485 Hayes Street, San Francisco.
          </p>

          <button
            type="button"
            onClick={() => setConfirmed(null)}
            className="px-5 py-2.5 rounded-lg bg-[#C6934B] text-[#120D0A] text-xs font-semibold hover:bg-[#D4A853] cursor-pointer"
          >
            Make Another Reservation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-8 bg-white rounded-xl border border-[#1A120E]/10 p-6 sm:p-8 space-y-6"
          >
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="res-date" className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8C5F23]" />
                    <span>Date</span>
                  </span>
                </label>
                <input
                  id="res-date"
                  required
                  type="date"
                  min={todayDefault}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>

              <div>
                <label htmlFor="res-guests" className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#8C5F23]" />
                    <span>Guests</span>
                  </span>
                </label>
                <select
                  id="res-guests"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="res-seating" className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  Seating Area
                </label>
                <select
                  id="res-seating"
                  value={seatingArea}
                  onChange={(e) => setSeatingArea(e.target.value as Reservation['seatingArea'])}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                >
                  {SEATING_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#5C493E] mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8C5F23]" />
                  <span>Select Preferred Time</span>
                </span>
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`py-2.5 rounded-lg text-xs font-mono tabular-nums font-medium border transition-colors cursor-pointer ${
                      time === slot
                        ? 'bg-[#1A120E] text-[#FAF7F2] border-[#1A120E]'
                        : 'bg-[#FAF7F2] text-[#5C493E] border-[#1A120E]/12 hover:border-[#C6934B]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="res-name" className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  Customer Name
                </label>
                <input
                  id="res-name"
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Camille Laurent"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>
              <div>
                <label htmlFor="res-phone" className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  Phone Number
                </label>
                <input
                  id="res-phone"
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (415) 555-0133"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="res-email" className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  Email (optional)
                </label>
                <input
                  id="res-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>
              <div>
                <label htmlFor="res-notes" className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  Special Requests (optional)
                </label>
                <input
                  id="res-notes"
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Window booth, birthday dessert..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#C6934B] text-[#120D0A] text-sm font-semibold hover:bg-[#D4A853] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Confirming Reservation...' : 'Confirm Table Reservation'}
            </button>
          </form>

          <aside className="lg:col-span-4 bg-[#1A120E] text-[#FAF7F2] rounded-xl p-6 space-y-5">
            <h2 className="font-display text-2xl font-semibold">Dining Ambiance</h2>
            <div className="space-y-4 text-sm text-[#C4B7AA]">
              <div className="pb-3 border-b border-white/10">
                <p className="text-[#D4A853] font-medium">Main Roastery Lounge</p>
                <p className="text-xs mt-1">
                  Mahogany booths beneath warm pendant brass lamps with full kitchen service.
                </p>
              </div>
              <div className="pb-3 border-b border-white/10">
                <p className="text-[#D4A853] font-medium">Golden Courtyard</p>
                <p className="text-xs mt-1">
                  Heated open-air travertine patio framed by olive trees and evening lanterns.
                </p>
              </div>
              <div>
                <p className="text-[#D4A853] font-medium">Espresso Bar Counter</p>
                <p className="text-xs mt-1">
                  Front-row marble seating for single-origin pour-overs and barista tastings.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
