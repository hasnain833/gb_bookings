import React, { useState } from 'react';
import { CreditCard, Wallet, Calendar, ShieldCheck, CheckCircle, Ticket, Printer, ArrowRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';
import { Listing } from '../types';

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
  onSuccess: (booking: any) => void;
  onCancel: () => void;
}

export default function CheckoutFlow({ bookingParams, listing, onSuccess, onCancel }: CheckoutFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Contact, 2: Payment, 3: Processing, 4: Receipt
  
  // Contacts
  const [customerName, setCustomerName] = useState('Ahmad Raza');
  const [customerEmail, setCustomerEmail] = useState('ibtesaam0@gmail.com');
  const [customerPhone, setCustomerPhone] = useState('03001234567');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'jazzcash' | 'easypaisa' | 'pay_at_hotel'>(
    bookingParams.payAtHotel ? 'pay_at_hotel' : 'card'
  );
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [walletNumber, setWalletNumber] = useState('03001234567');
  
  // Processing messages
  const [processingMsg, setProcessingMsg] = useState('Initiating payment gateway secure handshake...');
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  const startPaymentSimulation = async () => {
    setStep(3);
    
    let messages = [
      'Initiating payment gateway secure handshake...',
      'Verifying account balance with Pakistan clearing nodes...',
      'Securing active hotel room inventory block...',
      'Injecting signature credentials into booking ledger...',
      'Finalizing transaction confirmation receipt...'
    ];

    if (bookingParams.payAtHotel) {
      messages = [
        'Connecting to property local operations host...',
        'Securing physical reservation allotment slot...',
        'Bypassing advance gateway payment sitemaps...',
        'Locking room under verified traveler phone hold...',
        'Generating digital booking receipt invoice...'
      ];
    }

    // Cycle messages over 2.5s
    for (let i = 0; i < messages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProcessingMsg(messages[i]);
    }

    // Submit actual booking to Express backend!
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
        alert('Transaction failed. Please try again.');
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to payment gateway.');
      setStep(2);
    }
  };

  return (
    <div id="checkout-flow-component" className="max-w-2xl mx-auto pb-16">
      
      {/* Back button (Only in steps 1 and 2) */}
      {step <= 2 && (
        <button 
          id="btn-back-checkout"
          onClick={step === 1 ? onCancel : () => setStep(1)}
          className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> <span>{step === 1 ? 'Cancel checkout' : 'Back to details form'}</span>
        </button>
      )}

      {/* Progress indicators (Only in steps 1, 2, 4) */}
      {step !== 3 && (
        <div className="flex items-center justify-between mb-8" id="checkout-progress-indicators">
          {[
            { s: 1, label: 'Contacts' },
            { s: 2, label: bookingParams.payAtHotel ? 'Confirmation' : 'Payment' },
            { s: 4, label: 'Invoice' }
          ].map((item, i) => (
            <React.Fragment key={item.s}>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === item.s 
                    ? 'bg-[#0F172A] text-white shadow-xs' 
                    : step > item.s 
                      ? 'bg-indigo-600/10 text-indigo-600 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {step > item.s ? '✓' : item.s === 4 ? 3 : item.s}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step === item.s ? 'text-slate-900' : 'text-slate-400'}`}>{item.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-4 ${step > item.s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* STEP 1: Contacts Information */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-fadeIn" id="checkout-step-1">
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] uppercase tracking-tight">Traveler Details</h3>
            <p className="text-xs text-slate-500 mt-1">Please provide accurate contact coordinates for immigration and hospitality desks.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  id="checkout-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email"
                  required
                  id="checkout-email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">WhatsApp / Phone Number</label>
              <input
                type="tel"
                required
                id="checkout-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 03001234567"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
              />
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <img src={listing.image} alt="" className="w-16 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">{listing.title}</h4>
                <p className="text-[10px] text-slate-500 flex items-center mt-0.5"><Calendar className="w-3 h-3 mr-0.5 text-indigo-600" /> {bookingParams.startDate} to {bookingParams.endDate}</p>
              </div>
            </div>
            
            {bookingParams.payAtHotel ? (
              <div className="text-right">
                <span className="text-[10px] text-[#15803D] font-extrabold block uppercase tracking-wider">Oyo Pay At Stay</span>
                <span className="text-sm font-bold text-slate-700 block">PKR {bookingParams.totalPrice.toLocaleString()} due later</span>
                <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wider mt-0.5">PKR 0 Due Online</span>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Due</span>
                <span className="text-sm font-bold text-indigo-600">PKR {bookingParams.totalPrice.toLocaleString()}</span>
              </div>
            )}
          </div>

          <button
            id="btn-checkout-to-payment"
            onClick={() => setStep(2)}
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-lg shadow-xs transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
          >
            <span>{bookingParams.payAtHotel ? 'Secure Reservation Hold' : 'Proceed to Payment Option'}</span> <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Secure Payment Options or Pay-at-hotel hold card */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-fadeIn" id="checkout-step-2">
          {bookingParams.payAtHotel ? (
            <div className="space-y-6 animate-fadeIn" id="pay-at-stay-confirmation-form">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[#15803D] uppercase tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5" /> Pay At Stay Allotment Hold
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  We are securing this booking slot under our **PKR 0 online advance** policy. Your space is held until 6:00 PM on check-in day.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl space-y-3.5">
                <h4 className="text-xs font-bold text-[#15803D] uppercase tracking-wider flex items-center gap-1"><Info className="w-4 h-4" /> Why book with Pay At Stay?</h4>
                <ul className="space-y-2 text-xs text-[#15803D] font-semibold">
                  <li className="flex items-center gap-2">✓ No credit card or advance cash required today</li>
                  <li className="flex items-center gap-2">✓ Lock room inventory instantly on the official ledger</li>
                  <li className="flex items-center gap-2">✓ Pay at reception desk using JazzCash, Card, or local currency</li>
                  <li className="flex items-center gap-2">✓ Guaranteed clean, sanitized linen check upon arrival</li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#15803D] block">Confirm WhatsApp Hold Code</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Host will verify hold via contact number:</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{customerPhone}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 text-[10px] text-slate-500 font-medium">
                <ShieldCheck className="w-4.5 h-4.5 text-[#15803D] shrink-0" />
                <span>By continuing, you authorize direct room blocking and agree to host stay policies.</span>
              </div>

              <button
                id="btn-complete-payment-checkout"
                onClick={startPaymentSimulation}
                className="w-full bg-[#15803D] hover:bg-[#166534] text-white font-bold py-3.5 px-6 rounded-lg shadow-sm transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
              >
                <span>Authorize & Hold Room Allotment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6" id="digital-payments-confirmation-form">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] uppercase tracking-tight">Payment Options</h3>
                <p className="text-xs text-slate-500 mt-1">Select your preferred transaction mechanism. Local digital wallets are authorized instantly.</p>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-3 gap-3" id="payment-gateways-selector">
                {[
                  { id: 'card', label: 'Credit Card', icon: CreditCard },
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
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#0F172A] bg-slate-50 text-[#0F172A] font-bold' 
                          : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 shadow-xs'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Form Fields */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4" id="payment-gateway-form">
                {paymentMethod === 'card' ? (
                  <div className="space-y-4 animate-fadeIn" id="card-inputs-subform">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Ahmad Raza"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Card Number</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CVV / Security Code</label>
                        <input
                          type="password"
                          required
                          placeholder="***"
                          maxLength={3}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn" id="wallet-inputs-subform">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-normal">
                      You will receive an instant push verification window on your mobile phone to enter your secure 4-digit Pin once the payment is triggered below.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 capitalize">{paymentMethod} Mobile Account Number</label>
                      <input
                        type="tel"
                        required
                        value={walletNumber}
                        onChange={(e) => setWalletNumber(e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Safety note */}
              <div className="flex items-center space-x-2.5 text-[10px] text-slate-500 font-medium">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                <span>Encrypted via secure end-to-end payment gateway clearance. We do not store financial codes.</span>
              </div>

              <button
                id="btn-complete-payment-checkout"
                onClick={startPaymentSimulation}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-lg shadow-xs transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
              >
                <span>Confirm & Authorize PKR {bookingParams.totalPrice.toLocaleString()}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Progress Handshake Simulation */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-6 shadow-xs animate-pulse" id="checkout-step-3">
          <div className={`w-16 h-16 border-4 ${bookingParams.payAtHotel ? 'border-emerald-600' : 'border-indigo-600'} border-t-transparent rounded-full animate-spin mx-auto`} />
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {bookingParams.payAtHotel ? 'Securing Stay Reservation Allotment' : 'Securing Reservation'}
            </h4>
            <p className="text-xs text-slate-500 font-mono font-medium">{processingMsg}</p>
          </div>
        </div>
      )}

      {/* STEP 4: Success & Printable Ticket Invoice Card */}
      {step === 4 && createdBooking && (
        <div className="space-y-6 animate-fadeIn" id="checkout-step-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3 shadow-xs">
            <div className={`w-12 h-12 rounded-full ${bookingParams.payAtHotel ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'} flex items-center justify-center mx-auto`}>
              <CheckCircle className={`w-6 h-6 ${bookingParams.payAtHotel ? 'text-emerald-600' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A] uppercase tracking-tight">
                {bookingParams.payAtHotel ? 'Stay Allotment Secured!' : 'Booking Secured!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {bookingParams.payAtHotel 
                  ? 'Your physical hold token has been injected into the ledger. Present this invoice on arrival.'
                  : 'Transaction verified successfully. Your ticket has been logged into the ledger.'}
              </p>
            </div>
          </div>

          {/* Printable Ticket Receipt Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative" id="printable-ticket-receipt">
            {/* Design cutouts for ticket look */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#FAFAFA] rounded-r-full border-r border-slate-200" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#FAFAFA] rounded-l-full border-l border-slate-200" />

            <div className="bg-slate-50 p-5 border-b border-dashed border-slate-200 flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-bold tracking-widest ${bookingParams.payAtHotel ? 'text-emerald-600' : 'text-indigo-600'} uppercase`}>
                  {bookingParams.payAtHotel ? 'Official Hold Voucher Invoice' : 'Official Booking Invoice'}
                </p>
                <h4 className="text-sm font-semibold text-slate-800 mt-0.5">GBBookings Ledger Desk</h4>
              </div>
              <div className="text-right">
                <span className={`bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-md`}>
                  ID: {createdBooking.id}
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-xs border-b border-dashed border-slate-200">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Customer Name</span>
                <span className="font-bold text-slate-800">{createdBooking.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Contact Number</span>
                <span className="font-bold text-slate-800">{createdBooking.customerPhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Property Space</span>
                <span className="font-bold text-slate-800">{createdBooking.listingTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Location</span>
                <span className="font-bold text-slate-800">{createdBooking.listingLocation}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Reservation Dates</span>
                <span className="font-bold text-slate-800">{createdBooking.startDate} to {createdBooking.endDate}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Duration Details</span>
                <span className="font-bold text-slate-800">{createdBooking.duration} {createdBooking.listingType === 'hotel' ? 'Nights' : 'Days'}</span>
              </div>
              {createdBooking.guests && (
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Total Travelers</span>
                  <span className="font-bold text-slate-800">{createdBooking.guests} People</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 uppercase font-bold text-[9px] block tracking-wider">Clearing Gateway</span>
                <span className={`font-bold ${bookingParams.payAtHotel ? 'text-emerald-600' : 'text-indigo-600'} uppercase`}>
                  {createdBooking.paymentMethod === 'pay_at_hotel' ? 'Oyo Pay at Stay' : `${createdBooking.paymentMethod} Online`}
                </span>
              </div>
            </div>

            <div className="p-6 bg-slate-50/80 flex items-center justify-between">
              <div>
                {bookingParams.payAtHotel ? (
                  <>
                    <p className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider">Payable at stay Check-In</p>
                    <p className="text-xl font-bold text-[#15803D] mt-0.5">PKR {createdBooking.totalPrice.toLocaleString()}</p>
                    <p className="text-[9.5px] font-bold text-slate-400 mt-0.5">PKR 0 paid today online</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid Total (Net PKR)</p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">PKR {createdBooking.totalPrice.toLocaleString()}</p>
                  </>
                )}
              </div>

              {/* Barcode representation */}
              <div className="text-center space-y-1">
                <div className="h-8 w-28 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#0f172a_2px,#0f172a_4px,#64748b_4px,#64748b_5px)] opacity-85" />
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                  {bookingParams.payAtHotel ? 'SECURE_HOLD_TICKET' : 'SECURE_LEDGER_TICKET'}
                </span>
              </div>
            </div>
          </div>

          {/* Post Actions */}
          <div className="grid grid-cols-2 gap-4" id="checkout-completed-actions">
            <button
              onClick={() => {
                alert('Sent PDF print request. Checking local spool queues.');
              }}
              id="btn-print-receipt"
              className="bg-white border border-slate-200 hover:text-slate-900 text-slate-700 font-bold py-3.5 px-6 rounded-lg text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF Invoice</span>
            </button>

            <button
              id="btn-goto-dashboard"
              onClick={() => onSuccess(createdBooking)}
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-lg text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
            >
              <span>Manage My Trips</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
