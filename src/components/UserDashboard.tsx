import React, { useState, useEffect } from 'react';
import { Booking, Notification, WalletTransaction, Listing, handleImageError } from '../types';
import { useLanguage } from '../LanguageContext';
import { Calendar, Wallet, Award, Share2, Printer, AlertTriangle, MessageSquare, Bell, Check, Trash, Heart, Eye, MapPin } from 'lucide-react';

interface UserDashboardProps {
  userEmail: string;
  setView: (v: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onSelectListing: (listing: Listing) => void;
}

export default function UserDashboard({ userEmail, setView, onSelectBooking, onSelectListing }: UserDashboardProps) {
  const { language, t, isRtl } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'wishlist' | 'wallet' | 'rewards' | 'notifications'>('trips');

  // Load from express endpoints
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user bookings
      const bookRes = await fetch(`/api/bookings?email=${userEmail}`);
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        // Sort descending by created time
        setBookings(bookData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      // 2. Fetch system notifications
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }

      // 3. Populate mock transactions based on user bookings
      setTransactions([
        { id: 'tx-1', type: 'deposit', amount: 50000, status: 'completed', description: 'Bank Wire Wallet Top-Up', createdAt: '2026-06-15' },
        { id: 'tx-2', type: 'payment', amount: 105000, status: 'completed', description: 'Booking Payment b-991 Luxus Hunza', createdAt: '2026-06-16' },
        { id: 'tx-3', type: 'deposit', amount: 5000, status: 'completed', description: 'Referral Bonus reward (invitation #9924)', createdAt: '2026-06-20' }
      ]);

      // 4. Load saved wishlist items matched from localStorage
      const savedIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
      if (savedIds.length > 0) {
        const listRes = await fetch('/api/listings');
        if (listRes.ok) {
          const allListings: Listing[] = await listRes.json();
          const matched = allListings.filter(item => savedIds.includes(item.id));
          setWishlistItems(matched);
        }
      } else {
        setWishlistItems([]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userEmail, activeTab]);

  // Cancel Booking Action
  const handleCancelBooking = async (bookingId: string) => {
    const confirm = window.confirm('Are you absolutely sure you want to cancel this booking? This will process an automatic refund to your wallet.');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', paymentStatus: 'refunded' })
      });

      if (res.ok) {
        // Reload
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Notification as read
  const handleReadNotification = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove individual listing from wishlist inside dashboard
  const handleRemoveWishlistItem = (listingId: string) => {
    const savedIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updated = savedIds.filter((id: string) => id !== listingId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlistItems(wishlistItems.filter(item => item.id !== listingId));
  };

  const activeBookingsCount = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div id="user-dashboard-view" className="space-y-8 pb-16">
      
      {/* Header Profile Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs" id="user-profile-header">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg bg-[#0F172A] flex items-center justify-center font-bold text-white text-2xl shadow-xs">
            AR
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              Ahmad Raza
              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Gold Loyalty Level</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{userEmail} • Verified Traveler</p>
          </div>
        </div>

        {/* Dynamic Metric cards inside Header */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="dashboard-metrics-summary">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Active Bookings</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block font-mono">{activeBookingsCount} Active</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Wallet Balance</span>
            <span className="text-sm font-bold text-indigo-600 mt-1 block font-mono">PKR 14,500</span>
          </div>
          <div className="hidden md:block bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Loyalty Coins</span>
            <span className="text-sm font-bold text-amber-600 mt-1 block font-mono">1,250 LC</span>
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-slate-200 pb-1.5 space-x-6 overflow-x-auto scrollbar-none" id="dashboard-tabs-bar">
        {[
          { id: 'trips', label: 'My Bookings', icon: Calendar },
          { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, count: wishlistItems.length },
          { id: 'wallet', label: 'My Wallet', icon: Wallet },
          { id: 'rewards', label: 'Rewards & Referrals', icon: Award },
          { id: 'notifications', label: 'Alerts', icon: Bell, count: notifications.filter(n => !n.read).length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-dash-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 relative whitespace-nowrap ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">{tab.count}</span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider">Fetching profiles from server...</p>
        </div>
      ) : (
        <div id="dashboard-active-pane">
          
          {/* TAB 1: Trips and bookings */}
          {activeTab === 'trips' && (
            <div className="space-y-4 animate-fadeIn" id="dash-trips-pane">
              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                  <p className="text-sm text-slate-500 font-medium">You have no booking coordinates registered on this email yet.</p>
                  <button 
                    id="btn-dash-empty-browse"
                    onClick={() => setView('explore')} 
                    className="mt-4 bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-xs"
                  >
                    Browse Pakistan Destinations
                  </button>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking.id}
                    id={`dash-booking-card-${booking.id}`}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-xs"
                  >
                    {/* Thumbnail */}
                    <img src={booking.listingImage} alt="" className="w-full md:w-44 h-32 md:h-auto object-cover shrink-0" referrerPolicy="no-referrer" onError={handleImageError} />

                    {/* Metadata Content */}
                    <div className="p-5 flex-1 flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                            ID: {booking.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                            booking.status === 'confirmed' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                            booking.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            'bg-rose-50 border-rose-100 text-rose-600'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#0F172A] uppercase tracking-tight">{booking.listingTitle}</h4>
                        <p className="text-xs text-slate-500 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                          <span>{booking.startDate} to {booking.endDate} • {booking.duration} days</span>
                        </p>
                      </div>

                      <div className="flex flex-col justify-between items-end gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Paid Amount</span>
                          <span className="text-base font-bold text-slate-800">PKR {booking.totalPrice.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 font-medium block capitalize">
                            Via {booking.paymentMethod === 'pay_at_hotel' ? 'Oyo Pay At Stay' : `${booking.paymentMethod} Payment`}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button
                            id={`btn-dash-view-${booking.id}`}
                            onClick={() => onSelectBooking(booking)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center space-x-1 shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-400" />
                            <span>Invoice</span>
                          </button>

                          {booking.status !== 'cancelled' && (
                            <button
                              id={`btn-dash-cancel-${booking.id}`}
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center space-x-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Cancel Trip</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 1.5: Airbnb Style Saved Wishlist Panel (Airbnb Feature) */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4 animate-fadeIn" id="dash-wishlist-pane">
              {wishlistItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                  <Heart className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Your wishlist is empty. Tap the heart icon on properties to save them here.</p>
                  <button 
                    id="btn-wishlist-empty-browse"
                    onClick={() => setView('explore')} 
                    className="mt-4 bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-xs"
                  >
                    Discover Stays
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="wishlist-properties-grid">
                  {wishlistItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                      id={`wishlist-item-card-${item.id}`}
                    >
                      <div className="relative aspect-[4/3] bg-slate-100">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                        <button
                          id={`btn-remove-wishlist-dash-${item.id}`}
                          onClick={() => handleRemoveWishlistItem(item.id)}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs text-rose-600 hover:text-rose-700 rounded-full shadow-xs cursor-pointer"
                          title="Remove from favorites"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                            <span className="text-slate-800 font-bold text-xs flex items-center gap-0.5">
                              ★ {item.rating}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-tight line-clamp-1">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-0.5"><MapPin className="w-3 h-3 text-rose-500 shrink-0" /> {item.location}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Starting Rate</span>
                            <span className="text-xs font-mono font-extrabold text-slate-800">PKR {item.price.toLocaleString()}</span>
                          </div>
                          
                          <button
                            id={`btn-wishlist-view-details-${item.id}`}
                            onClick={() => onSelectListing(item)}
                            className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> <span>View Stay</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Wallet Details */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 animate-fadeIn" id="dash-wallet-pane">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Credit balance card */}
                <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between h-44 rounded-2xl shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Traveler Virtual Wallet</span>
                    <span className="text-3xl font-bold text-[#0F172A] mt-2 block font-mono">PKR 14,500</span>
                  </div>
                  <div className="flex space-x-2">
                    <button id="btn-topup-wallet" onClick={() => alert('Secure payment integration active')} className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-xs">
                      Top-Up Balance
                    </button>
                    <button id="btn-withdraw-wallet" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-xs">
                      Cash-Out
                    </button>
                  </div>
                </div>

                {/* Loyalty Tier details */}
                <div className="bg-white border border-slate-200 p-6 space-y-4 rounded-2xl shadow-xs">
                  <h4 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider flex items-center"><Award className="w-4 h-4 mr-1 text-amber-500" /> Gold Tier Privileges</h4>
                  <ul className="space-y-2 text-xs text-slate-600 font-medium">
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0" /> Late 2:00 PM checkout priority</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0" /> Free airport shuttle transfers in Islamabad / Skardu</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0" /> Double referral bonuses</li>
                  </ul>
                </div>
              </div>

              {/* Transaction Logs */}
              <div className="space-y-3" id="dash-wallet-transactions">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Records</h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 shadow-xs">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between text-xs" id={`tx-item-${tx.id}`}>
                      <div>
                        <p className="font-bold text-slate-800">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{tx.createdAt} • ID: {tx.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold ${tx.type === 'deposit' ? 'text-indigo-600' : 'text-slate-600'}`}>
                          {tx.type === 'deposit' ? '+' : '-'} PKR {tx.amount.toLocaleString()}
                        </span>
                        <span className="block text-[9px] text-slate-400 uppercase font-bold mt-0.5">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Rewards & Referral Link */}
          {activeTab === 'rewards' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-fadeIn" id="dash-rewards-pane">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0F172A] uppercase tracking-tight">Invite Friends, Travel for Free</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Refer your peers to GBBookings. When they book their first luxury Hunza stay, we credit PKR 5,000 instantly into your virtual wallet and award them 10% off.
                </p>
              </div>

              {/* Referral Code link */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-xs" id="referral-box">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Personal Referral Code</span>
                  <span className="text-sm font-bold text-slate-700 mt-1 block">https://gbbookings.com/invite/AR105</span>
                </div>
                <button
                  id="btn-copy-referral"
                  onClick={() => {
                    alert('Referral invitation code copied to clipboard!');
                  }}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </button>
              </div>

              {/* Rewards metrics */}
              <div className="grid grid-cols-3 gap-4 text-center" id="referral-metrics">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Referred</span>
                  <span className="text-lg font-bold text-[#0F172A] mt-1 block font-mono">12 Friends</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bookings Cleared</span>
                  <span className="text-lg font-bold text-[#0F172A] mt-1 block font-mono">1 Approved</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Earnings</span>
                  <span className="text-lg font-bold text-indigo-600 mt-1 block font-mono">PKR 5,000</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Alerts and Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-fadeIn" id="dash-notifications-pane">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8 font-medium">No current notification alerts.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    id={`notif-card-${notif.id}`}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all shadow-xs ${
                      notif.read 
                        ? 'bg-white border-slate-200 text-slate-500' 
                        : 'bg-indigo-50/30 border-indigo-100 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${notif.read ? 'bg-slate-400' : 'bg-indigo-600'}`} />
                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">{notif.title}</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium">{notif.message}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                    </div>

                    {!notif.read && (
                      <button
                        id={`btn-read-notif-${notif.id}`}
                        onClick={() => handleReadNotification(notif.id)}
                        className="bg-[#0F172A] hover:bg-slate-800 text-white p-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
