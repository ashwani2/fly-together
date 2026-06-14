/**
 * Shared markdown → PDF / DOCX export for generated SOPs.
 * A tiny block parser (headings, paragraphs, lists, blockquotes, rules) feeds
 * both exporters so the output stays consistent. The heavy `jspdf` / `docx`
 * libraries are imported lazily so they only load when an export is triggered.
 */

interface Inline {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

type Block =
  | { type: 'heading'; level: number; inlines: Inline[] }
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'bullet'; inlines: Inline[] }
  | { type: 'numbered'; index: number; inlines: Inline[] }
  | { type: 'quote'; inlines: Inline[] }
  | { type: 'hr' };

function tokenizeInline(text: string): Inline[] {
  const out: Inline[] = [];
  // links → keep just the label; bold/italic/inline-code → styled text.
  const pattern =
    /(\[([^\]]+)\]\((?:https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    if (m[1]) out.push({ text: m[2] });
    else if (m[3]) out.push({ text: m[4], bold: true });
    else if (m[5]) out.push({ text: m[6], italic: true });
    else if (m[7]) out.push({ text: m[8] });
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out.length ? out : [{ text }];
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { blocks.push({ type: 'hr' }); i++; continue; }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, inlines: tokenizeInline(heading[2]) });
      i++; continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      blocks.push({ type: 'quote', inlines: tokenizeInline(quote.join(' ')) });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        blocks.push({ type: 'bullet', inlines: tokenizeInline(lines[i].replace(/^\s*[-*+]\s+/, '')) });
        i++;
      }
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      let n = 1;
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        blocks.push({ type: 'numbered', index: n++, inlines: tokenizeInline(lines[i].replace(/^\s*\d+\.\s+/, '')) });
        i++;
      }
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])
    ) { para.push(lines[i]); i++; }
    blocks.push({ type: 'paragraph', inlines: tokenizeInline(para.join(' ')) });
  }
  return blocks;
}

const inlineText = (inlines: Inline[]) => inlines.map((p) => p.text).join('');

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------- PDF ----------------

export async function downloadSopPdf(content: string, filename: string) {
  const { jsPDF } = await import('jspdf');
  const blocks = parseBlocks(content);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const usable = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeLines = (
    text: string,
    opts: { size: number; style: 'normal' | 'bold' | 'italic'; indent?: number; after?: number },
  ) => {
    const indent = opts.indent ?? 0;
    const lineHeight = opts.size * 1.4;
    doc.setFont('helvetica', opts.style);
    doc.setFontSize(opts.size);
    const wrapped = doc.splitTextToSize(text, usable - indent);
    for (const ln of wrapped) {
      ensureSpace(lineHeight);
      doc.text(ln, margin + indent, y);
      y += lineHeight;
    }
    y += opts.after ?? 0;
  };

  const headingSizes = [20, 17, 15, 13, 12, 11];

  for (const b of blocks) {
    switch (b.type) {
      case 'hr':
        ensureSpace(12);
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 14;
        break;
      case 'heading':
        writeLines(inlineText(b.inlines), { size: headingSizes[b.level - 1], style: 'bold', after: 6 });
        break;
      case 'bullet':
        writeLines(`•  ${inlineText(b.inlines)}`, { size: 11, style: 'normal', indent: 14, after: 2 });
        break;
      case 'numbered':
        writeLines(`${b.index}.  ${inlineText(b.inlines)}`, { size: 11, style: 'normal', indent: 14, after: 2 });
        break;
      case 'quote':
        writeLines(inlineText(b.inlines), { size: 11, style: 'italic', indent: 14, after: 6 });
        break;
      default:
        writeLines(inlineText(b.inlines), { size: 11, style: 'normal', after: 8 });
    }
  }

  doc.save(filename);
}

// ---------------- DOCX ----------------

export async function downloadSopDocx(content: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType } = await import('docx');

  const HEADING_LEVELS = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ];

  const toRuns = (inlines: Inline[], extra?: { italics?: boolean }) =>
    inlines.map((p) => new TextRun({ text: p.text, bold: p.bold, italics: p.italic || extra?.italics }));

  const blocks = parseBlocks(content);
  const children: InstanceType<typeof Paragraph>[] = [];

  for (const b of blocks) {
    switch (b.type) {
      case 'hr':
        children.push(new Paragraph({
          border: { bottom: { color: 'CCCCCC', space: 1, style: BorderStyle.SINGLE, size: 6 } },
        }));
        break;
      case 'heading':
        children.push(new Paragraph({ heading: HEADING_LEVELS[b.level - 1], children: toRuns(b.inlines) }));
        break;
      case 'bullet':
        children.push(new Paragraph({ bullet: { level: 0 }, children: toRuns(b.inlines) }));
        break;
      case 'numbered':
        children.push(new Paragraph({
          children: [new TextRun({ text: `${b.index}. ` }), ...toRuns(b.inlines)],
          spacing: { after: 80 },
        }));
        break;
      case 'quote':
        children.push(new Paragraph({
          children: toRuns(b.inlines, { italics: true }),
          indent: { left: 360 },
          spacing: { after: 120 },
        }));
        break;
      default:
        children.push(new Paragraph({
          children: toRuns(b.inlines),
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
        }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, filename);
}
