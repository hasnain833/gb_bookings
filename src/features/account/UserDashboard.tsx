import React, { useState, useEffect } from 'react';
import { Booking, Notification, WalletTransaction, Listing, handleImageError } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { DashboardSkeleton } from '../../shared/components/SkeletonLoader';
import { Calendar, Wallet, Award, Share2, Printer, AlertTriangle, MessageSquare, Bell, Check, Trash, Heart, Eye, MapPin, X, ShieldCheck } from 'lucide-react';
import { useBodyScrollLock } from '../../shared/utils/scrollLock';
import { api } from '../../shared/api/api';
import SecurityPanel from './SecurityPanel';

interface UserDashboardProps {
  userEmail: string;
  userName?: string;
  setView: (v: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onSelectListing: (listing: Listing) => void;
}

export default function UserDashboard({ userEmail, userName, setView, onSelectBooking, onSelectListing }: UserDashboardProps) {
  const { language, t, isRtl } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'wishlist' | 'wallet' | 'rewards' | 'notifications' | 'security'>('trips');
  const [cancelBookingConfirmId, setCancelBookingConfirmId] = useState<string | null>(null);
  const [cancellingInProgress, setCancellingInProgress] = useState(false);

  useBodyScrollLock(!!cancelBookingConfirmId);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingResult, notificationResult, transactionResult, wishlistResult] = await Promise.allSettled([
        api.getBookings(),
        api.getNotifications(),
        api.getWalletTransactions(),
        api.getWishlist(),
      ]);

      setBookings(bookingResult.status === 'fulfilled'
        ? bookingResult.value.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : []);
      setNotifications(notificationResult.status === 'fulfilled' ? notificationResult.value : []);
      setTransactions(transactionResult.status === 'fulfilled' ? transactionResult.value : []);
      setWishlistItems(wishlistResult.status === 'fulfilled' ? wishlistResult.value : []);
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
    try {
      setCancellingInProgress(true);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', paymentStatus: 'refunded' })
      });

      if (res.ok) {
        setCancelBookingConfirmId(null);
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancellingInProgress(false);
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

  const handleRemoveWishlistItem = async (listingId: string) => {
    try {
      await api.removeWishlistItem(listingId);
      setWishlistItems((items) => items.filter((item) => item.id !== listingId));
    } catch (reason) {
      console.error(reason);
    }
  };

  const activeBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'Traveler');
  const userInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'GB';

  return (
    <div id="user-dashboard-view" className="space-y-8 pb-16">
      
      {/* Header Profile Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs" id="user-profile-header">
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-[#0F172A] flex items-center justify-center font-bold text-white text-xl sm:text-2xl shadow-xs shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2 uppercase tracking-tight">
              <span>{displayName}</span>
              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Gold Loyalty</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{userEmail || 'traveler@gbbookings.com'} • Verified Traveler</p>
          </div>
        </div>

        {/* Dynamic Metric cards inside Header */}
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 gap-2.5 sm:gap-4" id="dashboard-metrics-summary">
          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-3.5 rounded-lg text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Active Bookings</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 sm:mt-1 block font-mono">{activeBookingsCount} Active</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-3.5 rounded-lg text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Wallet Balance</span>
            <span className="text-xs sm:text-sm font-bold text-indigo-600 mt-0.5 sm:mt-1 block font-mono">PKR 14,500</span>
          </div>
          <div className="col-span-2 min-[480px]:col-span-1 bg-slate-50 border border-slate-200 p-3 sm:p-3.5 rounded-lg text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Loyalty Coins</span>
            <span className="text-xs sm:text-sm font-bold text-amber-600 mt-0.5 sm:mt-1 block font-mono">1,250 LC</span>
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-slate-200 pb-1.5 space-x-3 sm:space-x-6 overflow-x-auto touch-scroll-x scrollbar-none" id="dashboard-tabs-bar">
        {[
          { id: 'trips', label: 'My Bookings', icon: Calendar },
          { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, count: wishlistItems.length },
          { id: 'wallet', label: 'My Wallet', icon: Wallet },
          { id: 'rewards', label: 'Rewards & Referrals', icon: Award },
          { id: 'notifications', label: 'Alerts', icon: Bell, count: notifications.filter(n => !n.read).length },
          { id: 'security', label: 'Security', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-dash-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-[44px] px-2 sm:px-3 pb-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 relative whitespace-nowrap shrink-0 ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
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
        <DashboardSkeleton />
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
                    <img src={booking.listingImage} alt="" className="w-full md:w-44 h-32 md:h-auto object-cover shrink-0 rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl" referrerPolicy="no-referrer" onError={handleImageError} />

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

                      <div className="flex flex-col justify-between items-start md:items-end gap-3 shrink-0 w-full md:w-auto">
                        <div className="text-left md:text-right w-full">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Paid Amount</span>
                          <span className="text-base font-bold text-slate-800">PKR {booking.totalPrice.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 font-medium block capitalize">
                            Via {booking.paymentMethod === 'pay_at_hotel' ? 'Oyo Pay At Stay' : `${booking.paymentMethod} Payment`}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                          <button
                            id={`btn-dash-view-${booking.id}`}
                            onClick={() => onSelectBooking(booking)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-xs min-h-[44px]"
                          >
                            <Printer className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>Invoice</span>
                          </button>

                          {booking.status !== 'cancelled' && (
                            <button
                              id={`btn-dash-cancel-${booking.id}`}
                              onClick={() => setCancelBookingConfirmId(booking.id)}
                              className="bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 min-h-[44px]"
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0" />
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
                          className="w-full h-full object-cover rounded-t-2xl" 
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                        <button
                          id={`btn-remove-wishlist-dash-${item.id}`}
                          onClick={() => handleRemoveWishlistItem(item.id)}
                          className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-xs text-rose-600 hover:text-rose-700 rounded-full shadow-md cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-transform hover:scale-105"
                          title="Remove from favorites"
                          aria-label="Remove from favorites"
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

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider truncate">Starting Rate</span>
                            <span className="text-xs font-mono font-extrabold text-slate-800">PKR {item.price.toLocaleString()}</span>
                          </div>
                          
                          <button
                            id={`btn-wishlist-view-details-${item.id}`}
                            onClick={() => onSelectListing(item)}
                            className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-3.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer min-h-[44px] shrink-0 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" /> <span>View Stay</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Credit balance card */}
                <div className="bg-white border border-slate-200 p-5 sm:p-6 flex flex-col justify-between min-h-48 sm:h-48 rounded-2xl shadow-xs space-y-4 sm:space-y-0">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Traveler Virtual Wallet</span>
                    <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2 block font-mono">PKR 0</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 sm:space-x-2">
                    <button id="btn-topup-wallet" disabled className="bg-slate-300 text-slate-600 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider cursor-not-allowed shadow-xs min-h-[44px] flex items-center justify-center">
                      Top-Up Balance
                    </button>
                    <button id="btn-withdraw-wallet" disabled className="bg-white border border-slate-200 text-slate-400 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider cursor-not-allowed shadow-xs min-h-[44px] flex items-center justify-center">
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
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Records</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{transactions.length} Total</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs hover:bg-slate-50/50 transition-colors" id={`tx-item-${tx.id}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{tx.createdAt} • ID: <span className="font-mono">{tx.id}</span></p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                        <span className={`font-mono font-bold text-xs sm:text-sm ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.type === 'deposit' ? '+' : '-'} PKR {tx.amount.toLocaleString()}
                        </span>
                        <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                          tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Rewards & Referral Link */}
          {activeTab === 'rewards' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-xs animate-fadeIn" id="dash-rewards-pane">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] uppercase tracking-tight">Invite Friends, Travel for Free</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Refer your peers to GBBookings. When they book their first luxury Hunza stay, we credit PKR 5,000 instantly into your virtual wallet and award them 10% off.
                </p>
              </div>

              {/* Referral Code link */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs" id="referral-box">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Personal Referral Code</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 mt-1 block truncate">https://gbbookings.com/invite/AR105</span>
                </div>
                <button
                  id="btn-copy-referral"
                  onClick={() => {
                    alert('Referral invitation code copied to clipboard!');
                  }}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </button>
              </div>

              {/* Rewards metrics */}
              <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 sm:gap-4 text-center" id="referral-metrics">
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Referred</span>
                  <span className="text-base sm:text-lg font-bold text-[#0F172A] mt-1 block font-mono">12 Friends</span>
                </div>
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bookings Cleared</span>
                  <span className="text-base sm:text-lg font-bold text-[#0F172A] mt-1 block font-mono">1 Approved</span>
                </div>
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Earnings</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-600 mt-1 block font-mono">PKR 5,000</span>
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

          {activeTab === 'security' && <SecurityPanel />}

        </div>
      )}

      {/* Cancel Booking Confirmation Modal Dialog */}
      {cancelBookingConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 touch-none overscroll-none"
          id="modal-cancel-booking-confirmation"
          onClick={() => !cancellingInProgress && setCancelBookingConfirmId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 text-left animate-in zoom-in-95 duration-150 max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                disabled={cancellingInProgress}
                onClick={() => setCancelBookingConfirmId(null)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Cancel Trip Reservation?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to cancel booking <span className="font-mono font-bold text-slate-800">#{cancelBookingConfirmId}</span>? An automatic full/partial refund will be credited instantly back to your virtual wallet balance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={cancellingInProgress}
                onClick={() => setCancelBookingConfirmId(null)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingInProgress}
                onClick={() => handleCancelBooking(cancelBookingConfirmId)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                {cancellingInProgress ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
