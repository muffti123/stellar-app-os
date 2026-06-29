'use client';

import * as React from 'react';
import { Text } from '@/components/atoms/Text';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

export interface Milestone {
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'ongoing' | 'upcoming';
}

interface ProjectTimelineProps {
  milestones: Milestone[];
  className?: string;
}

export function ProjectTimeline({ milestones, className }: ProjectTimelineProps) {
  return (
    <div
      className={cn(
        'space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-stellar-blue/20 before:via-stellar-blue/50 before:to-stellar-blue/20',
        className
      )}
    >
      {milestones.map((milestone) => (
        <div
          key={`${milestone.title}-${milestone.date}`}
          className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${milestone.status === 'ongoing' ? 'is-active' : ''}`}
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-stellar-navy text-stellar-blue shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {milestone.status === 'completed' ? (
              <CheckCircle2 size={20} className="text-stellar-green" />
            ) : (
              <Circle
                size={20}
                className={
                  milestone.status === 'ongoing'
                    ? 'text-stellar-blue animate-pulse'
                    : 'text-muted-foreground'
                }
              />
            )}
          </div>

          {/* Content */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-stellar-blue/10 bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-stellar-blue">{milestone.title}</div>
              <time className="text-xs font-medium text-muted-foreground">{milestone.date}</time>
            </div>
            <Text variant="small" className="text-muted-foreground">
              {milestone.description}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}
