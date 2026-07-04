import React from 'react';

// General block element
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-4 bg-slate-200 rounded' }) => {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
};

// Listing Card Skeleton (for search grids and recommendations)
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs flex flex-col h-full animate-pulse">
      {/* Aspect ratio image box */}
      <div className="aspect-[4/3] bg-slate-200 relative w-full" />
      
      {/* Content skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Tag & Location */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-1/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/5 bg-slate-200 rounded" />
          </div>
          
          {/* Main Title */}
          <div className="h-5 w-3/4 bg-slate-200 rounded" />
          
          {/* Subtitle/Description */}
          <div className="h-3 w-5/6 bg-slate-200 rounded" />
        </div>

        {/* Footer info (price & rating) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="h-4 w-1/4 bg-slate-200 rounded" />
          <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// Detailed Listing Page Skeleton
export const DetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 pb-16 animate-pulse">
      {/* Header Info */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-8 md:h-10 w-2/3 bg-slate-200 rounded" />
        <div className="flex items-center gap-4">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Image Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 aspect-[21/9] w-full rounded-2xl overflow-hidden">
        <div className="md:col-span-2 bg-slate-200 h-full" />
        <div className="hidden md:flex flex-col gap-4 col-span-1">
          <div className="bg-slate-200 flex-1" />
          <div className="bg-slate-200 flex-1" />
        </div>
        <div className="hidden md:flex flex-col gap-4 col-span-1">
          <div className="bg-slate-200 flex-1" />
          <div className="bg-slate-200 flex-1" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Main Info */}
        <div className="lg:col-span-8 space-y-6 text-left">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-4/5 bg-slate-200 rounded" />
          </div>

          <hr className="border-slate-100" />

          {/* Amenities Grid */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-200 shrink-0" />
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Booking Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-baseline">
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-10 w-full bg-slate-200 rounded-lg" />
            <div className="h-10 w-full bg-slate-200 rounded-lg" />
          </div>
          <div className="h-12 w-full bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

// Dashboard Grid / Stats Skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 pb-16 animate-pulse text-left">
      {/* Header and Welcome */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start border-b border-slate-100 pb-6">
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-8 w-3/4 bg-slate-200 rounded" />
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg shrink-0" />
      </div>

      {/* Performance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-150 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
            </div>
            <div className="h-7 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Large listing / booking list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-36 bg-slate-200 rounded mb-2" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 rounded" />
              </div>
              <div className="h-8 w-20 bg-slate-200 rounded-lg shrink-0" />
            </div>
          ))}
        </div>

        {/* Right Side: Simple activity or action checklist */}
        <div className="space-y-4">
          <div className="h-6 w-28 bg-slate-200 rounded mb-2" />
          <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-4 h-4 rounded bg-slate-200 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full bg-slate-200 rounded" />
                  <div className="h-2.5 w-1/2 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Planner Generation/Compiled Skeleton
export const PlannerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse text-left" id="planner-skeleton">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-8 w-32 bg-slate-200 rounded-lg" />
      </div>

      <div className="h-24 w-full bg-slate-200 rounded-xl" />

      <div className="space-y-4">
        <div className="h-4 w-1/3 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 rounded" />
        <div className="h-4 w-4/5 bg-slate-200 rounded" />
      </div>

      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="h-4 w-1/4 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-slate-200 rounded-xl" />
          <div className="h-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
