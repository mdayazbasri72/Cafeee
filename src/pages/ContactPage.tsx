import React, { useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const CAFEE_LOCATION = { lat: 37.7765, lng: -122.4242 };

function CafeMapMarker() {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={CAFEE_LOCATION}
        onClick={() => setInfoOpen(true)}
        title="CAFEE Flagship Lounge"
      >
        <Pin background="#C6934B" borderColor="#120D0A" glyphColor="#120D0A" />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={240}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="text-[#1A120E] space-y-1 p-1">
            <p className="font-semibold text-sm">CAFEE Flagship Roastery</p>
            <p className="text-xs text-[#5C493E]">485 Hayes Street, San Francisco</p>
            <p className="text-xs text-[#8C5F23]">Open Daily · 07:00 – 22:00</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function ContactPage() {
  const { mapsApiKey, apiFetch, notify } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSentMessage('');
    try {
      const res = await apiFetch<{ message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSentMessage(res.message);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      notify('Feedback sent to our hospitality team.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="max-w-2xl space-y-2 border-b border-[#1A120E]/10 pb-6">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
          Visit &amp; Connect
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1A120E]">
          Contact CAFEE
        </h1>
        <p className="text-sm sm:text-base text-[#5C493E]">
          Drop by our Hayes Valley flagship, message us directly on WhatsApp, or share feedback with our roastery team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Details + Map */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#1A120E]/10 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C5F23]">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </div>
              <p className="text-sm text-[#1A120E] font-medium">
                485 Hayes Street, Hayes Valley
              </p>
              <p className="text-xs text-[#6E5A4F]">San Francisco, CA 94102</p>
            </div>

            <div className="bg-white rounded-xl border border-[#1A120E]/10 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C5F23]">
                <Clock className="w-4 h-4" />
                <span>Opening Hours</span>
              </div>
              <p className="text-sm text-[#1A120E] tabular-nums">Mon–Fri: 07:00 – 22:00</p>
              <p className="text-xs text-[#6E5A4F] tabular-nums">Sat–Sun: 08:00 – 23:00</p>
            </div>

            <div className="bg-white rounded-xl border border-[#1A120E]/10 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C5F23]">
                <Phone className="w-4 h-4" />
                <span>Direct Concierge</span>
              </div>
              <p className="text-sm text-[#1A120E] font-mono">+1 (415) 555-0199</p>
              <p className="text-xs text-[#6E5A4F] inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>concierge@cafee-roastery.com</span>
              </p>
            </div>

            <div className="bg-[#1A120E] text-[#FAF7F2] rounded-xl p-5 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs text-[#D4A853]">Instant Messaging</span>
                <p className="font-display text-xl font-semibold">Chat on WhatsApp</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/14155550199?text=Hello%20CAFEE%2C%20I%20would%20like%20to%20inquire%20about%20a%20table%20or%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] text-[#0C2615] text-xs font-semibold hover:opacity-90"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Us</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D4A853] hover:underline"
                >
                  Instagram
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D4A853] hover:underline"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Google Map */}
          <div className="rounded-xl overflow-hidden border border-[#1A120E]/12 bg-[#EFE8DD]">
            {mapsApiKey ? (
              <div className="h-[400px] w-full">
                <APIProvider apiKey={mapsApiKey} libraries={['marker']} language="en" region="US">
                  <GoogleMap
                    defaultCenter={CAFEE_LOCATION}
                    defaultZoom={15}
                    mapId="DEMO_MAP_ID"
                    gestureHandling="greedy"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <CafeMapMarker />
                  </GoogleMap>
                </APIProvider>
              </div>
            ) : (
              <div className="h-[360px] flex flex-col items-center justify-center p-6 text-center space-y-3">
                <MapPin className="w-7 h-7 text-[#8C5F23]" />
                <div className="space-y-1">
                  <p className="font-display text-2xl font-semibold">485 Hayes Street, San Francisco</p>
                  <p className="text-xs text-[#6E5A4F]">
                    Interactive map requires a configured Google Maps Platform API key.
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${CAFEE_LOCATION.lat},${CAFEE_LOCATION.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-xl border border-[#1A120E]/10 p-6 sm:p-8 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-semibold">Send Feedback</h2>
            <p className="text-xs text-[#6E5A4F]">
              Private events, catering requests, or barista compliments.
            </p>
          </div>

          {sentMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              {sentMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5C493E] mb-1">Your Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sophia Bennett"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C493E] mb-1">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sophia@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C493E] mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Private Tasting / Feedback"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C493E] mb-1">Message</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts or inquiry..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-lg bg-[#C6934B] text-[#120D0A] text-sm font-semibold hover:bg-[#D4A853] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
