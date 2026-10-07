import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  PlayCircle,
  CheckCircle2,
  MonitorPlay,
  ChevronUp,
  ChevronDown,
  SquareCheckBig,
  ChevronRight,
  Lock,
} from "lucide-react";

function ModuleCircle({ moduleNumber, moduleStatus, isSelected }) {
  if (isSelected) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-primary/20 text-primary">
        {moduleNumber}
      </span>
    );
  }

  if (moduleStatus === "completed") {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-success">
        <CheckCircle2 className="w-5 h-5 text-white" />
      </span>
    );
  }

  if (moduleStatus === "locked") {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-gray-200">
        <Lock className="w-5 h-5 text-gray-500" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-white border-2 border-primary text-primary">
      {moduleNumber}
    </span>
  );
}

export default function CourseContentList({ contents, current, onSelect, courseId, category, course, selectedLanguage, onMarkAsRead }) {
  // Use language-filtered contents when provided so sidebar shows only selected language; else full list
  const modules =
    Array.isArray(contents)
      ? contents
      : Array.isArray(course?.modulesList)
        ? course.modulesList
        : Array.isArray(course?.modules)
          ? course.modules
          : [];
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const currentModuleId = params.moduleId ?? searchParams.get('moduleId');

  const defaultModuleId = modules?.[0]?.moduleId || modules?.[0]?.id;
  const activeModuleId = currentModuleId ?? current ?? defaultModuleId;
  const [openModuleId, setOpenModuleId] = useState(activeModuleId || defaultModuleId);

  useEffect(() => {
    if (activeModuleId) {
      setOpenModuleId(activeModuleId);
    } else if (defaultModuleId && !currentModuleId && course?.documentId) {
      const url = `/courses/${category}/${course.documentId}`;
      router.replace(url);
    }
    // router is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleId, defaultModuleId, category, courseId, params.id, currentModuleId, course]);

  if (!modules.length) return <div className="text-gray-500 italic">No modules found for this course.</div>;

  const langQuery = selectedLanguage ? `?lang=${encodeURIComponent(selectedLanguage)}` : "";

  const handleModuleClick = (module) => {
    if (!course?.documentId) return;
    const modId = module.moduleId || module.id;
    router.push(`/courses/${category}/${course.documentId}/${modId}${langQuery}`);
  };

  const handleNextLecture = (nextModule) => {
    if (!nextModule || !course?.documentId) return;
    const modId = nextModule.moduleId || nextModule.id;
    router.push(`/courses/${category}/${course.documentId}/${modId}${langQuery}`);
  };

  const allCompleted = modules.length > 0 && modules.every(m => m.mark_as_read);
  const firstUnreadIdx = modules.findIndex(m => !m.mark_as_read);

  return (
    <div>
      <h3 className="mt-10 mb-6 text-2xl font-bold text-gray-900">
        Course Contents
      </h3>
      <div className="flex flex-col gap-3">
        {modules.map((module, idx) => {
          const modId = module.moduleId || module.id;
          const isOpen = String(openModuleId) === String(modId);
          const isSelected = String(activeModuleId) === String(modId);
          const isRead = module.mark_as_read;
          const nextModule = modules[idx + 1] || null;
          const isLocked = !allCompleted && firstUnreadIdx >= 0 && idx > firstUnreadIdx;
          let displayStatus = isRead ? "completed" : isLocked ? "locked" : "active";
          // "Mark as Read" enabled for any expanded, unread, unlocked module
          const markEnabled = isOpen && !isRead && !isLocked;
          // "Next Lecture" is enabled only after this module is marked as read
          const nextEnabled = isRead && !!nextModule;
          const handleClick = () => { if (isLocked) return; handleModuleClick(module); };
          return (
            <div
              key={modId}
              className="bg-white rounded-2xl shadow overflow-hidden"
            >
              {/* Module Header */}
              <button
                onClick={handleClick}
                className={`flex items-center gap-3 w-full text-left p-4 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <ModuleCircle
                  moduleNumber={idx + 1}
                  moduleStatus={displayStatus}
                  isSelected={isSelected}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-gray-900 truncate font-semibold">
                    {module.moduleTitle || 'Untitled Module'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {module.moduleType || 'Unknown'}
                    {typeof module.moduleDuration === 'number' && module.moduleDuration > 0
                      ? ` • ${module.moduleDuration} min`
                      : ''}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {isOpen && (
                <>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 rounded-b-2xl px-4 pb-4">
                    {/* Mark as Read */}
                    <button
                      onClick={() => markEnabled && onMarkAsRead(modId)}
                      disabled={!markEnabled}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl h-10 text-sm font-semibold transition
                        ${isRead
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          : markEnabled
                            ? 'bg-white border border-primary text-primary hover:bg-gray-50 cursor-pointer'
                            : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {isRead ? 'Marked as Read' : 'Mark as Read'}
                      <SquareCheckBig className="w-4 h-4" />
                    </button>

                    {/* Next Lecture — enabled only after marking as read */}
                    <button
                      onClick={() => nextEnabled && handleNextLecture(nextModule)}
                      disabled={!nextEnabled}
                      className={`flex-1 flex items-center justify-center h-10 gap-2 p-3 rounded-xl text-sm font-semibold transition
                        ${nextEnabled
                          ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                          : 'bg-primary/40 text-white cursor-not-allowed'
                        }`}
                    >
                      {nextModule ? 'Next Lecture' : 'Last Module'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
