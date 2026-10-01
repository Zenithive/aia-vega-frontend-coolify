import React, { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { FolderOpen, Clock, SquareCheckBig, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";
import openPdfInNewTab from "../utils/openPdfInNewTab";

export default function CourseTextOrPdf({ course, category, selectedModule, filteredModules, onBack, onMarkAsRead, onNextLecture, isRead, isLastModule = false, onGoToAssessment, onPdfOpenNewTab }) {
  if (!course) return null;

  const contents = Array.isArray(filteredModules) && filteredModules.length > 0
    ? filteredModules
    : Array.isArray(course.modulesList) ? course.modulesList : [];
  const contentToDisplay = selectedModule?.text_content || course.text_content || "";
  const isPdfModule = String(selectedModule?.moduleType || '').toLowerCase() === 'pdf';
  const markEnabled = !isRead;
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);

  // Reset zoom when module changes
  useEffect(() => {
    setPdfZoom(100);
  }, [selectedModule?.moduleId, selectedModule?.id]);

  const handleOpenInNewTab = () => {
    if (openPdfInNewTab(pdfBlobUrl, selectedModule?.moduleTitle)) {
      onPdfOpenNewTab && onPdfOpenNewTab();
    }
  };

  useEffect(() => {
    const sourceUrl = selectedModule?.pdf_file?.url;
    if (!isPdfModule || !sourceUrl) {
      setPdfBlobUrl('');
      setPdfLoading(false);
      return;
    }

    let active = true;
    let nextBlobUrl = '';
    const controller = new AbortController();

    const loadPdf = async () => {
      setPdfLoading(true);
      try {
        const headers = {};
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
          if (token) headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(sourceUrl, { headers, signal: controller.signal });
        if (!response.ok) throw new Error(`PDF request failed: ${response.status}`);
        const blob = await response.blob();
        nextBlobUrl = URL.createObjectURL(blob);
        if (active) setPdfBlobUrl(nextBlobUrl);
      } catch {
        if (active) setPdfBlobUrl('');
      } finally {
        if (active) setPdfLoading(false);
      }
    };

    loadPdf();

    return () => {
      active = false;
      controller.abort();
      if (nextBlobUrl) URL.revokeObjectURL(nextBlobUrl);
    };
  }, [isPdfModule, selectedModule?.pdf_file?.url]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-xl pt-xl pb-0">
        <div className="flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 mb-4 text-primary hover:text-primary/80 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Preview</span>
            </button>
          )}
          <PageHeader
            title={selectedModule?.moduleTitle || course.title}
            breadcrumbs={[
              { label: "Courses", href: "/courses" },
              {
                label: category
                  ? category
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                  : "",
                href: `/courses/${category}`,
              },
              { label: course.title, onClick: onBack },
              ...(selectedModule ? [{ label: selectedModule.moduleTitle }] : []),
            ]}
            showBreadcrumbSeparator
            containerClassName="!pt-0 !pb-0 !px-0"
          />
        </div>
        {/* Action Buttons */}
        <div className="flex gap-4 mt-4 lg:mt-0">
          <button
            onClick={() => markEnabled && onMarkAsRead && onMarkAsRead()}
            disabled={!markEnabled}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition
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
          {/* isLastModule: this module has a quiz still to pass — the button opens the module quiz */}
          {isLastModule ? (
            <button
              onClick={() => isRead && onGoToAssessment && onGoToAssessment()}
              disabled={!isRead}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition
                ${isRead
                  ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                  : 'bg-primary/40 text-white cursor-not-allowed'
                }`}
            >
              Take Module Quiz
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => isRead && onNextLecture && onNextLecture()}
              disabled={!isRead}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition
                ${isRead
                  ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                  : 'bg-primary/40 text-white cursor-not-allowed'
                }`}
            >
              Next Lecture
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-6 mb-2 px-xl mt-4">
        <div className="flex items-center gap-2 text-gray-700">
          <FolderOpen className="w-5 h-5 text-primary" />
          <span className="text-sm">
            {contents.length} {contents.length === 1 ? "section" : "sections"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-sm">{selectedModule?.moduleDuration || "Duration"} mins</span>
        </div>
      </div>

      
      <div className="mx-auto px-xl py-8">
        <div className="space-y-6">
          {isPdfModule ? (
            selectedModule?.pdf_file?.url ? (
              <>
                {pdfLoading ? (
                  <div className="w-full h-[90vh] rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center text-gray-500">
                    Loading PDF preview...
                  </div>
                ) : pdfBlobUrl ? (
                  <div className="w-full h-[90vh] rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
                    {/* Custom read-only toolbar: title + zoom + open in new tab */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-700 truncate max-w-[45%]">
                        {selectedModule?.moduleTitle || 'PDF'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPdfZoom(z => Math.max(25, z - 25))}
                          disabled={pdfZoom <= 25}
                          className="w-8 h-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-500 min-w-[40px] text-center select-none">{pdfZoom}%</span>
                        <button
                          onClick={() => setPdfZoom(z => Math.min(500, z + 25))}
                          disabled={pdfZoom >= 500}
                          className="w-8 h-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-gray-300 mx-1" />
                        <button
                          onClick={handleOpenInNewTab}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition
                bg-primary text-white hover:bg-primary/90 cursor-pointer"
                          title="Open PDF In New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open In New Tab
                        </button>
                      </div>
                    </div>
                    <iframe
                      key={pdfZoom}
                      src={`${pdfBlobUrl}#toolbar=0&navpanes=0&zoom=${pdfZoom}`}
                      title={selectedModule?.moduleTitle || 'PDF'}
                      className="w-full flex-1"
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
                    Inline PDF preview is not available in this browser. Please open it in a new tab.
                  </div>
                )}

              </>
            ) : (
              <div className="text-lg text-gray-700 leading-relaxed">No PDF file available for this module.</div>
            )
          ) : (
            <div className="text-lg text-gray-700 leading-relaxed">
              {contentToDisplay ? (
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{ __html: contentToDisplay }}
                />
              ) : (
                "No content available for this reading module."
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
