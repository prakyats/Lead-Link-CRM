import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse rounded-md bg-muted/20 ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)',
        backgroundSize: '200% 100%',
        ...style
      }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="crm-card h-32 flex flex-col justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 crm-card h-[400px]">
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <div className="crm-card h-48">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="crm-card h-64">
            <Skeleton className="h-6 w-32 mb-8" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-2.5 h-2.5 rounded-full mt-1" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="crm-card !p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/5">
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="p-6 border-b border-border flex items-center gap-4">
            <div className="grid grid-cols-6 gap-4 w-full items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="flex justify-end">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-6 overflow-hidden h-[calc(100vh-200px)] animate-in fade-in duration-500">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-80 flex-shrink-0 flex flex-col bg-muted/5 rounded-2xl border border-border/50">
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="p-3 space-y-3 overflow-hidden">
            {[1, 2, 3].map((j) => (
              <div key={j} className="crm-card !p-4 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-6 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="crm-card p-6 flex items-start gap-6">
          <Skeleton className="w-7 h-7 rounded-full mt-1 shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="flex gap-2 shrink-0">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-4 border-t border-border/50">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="ml-auto h-6 w-32 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="crm-card h-40 bg-[#1A2332]/50 border-white/5">
          <Skeleton className="h-3 w-32 mb-4" />
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="crm-card h-40 bg-[#1A2332]/50 border-white/5">
          <Skeleton className="h-3 w-32 mb-4" />
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="crm-card h-[400px] bg-[#1A2332]/50 border-white/5">
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="h-[250px] flex items-end justify-between gap-4 px-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="w-12 rounded-t-lg" style={{ height: `${20 + i * 12}%` }} />
            ))}
          </div>
        </div>
        <div className="crm-card h-[400px] bg-[#1A2332]/50 border-white/5 flex flex-col items-center justify-center relative">
          <Skeleton className="h-6 w-48 absolute top-8 left-8" />
          <Skeleton className="w-48 h-48 rounded-full border-8 border-white/5" />
          <div className="mt-8 flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
        </div>
      </div>
      <div className="crm-card h-64 bg-[#1A2332]/50 border-white/5">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between border-t border-white/5 pt-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
