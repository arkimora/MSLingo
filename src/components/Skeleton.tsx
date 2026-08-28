import type { FC, ReactNode } from 'react';

/** Shimmer skeleton block — use as a direct replacement for loaded content. */
export const Skeleton: FC<{ className?: string; children?: ReactNode }> = ({
  className = '',
  children,
}) => (
  <div className={`animate-pulse bg-ink-100 dark:bg-ink-700 rounded ${className}`}>
    {children}
  </div>
);

/** Inline shimmer line */
export const SkeletonLine: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-ink-100 dark:bg-ink-700 rounded h-4 ${className}`} />
);

/** Home page skeleton */
export function HomeSkeleton() {
  return (
    <div className="space-y-10">
      <section className="border-b pb-10 space-y-4">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-10 w-72 rounded" />
        <Skeleton className="h-5 w-96 rounded" />
        <div className="flex gap-3 mt-7">
          <Skeleton className="h-10 w-40 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-px bg-ink-100 dark:bg-ink-700 border rounded-xl overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-parchment-50 dark:bg-ink-800 p-6 space-y-3">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-10 w-12 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between pb-3">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-100 dark:bg-ink-700 border rounded-xl overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-parchment-50 dark:bg-ink-800 p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-6 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Dictionary skeleton */
export function DictionarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-6 space-y-3">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-9 w-40 rounded" />
        <Skeleton className="h-4 w-56 rounded" />
      </div>
      <Skeleton className="h-11 w-full rounded-md" />
      <div className="flex gap-6 pb-px">
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="space-y-8">
        {['А', 'Б', 'В'].map((letter) => (
          <section key={letter}>
            <Skeleton className="h-6 w-8 rounded mb-3" />
            <div className="divide-y border.rounded-md overflow-hidden">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-parchment-50 dark:bg-ink-800">
                  <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-48 rounded" />
                  </div>
                  <Skeleton className="h-4 w-8 rounded" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Learn / Review skeleton */
export function LearnSkeleton() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
      <div className="rounded-md border overflow-hidden">
        <div className="px-5 py-3 border-b space-y-2 text-center">
          <Skeleton className="h-3 w-16 rounded mx-auto" />
          <Skeleton className="h-5 w-48 rounded mx-auto" />
        </div>
        <Skeleton className="w-full aspect-video rounded-none" />
        <div className="p-4 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Fingerspelling / Numbers skeleton */
export function GridSkeleton({ count = 26 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-px bg-ink-100 dark:bg-ink-700 border rounded-md overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-parchment-50 dark:bg-ink-800 text-center">
          <Skeleton className="w-full aspect-square rounded-none" />
          <Skeleton className="w-6 h-5 rounded mx-auto my-2" />
        </div>
      ))}
    </div>
  );
}

/** Sign detail skeleton */
export function SignDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-10 w-48 rounded" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      <Skeleton className="w-full aspect-video rounded-md" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24 rounded" />
        {[0, 1, 2].map((i) => (
          <SkeletonLine key={i} className="w-full" />
        ))}
        <SkeletonLine className="w-3/4" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
