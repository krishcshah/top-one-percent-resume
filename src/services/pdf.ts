import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source using Vite's ?url import to avoid CDN CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PdfTextSpan {
  page: number;
  str: string;
  transform: number[];
  width: number;
  height: number;
  startIndex: number;
  endIndex: number;
}

export interface PdfDocumentData {
  text: string;
  spans: PdfTextSpan[];
  numPages: number;
}

export async function extractPDFData(file: File): Promise<PdfDocumentData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        const spans: PdfTextSpan[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];
          
          let lastY = -1;
          
          for (const item of items) {
            let prefix = '';
            if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 4) {
              prefix = '\n';
            } else if (lastY !== -1 && item.str.trim() !== '') {
              prefix = ' ';
            }
            
            fullText += prefix;
            
            const startIndex = fullText.length;
            fullText += item.str;
            const endIndex = fullText.length;
            
            spans.push({
              page: i,
              str: item.str,
              transform: item.transform,
              width: item.width,
              height: item.height,
              startIndex,
              endIndex
            });
            
            lastY = item.transform[5];
          }
          fullText += '\n\n';
        }

        resolve({ text: fullText, spans, numPages: pdf.numPages });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
