import React, { useState } from 'react';
import { CreditCard, Wallet, Calendar, ShieldCheck, CheckCircle, Ticket, Printer, ArrowRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';
import { Listing, handleImageError } from '../../types';

interface CheckoutFlowProps {
  bookingParams: {
    listingId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    guests: number;
    duration: number;
    withDriver?: boolean;
    payAtHotel?: boolean;
    appliedPromo?: string;
    upgradeOption?: string;
    cancellationPolicy?: string;
  };
  listing: Listing;
  userEmail?: string;
  userName?: string;
  onSuccess: (booking: any) => void;
  onCancel: () => void;
}

export default function CheckoutFlow({ bookingParams, listing, userEmail = '', userName = '', onSuccess, onCancel }: CheckoutFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Contact, 2: Payment, 3: Processing, 4: Receipt
  
  // Contacts (initialized from logged-in user if available, otherwise empty)
  const [customerName, setCustomerName] = useState(userName || '');
  const [customerEmail, setCustomerEmail] = useState(userEmail || '');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'jazzcash' | 'easypaisa' | 'pay_at_hotel'>(
    bookingParams.payAtHotel ? 'pay_at_hotel' : 'card'
  );
  const [cardHolderName, setCardHolderName] = useState(userName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  
  const [processingMsg] = useState('Submitting your booking securely...');
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const submitBooking = async () => {
    setStep(3);
    setSubmissionError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: bookingParams.listingId,
          customerName,
          customerEmail,
          customerPhone,
          startDate: bookingParams.startDate,
          endDate: bookingParams.endDate,
          totalPrice: bookingParams.totalPrice,
          paymentMethod: bookingParams.payAtHotel ? 'pay_at_hotel' : paymentMethod,
          guests: bookingParams.guests,
          duration: bookingParams.duration,
          withDriver: bookingParams.withDriver
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedBooking(data);
        setStep(4);
      } else {
        const payload = await res.json().catch(() => null);
        setSubmissionError(payload?.error || 'Booking could not be completed. Please try again.');
        setStep(2);
      }
    } catch (reason) {
      console.error(reason);
      setSubmissionError('The booking service is unavailable. Please try again.');
      setStep(2);
    }
  };

  return (
    <div id="checkout-flow-component" className="max-w-xl mx-auto px-4 sm:px-6 pb-24 animate-fadeIn">
      
      {/* Back button (Only in steps 1 and 2) */}
      {step <= 2 && (
        <button 
          id="btn-back-checkout"
          onClick={step === 1 ? onCancel : () => setStep(1)}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 mb-6 cursor-pointer app-tap min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> 
          <span>{step === 1 ? 'Cancel checkout' : 'Back to details'}</span>
        </button>
      )}

      {/* Progress indicators */}
      {step !== 3 && (
        <div className="flex items-center justify-between mb-6 px-1" id="checkout-progress-indicators">
          {[
            { s: 1, label: 'Details' },
            { s: 2, label: bookingParams.payAtHotel ? 'Confirmation' : 'Payment' },
            { s: 4, label: 'Invoice' }
          ].map((item, i) => (
            <React.Fragment key={item.s}>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                  step === item.s 
                    ? 'bg-[#006F3C] text-white shadow-md ring-2 ring-emerald-100' 
                    : step > item.s 
                      ? 'bg-emerald-100 text-[#006F3C]' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > item.s ? '✓' : item.s === 4 ? 3 : item.s}
                </div>
                <span className={`text-xs font-bold ${step === item.s ? 'text-slate-900 font-extrabold' : 'text-slate-400'} hidden min-[400px]:inline-block`}>
                  {item.label}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-2 sm:mx-3 ${step > item.s ? 'bg-[#006F3C]' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {submissionError && step <= 2 && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
          {submissionError}
        </div>
      )}

      {/* STEP 1: Contacts Information */}
      {step === 1 && (
        <div className="mobile-card p-5 sm:p-6 space-y-6 animate-fadeIn" id="checkout-step-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Traveler Details</h2>
            <p className="text-sm text-slate-500 mt-1">Please provide accurate contact details for booking confirmation and host coordination.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Full Name</label>
              <input
                type="text"
                required
                id="checkout-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ali Khan"
                className="w-full min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#006F3C] focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Email Address</label>
              <input
                type="email"
                required
                id="checkout-email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#006F3C] focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">WhatsApp / Phone Number</label>
              <input
                type="tel"
                required
                id="checkout-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 03001234567"
                className="w-full min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#006F3C] focus:bg-white transition-colors font-mono"
              />
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <img src={listing.image} alt="" className="w-16 h-14 object-cover rounded-xl shrink-0" referrerPolicy="no-referrer" onError={handleImageError} />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{listing.title}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#006F3C] shrink-0" /> 
                  <span>{bookingParams.startDate} to {bookingParams.endDate}</span>
                </p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  {bookingParams.payAtHotel ? 'Pay at Stay' : 'Total Amount'}
                </span>
                <span className="text-lg font-bold text-slate-900">
                  PKR {bookingParams.totalPrice.toLocaleString()}
                </span>
              </div>
              {bookingParams.payAtHotel && (
                <span className="text-xs font-bold text-[#006F3C] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  PKR 0 Due Online
                </span>
              )}
            </div>
          </div>

          <button
            id="btn-checkout-to-payment"
            onClick={() => {
              if (!customerName || !customerEmail || !customerPhone) {
                alert('Please fill out all contact fields.');
                return;
              }
              setStep(2);
            }}
            className="w-full btn-primary-mobile min-h-[48px]"
          >
            <span>{bookingParams.payAtHotel ? 'Continue to Confirmation' : 'Continue to Payment'}</span> 
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* STEP 2: Secure Payment Options */}
      {step === 2 && (
        <div className="mobile-card p-5 sm:p-6 space-y-6 animate-fadeIn" id="checkout-step-2">
          {bookingParams.payAtHotel ? (
            <div className="space-y-6" id="pay-at-stay-confirmation-form">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#006F3C] tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 shrink-0" /> 
                  <span>Pay At Stay Reservation</span>
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Book now with zero advance payment. Your room is guaranteed and reserved until 6:00 PM on check-in day.
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold text-[#006F3C] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> Why book with Pay At Stay?
                </h4>
                <ul className="space-y-1.5 text-xs text-emerald-900 font-semibold">
                  <li className="flex items-center gap-2">✓ No credit card or advance cash required today</li>
                  <li className="flex items-center gap-2">✓ Instant reservation confirmation voucher</li>
                  <li className="flex items-center gap-2">✓ Pay at front desk via Cash, Card, or JazzCash</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Host Verification Phone</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Registered phone:</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{customerPhone}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#006F3C] shrink-0 mt-0.5" />
                <span>By continuing, you confirm your booking and agree to property check-in guidelines.</span>
              </div>

              <button
                id="btn-complete-payment-checkout"
                onClick={submitBooking}
                className="w-full btn-primary-mobile min-h-[48px]"
              >
                <span>Confirm & Reserve Room</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6" id="digital-payments-confirmation-form">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Select Payment Method</h2>
                <p className="text-sm text-slate-500 mt-1">Choose your preferred secure payment method.</p>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3" id="payment-gateways-selector">
                {[
                  { id: 'card', label: 'Debit / Card', icon: CreditCard },
                  { id: 'jazzcash', label: 'JazzCash', icon: Wallet },
                  { id: 'easypaisa', label: 'Easypaisa', icon: Wallet }
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      id={`btn-gateway-${method.id}`}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`min-h-[58px] p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all app-tap ${
                        isSelected 
                          ? 'border-[#006F3C] bg-emerald-50/60 text-[#006F3C] font-bold shadow-xs' 
                          : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold truncate max-w-full">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Form Fields */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4" id="payment-gateway-form">
                {paymentMethod === 'card' ? (
                  <div className="space-y-3.5 animate-fadeIn" id="card-inputs-subform">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        placeholder="Name on card"
                        className="w-full min-h-[48px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Card Number</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full min-h-[48px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C] font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          className="w-full min-h-[48px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">CVV</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          maxLength={4}
                          className="w-full min-h-[48px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-fadeIn" id="wallet-inputs-subform">
                    <p className="text-xs text-slate-600 font-medium">
                      Enter your registered {paymentMethod === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} mobile number. You will receive an OTP prompt to approve.
                    </p>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block capitalize">{paymentMethod} Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={walletNumber}
                        onChange={(e) => setWalletNumber(e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="w-full min-h-[48px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C] font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Safety note */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#006F3C] shrink-0" />
                <span>256-bit encrypted secure transaction gateway.</span>
              </div>

              <button
                id="btn-complete-payment-checkout"
                onClick={submitBooking}
                className="w-full btn-primary-mobile min-h-[48px]"
              >
                <span>Pay PKR {bookingParams.totalPrice.toLocaleString()}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Booking submission */}
      {step === 3 && (
        <div className="mobile-card p-10 text-center space-y-6" id="checkout-step-3">
          <div className="w-16 h-16 border-4 border-[#006F3C] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800">
              {bookingParams.payAtHotel ? 'Securing Stay Reservation' : 'Processing Payment'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">{processingMsg}</p>
          </div>
        </div>
      )}

      {/* STEP 4: Success & Receipt */}
      {step === 4 && createdBooking && (
        <div className="space-y-6 animate-fadeIn" id="checkout-step-4">
          <div className="mobile-card p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#006F3C] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {bookingParams.payAtHotel ? 'Reservation Confirmed!' : 'Booking Confirmed!'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {bookingParams.payAtHotel 
                  ? 'Your reservation has been locked with the host. Present this digital voucher upon arrival.'
                  : 'Payment processed successfully. Your trip confirmation voucher is ready.'}
              </p>
            </div>
          </div>

          {/* Printable Ticket Receipt Card */}
          <div className="mobile-card p-5 space-y-4" id="printable-ticket-receipt">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold text-[#006F3C] uppercase tracking-wider">
                  {bookingParams.payAtHotel ? 'Pay at Stay Voucher' : 'Booking Confirmation'}
                </p>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{createdBooking.listingTitle}</h4>
              </div>
              <span className="bg-emerald-50 text-[#006F3C] font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                #{createdBooking.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Guest Name</span>
                <span className="font-bold text-slate-800">{createdBooking.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Contact</span>
                <span className="font-bold text-slate-800">{createdBooking.customerPhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Dates</span>
                <span className="font-bold text-slate-800">{createdBooking.startDate} – {createdBooking.endDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Amount</span>
                <span className="font-bold text-slate-900 text-sm">PKR {createdBooking.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-[#006F3C]">
                {bookingParams.payAtHotel ? 'Pay at Check-In' : 'Paid Online'}
              </span>
            </div>
          </div>

          {/* Post Actions */}
          <div className="space-y-3" id="checkout-completed-actions">
            <button
              id="btn-goto-dashboard"
              onClick={() => onSuccess(createdBooking)}
              className="w-full btn-primary-mobile min-h-[48px]"
            >
              <span>Go to My Bookings</span>
            </button>
            <button
              onClick={() => {
                alert('Sent PDF print request.');
              }}
              id="btn-print-receipt"
              className="w-full btn-secondary-mobile min-h-[48px]"
            >
              <Printer className="w-4 h-4" />
              <span>Save / Print PDF Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
