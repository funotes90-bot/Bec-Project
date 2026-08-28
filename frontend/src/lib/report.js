import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function buildLineChart(timeline) {
  if (!timeline || timeline.length === 0) return null;
  const W = 900, H = 340, padL = 50, padR = 20, padT = 24, padB = 40;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);

  const plotW = W - padL - padR, plotH = H - padT - padB;
  // grid + y labels 0..100
  ctx.strokeStyle = "#eeeeee"; ctx.fillStyle = "#9ca3af";
  ctx.font = "16px Helvetica"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let v = 0; v <= 100; v += 25) {
    const y = padT + plotH - (v / 100) * plotH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText(String(v), padL - 8, y);
  }
  const n = timeline.length;
  const x = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (score) => padT + plotH - (Math.max(0, Math.min(100, score)) / 100) * plotH;

  // line
  ctx.strokeStyle = "#09090b"; ctx.lineWidth = 3; ctx.beginPath();
  timeline.forEach((t, i) => { const px = x(i), py = y(t.score); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
  ctx.stroke();
  // dots
  ctx.fillStyle = "#09090b";
  timeline.forEach((t, i) => { ctx.beginPath(); ctx.arc(x(i), y(t.score), 5, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = "#9ca3af"; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("Session number \u2192", W / 2, H - 20);
  return canvas.toDataURL("image/png");
}

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

  const chart = buildLineChart(progress.timeline);
  if (chart) {
    if (y > 210) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Score Progression", 14, y);
    const imgW = pageW - 28, imgH = imgW * (340 / 900);
    doc.addImage(chart, "PNG", 14, y + 4, imgW, imgH);
    y = y + 4 + imgH + 10;
  }

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

export function generateClassReport({ teacher, students }) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BEC Progress Assistant", 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Basic English Course \u2014 Class Progress Report", 14, 21);

  doc.setTextColor(0, 0, 0);
  let y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Teacher: ${teacher?.name || "-"}`, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y + 6);
  doc.text(`Total students: ${students.length}`, 14, y + 12);

  const active = students.filter((s) => s.total_sessions > 0);
  const classAvg = active.length ? Math.round(active.reduce((a, s) => a + s.avg_overall, 0) / active.length) : 0;
  const totalSessions = students.reduce((a, s) => a + s.total_sessions, 0);
  doc.text(`Class average score: ${classAvg} / 100`, 14, y + 18);
  doc.text(`Total sessions completed: ${totalSessions}`, 14, y + 24);

  y += 34;
  autoTable(doc, {
    startY: y,
    head: [["Student", "Email", "Speaking", "Writing", "Total", "Avg", "CEFR", "Last Active"]],
    body: students.map((s) => [
      s.name,
      s.email,
      String(s.speaking_count),
      String(s.writing_count),
      String(s.total_sessions),
      String(s.avg_overall),
      s.latest_cefr || "-",
      s.last_active ? new Date(s.last_active).toLocaleDateString() : "-",
    ]),
    theme: "striped",
    headStyles: { fillColor: [9, 9, 11] },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" } },
  });

  doc.save(`BEC_Class_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
