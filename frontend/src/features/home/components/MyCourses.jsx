'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function MyCourses({ courses = [] }) {
  return (
    <section className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h2">My Courses</h2>
        <Link
          href="/courses"
          className="text-body text-primary hover:underline font-medium"
        >
          View Courses →
        </Link>
      </div>

      {/* ── Empty State ── */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 h-[677px] w-full bg-white rounded-[20px] border border-gray-200">
          <p className="text-gray-800 font-semibold text-base mb-1 pt-3">No courses available</p>
          <p className="text-gray-400 text-sm text-center max-w-[200px] pb-3">
            You haven't been enrolled in any courses yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-6 h-[677px] flex-1 w-full">
          {courses.slice(0, 4).map((course) => (
            <Link
              key={course.id}
              href={`/courses/${(course.category || 'courses').toLowerCase().replace(/\s+/g, '-')}/${course.documentId || course.id}`}
              className="w-full"
            >
              <Card className="w-full min-w-0 p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 bg-white rounded-[20px] h-[140px] flex flex-col min-h-0 overflow-visible justify-center items-start gap-4 self-stretch">
                <div className="flex items-center gap-4 flex-1 min-h-0 min-w-0 w-full">
                  {/* Course Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full block object-cover object-center"
                    />
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-start overflow-visible pt-0.5">
                    <h3 className="text-h3 font-semibold text-gray-900 truncate leading-normal">
                      {course.title}
                    </h3>
                    <p className="text-small text-muted-foreground mb-2">
                      {Math.min(course.completedLessons, course.totalLessons)} of {course.totalLessons} modules
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-small font-semibold text-gray-900 shrink-0">
                        {Math.min(100, course.progress)}%
                      </span>
                    </div>

                    {course.deadline ? (
                      <p className="text-small text-muted-foreground mt-1.5">
                        Due {new Date(course.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
