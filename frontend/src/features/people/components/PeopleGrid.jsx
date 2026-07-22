"use client";

import SurfaceCard from '@/components/common/SurfaceCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PeopleGrid({ pagedPeople, selectedEmployeeId, handleSelect, isCompact }) {
  return (
    <div
      className={cn(
        'grid w-full gap-6',
        isCompact
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(410px,1fr))]'
      )}
    >
      {pagedPeople.map((person) => (
        <SurfaceCard
          key={person.id}
          id={`person-card-${person.id}`}
          data-person-id={String(person.id)}
          data-person-emp-id={String(person.emp_id || '')}
          className={cn(
            'w-full border border-gray-200 bg-white p-4 h-[236px] flex flex-col justify-between transition-all duration-200 hover:shadow-md',
            selectedEmployeeId === person.id ? 'ring-2 ring-primary' : ''
          )}
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              {person.avatar ? (
                <img src={person.avatar} alt={person.name} className={cn('rounded-full object-cover', isCompact ? 'h-12 w-12' : 'h-12 w-12')} />
              ) : (
                <div
                  className={cn(
                    'rounded-full bg-primary text-white flex items-center justify-center font-semibold',
                    isCompact ? 'h-12 w-12' : 'h-12 w-12'
                  )}
                >
                  {(person.avatarInitial || person.name?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-h3 text-gray-name-title truncate">{person.name}</h3>
                {person.isNew ? (
                  <Badge className="bg-[#F4E2FF] px-2 py-0.5 text-[10px] text-primary-purple rounded-md">New Joinee</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-small text-primary-purple font-medium">{person.title}</p>
            </div>
          </div>
          <div className="space-y-3 text-body text-muted-foreground">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-gray-text" />
              <span className="break-words text-gray-text">
                {(person.company || '').trim().toLowerCase().includes('vega')
                  ? [person.business_vertical, person.department]
                      .filter(Boolean)
                      .join(' - ')
                  : person.department}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-text" />
              <span className="truncate text-gray-text">{person.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-text" />
              <span className="truncate text-gray-text">
                {person.joinDate
                  ? `Joined ${new Date(person.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : '—'}
              </span>
            </div>
          </div>
          <Button
            className="h-10 w-full rounded-full bg-primary text-white"
            size="default"
            style={{ boxShadow: '0px 4px 10px #0000004D' }}
            onClick={() => handleSelect(person.id)}
          >
            View Details
          </Button>
        </SurfaceCard>
      ))}
    </div>
  );
}
