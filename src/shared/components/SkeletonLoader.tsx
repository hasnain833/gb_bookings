import React from 'react';


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
