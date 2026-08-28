import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateProgressReport({ user, progress, sessions }) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BEC Progress Assistant", 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Basic English Course \u2014 Progress Report", 14, 21);

  doc.setTextColor(0, 0, 0);
  let y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Student: ${user?.name || "-"}`, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Email: ${user?.email || "-"}`, 14, y + 6);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y + 12);

  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Overview", 14, y);
  autoTable(doc, {
    startY: y + 3,
    body: [
      ["Average Score", `${progress.avg_overall} / 100`],
      ["Latest CEFR Level", progress.latest_cefr || "-"],
      ["Speaking Sessions", String(progress.speaking_count)],
      ["Writing Sessions", String(progress.writing_count)],
      ["Total Sessions", String(progress.total_sessions)],
    ],
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 } },
  });
  y = doc.lastAutoTable.finalY + 10;

  const skills = { ...(progress.speaking_scores || {}), ...(progress.writing_scores || {}) };
  if (Object.keys(skills).length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Skill Averages", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Skill", "Average"]],
      body: Object.entries(skills).map(([k, v]) => [k.replace(/_/g, " "), `${v} / 100`]),
      theme: "striped",
      headStyles: { fillColor: [9, 9, 11] },
      styles: { fontSize: 10, cellPadding: 2.5 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (progress.top_weaknesses?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Recurring Weaknesses", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Issue", "Times"]],
      body: progress.top_weaknesses.map((w) => [w.issue, String(w.count)]),
      theme: "striped",
      headStyles: { fillColor: [190, 18, 60] },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 1: { cellWidth: 22, halign: "center" } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (progress.latest_advice?.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Latest Strategic Advice", 14, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    progress.latest_advice.forEach((a, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${a}`, pageW - 28);
      if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    });
    y += 6;
  }

  if (sessions?.length) {
    if (y > 235) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Session History", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Date", "Type", "CEFR", "Score"]],
      body: sessions.map((s) => [
        new Date(s.created_at).toLocaleDateString(),
        s.mode,
        s.cefr_level || "-",
        String(s.overall_score),
      ]),
      theme: "grid",
      headStyles: { fillColor: [9, 9, 11] },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 1: { cellStyle: "capitalize" }, 3: { halign: "center" } },
    });
  }

  const safeName = (user?.name || "student").replace(/\s+/g, "_");
  doc.save(`BEC_Progress_${safeName}.pdf`);
}
