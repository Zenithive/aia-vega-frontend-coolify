import React from "react";
import { Clock, AlarmClock, ListChecks, Award, Trophy } from "lucide-react";

/**
 * Compact statistics card: course completion as a progress bar, the other figures as small tiles
 * in a 2-column grid, so the card leaves room for the module list in the right column.
 */
export default function CourseStats({ course, progressPercentage = 0, quizScore, totalModuleTimeMin = 0, moduleStates = [] }) {
  if (!course) return null;

  // Per-module progress from the backend (online modules: content + quiz; offline: assessor's proof).
  const states = Array.isArray(moduleStates) ? moduleStates : [];
  const quizStates = states.filter((s) => s.has_quiz);

  const minPassingScore = course.minPassingScore ?? course.min_passing_score ?? 0;
  const percentage = Math.min(100, Math.max(0, Math.round(Number(progressPercentage) || 0)));

  const timeLabel = totalModuleTimeMin >= 60
    ? `${Math.floor(totalModuleTimeMin / 60)} hr${Math.floor(totalModuleTimeMin / 60) !== 1 ? 's' : ''}${totalModuleTimeMin % 60 > 0 ? ` ${totalModuleTimeMin % 60} mins` : ''}`
    : `${totalModuleTimeMin} mins`;

  const tiles = [
    { icon: Clock, iconBg: 'bg-success', label: 'Time', value: timeLabel },
    { icon: AlarmClock, iconBg: 'bg-orange', label: 'Passing Score', value: `${minPassingScore}%` },
    states.length > 0 && {
      icon: ListChecks,
      iconBg: 'bg-sky-500',
      label: 'Modules',
      value: `${states.filter((s) => s.completed).length} / ${states.length}`,
    },
    // The latest test score is shown in this tile (not a tile of its own) to keep the card short.
    quizStates.length > 0 && {
      icon: Award,
      iconBg: 'bg-emerald-500',
      label: 'Quizzes Passed',
      value: `${quizStates.filter((s) => s.quiz?.passed).length} / ${quizStates.length}`,
      note: quizScore != null ? `last score ${quizScore}%` : null,
    },
    quizStates.length === 0 && quizScore != null && { icon: Trophy, iconBg: 'bg-primary', label: 'Test Score', value: `${quizScore}%` },
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xl font-bold text-gray-900">Statistics</p>
        <span className="text-sm font-semibold text-primary">{percentage}% completed</span>
      </div>
      <div
        className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course completed"
      >
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map(({ icon: Icon, iconBg, label, value, note }, idx) => (
          <div
            key={label}
            // An odd last tile spans both columns so the grid has no gap.
            className={`flex items-center gap-2.5 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 min-w-0 ${
              idx === tiles.length - 1 && tiles.length % 2 === 1 ? 'col-span-2' : ''
            }`}
          >
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${iconBg}`}>
              <Icon className="w-4 h-4 text-white" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-gray-500 truncate">{label}</span>
              <span className="text-sm font-semibold text-gray-900 truncate">
                {value}
                {note && <span className="text-xs font-normal text-gray-500"> · {note}</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
