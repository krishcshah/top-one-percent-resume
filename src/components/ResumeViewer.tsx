import React, { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PdfDocumentData } from '../services/pdf';
import { Highlight } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  file: File;
  pdfData: PdfDocumentData;
  highlights: Highlight[];
}

export function ResumeViewer({ file, pdfData, highlights }: Props) {
  const [hoveredHighlight, setHoveredHighlight] = useState<Highlight | null>(null);

  // Memoize the file object so react-pdf doesn't re-render constantly
  const pdfFile = useMemo(() => file, [file]);

  return (
    <div className="relative flex flex-col md:flex-row gap-8">
      {/* Document Viewer */}
      <div className="flex-1 bg-slate-100 rounded-2xl shadow-inner p-8 overflow-y-auto max-h-[800px] flex flex-col items-center gap-8">
        <Document
          file={pdfFile}
          loading={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          }
        >
          {Array.from({ length: pdfData.numPages }, (_, i) => i + 1).map((pageNum) => (
            <PdfPageOverlay
              key={pageNum}
              pageNum={pageNum}
              pdfData={pdfData}
              highlights={highlights}
              onHoverHighlight={setHoveredHighlight}
            />
          ))}
        </Document>
      </div>

      {/* Floating Tooltip Panel (Desktop) / Fixed Panel (Mobile) */}
      <div className="w-full md:w-80 shrink-0">
        <div className="sticky top-8">
          <AnimatePresence mode="wait">
            {hoveredHighlight ? (
              <motion.div
                key="tooltip"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
              >
                <div
                  className={`p-4 border-b flex items-center gap-3 ${
                    hoveredHighlight.color === 'green'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : hoveredHighlight.color === 'yellow'
                      ? 'bg-amber-50 border-amber-100 text-amber-800'
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}
                >
                  {hoveredHighlight.color === 'green' && <CheckCircle2 className="w-5 h-5" />}
                  {hoveredHighlight.color === 'yellow' && <Info className="w-5 h-5" />}
                  {hoveredHighlight.color === 'red' && <AlertTriangle className="w-5 h-5" />}
                  <h4 className="font-semibold text-sm uppercase tracking-wider">
                    {hoveredHighlight.color === 'green'
                      ? 'Strong Point'
                      : hoveredHighlight.color === 'yellow'
                      ? 'Needs Polish'
                      : 'Critical Fix'}
                  </h4>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Before
                    </div>
                    <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 line-through decoration-slate-400 opacity-70">
                      {hoveredHighlight.before}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      After
                    </div>
                    <div className="text-sm text-slate-900 bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-medium">
                      {hoveredHighlight.after}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Why it matters
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {hoveredHighlight.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-8 text-center text-slate-500 flex flex-col items-center justify-center h-64"
              >
                <Info className="w-8 h-8 mb-3 text-slate-400" />
                <p className="text-sm">
                  Hover over the highlighted text in your resume to see detailed feedback and suggestions.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const PdfPageOverlay: React.FC<{
  pageNum: number;
  pdfData: PdfDocumentData;
  highlights: Highlight[];
  onHoverHighlight: (h: Highlight | null) => void;
}> = ({
  pageNum,
  pdfData,
  highlights,
  onHoverHighlight,
}) => {
  const [pageDetails, setPageDetails] = useState<{ width: number; height: number; viewport: any } | null>(null);

  const onPageLoadSuccess = (page: any) => {
    // We get the unscaled viewport to know the original PDF dimensions
    const viewport = page.getViewport({ scale: 1.0 });
    setPageDetails({
      width: viewport.width,
      height: viewport.height,
      viewport: viewport,
    });
  };

  const overlays: React.ReactNode[] = [];

  if (pageDetails) {
    const { viewport } = pageDetails;
    
    highlights.forEach((highlight, hIndex) => {
      let startIndex = 0;
      let index;

      // Find all occurrences of the highlight text in the full text
      while ((index = pdfData.text.indexOf(highlight.textToHighlight, startIndex)) > -1) {
        const matchStart = index;
        const matchEnd = index + highlight.textToHighlight.length;

        // Find spans that overlap with this match on this specific page
        const overlappingSpans = pdfData.spans.filter(
          (span) =>
            span.page === pageNum &&
            span.startIndex < matchEnd &&
            span.endIndex > matchStart
        );

        overlappingSpans.forEach((span, sIndex) => {
          // Calculate robust bounding box using transformation matrices
          const m1 = span.transform;
          const m2 = viewport.transform;

          // Combine text transform and viewport transform
          const M = [
            m1[0] * m2[0] + m1[1] * m2[2],
            m1[0] * m2[1] + m1[1] * m2[3],
            m1[2] * m2[0] + m1[3] * m2[2],
            m1[2] * m2[1] + m1[3] * m2[3],
            m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
            m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
          ];

          const scaleX = Math.hypot(m1[0], m1[1]);

          // Text dimensions in text space
          const W_text = span.width / (scaleX || 1);
          // PDF baseline is at 0. Ascent is typically ~0.8, descent ~0.2.
          const H_text_ascent = 0.8;
          const H_text_descent = -0.2;

          // 4 corners of the text box in canvas space
          const p1 = [M[4] + H_text_descent * M[2], M[5] + H_text_descent * M[3]]; // Bottom-left
          const p2 = [
            W_text * M[0] + M[4] + H_text_descent * M[2],
            W_text * M[1] + M[5] + H_text_descent * M[3],
          ]; // Bottom-right
          const p3 = [M[4] + H_text_ascent * M[2], M[5] + H_text_ascent * M[3]]; // Top-left
          const p4 = [
            W_text * M[0] + M[4] + H_text_ascent * M[2],
            W_text * M[1] + M[5] + H_text_ascent * M[3],
          ]; // Top-right

          const minX = Math.min(p1[0], p2[0], p3[0], p4[0]);
          const maxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
          const minY = Math.min(p1[1], p2[1], p3[1], p4[1]);
          const maxY = Math.max(p1[1], p2[1], p3[1], p4[1]);

          const vpX = minX;
          const vpY = minY;
          const vpWidth = maxX - minX;
          const vpHeight = maxY - minY;

          // Convert to percentages so it scales perfectly with react-pdf's responsive sizing
          const leftPct = (vpX / viewport.width) * 100;
          const topPct = (vpY / viewport.height) * 100;
          const widthPct = (vpWidth / viewport.width) * 100;
          const heightPct = (vpHeight / viewport.height) * 100;

          let colorClass = 'bg-emerald-400/40 border-emerald-500';
          if (highlight.color === 'yellow') colorClass = 'bg-amber-400/40 border-amber-500';
          if (highlight.color === 'red') colorClass = 'bg-rose-400/40 border-rose-500';

          overlays.push(
            <div
              key={`h-${hIndex}-m-${matchStart}-s-${sIndex}`}
              className={`absolute mix-blend-multiply cursor-pointer border-b-2 hover:opacity-80 transition-opacity z-10 ${colorClass}`}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
              }}
              onMouseEnter={() => onHoverHighlight(highlight)}
              onMouseLeave={() => onHoverHighlight(null)}
            />
          );
        });

        startIndex = index + 1;
      }
    });
  }

  return (
    <div className="relative shadow-xl bg-white shrink-0 w-full max-w-4xl">
      <Page
        pageNumber={pageNum}
        onLoadSuccess={onPageLoadSuccess}
        width={800} // Target a readable width, react-pdf handles the internal scaling
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="w-full"
      />
      {overlays}
    </div>
  );
}
