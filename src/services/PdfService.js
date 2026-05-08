import { jsPDF } from "jspdf";
import "jspdf-autotable"; // optional table support
import { CalculationService } from "../services/CalculationService";

/**
 * PdfService - 高階 PDF 與 CSV 產出工具
 *  • 中文字體 (NotoSansTC) 內嵌，避免 UTF-8 亂碼
 *  • 融合 CalculationService 取得 $W_{fert}$ (kg) 計算結果
 *  • PDF 頁尾自動加上數位簽章雜湊 (digital_signature)
 *  • exportTgapCsv 會同時回傳 batch impact 與 W_fert 資訊
 */
export const PdfService = {
  /**
   * 內嵌 Noto Sans TC 正體中文字型（Base64）
   * 取得方式: npx base64 -i path/to/NotoSansTC-Regular.ttf
   * 請於 production 替換成真實的 base64 字串以減少檔案大小
   */
  _loadChineseFont() {
    // 這裡僅示範，實際部署請使用完整的 base64 TTF
    const base64Font = ""; // ← INSERT_BASE64_TTF_HERE
    if (!base64Font) {
      console.warn("[PdfService] Chinese font base64 missing – PDF 可能出現亂碼");
      return;
    }
    // @ts-ignore – jsPDF 暴露此方法
    jsPDF.API.addFileToVFS("NotoSansTC-Regular.ttf", base64Font);
    // @ts-ignore
    jsPDF.API.addFont("NotoSansTC-Regular.ttf", "NotoSansTC", "Normal");
  },

  /**
   * 生成農機與肥料補助申請單 PDF
   * @param task  - DataAssuranceCard 送出的原始 task 物件
   * @param farmerProfile - LIFF 取得的使用者資料
   */
  async generateSubsidyForm(task, farmerProfile) {
    // 1️⃣ 先載入中文字體
    this._loadChineseFont();

    // 2️⃣ 取得 $W_{fert}$ (kg) – 使用 CalculationService
    const weightKg = CalculationService.calculateW_fert(
      task.usage_amount,
      task.original_unit
    );

    // 3️⃣ 建立 PDF
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFont("NotoSansTC", "Normal");
    pdf.setFontSize(12);

    // 4️⃣ 標題 & 基礎資訊
    pdf.text("農機與肥料補助申請單", 105, 20, { align: "center" });
    pdf.text(`申請單號：AG-SUB-${Date.now()}`, 20, 30);
    pdf.text(`申請人姓名：${farmerProfile.displayName}`, 20, 37);
    pdf.text(`農民 ID：${farmerProfile.userId}`, 20, 44);
    pdf.text(`產地座標：${task.coords}`, 20, 51);

    // 5️⃣ 施作明細表格
    const tableBody = [
      ["資材名稱", task.material_name || "-"],
      ["投入數量", `${task.usage_amount} ${task.original_unit}`],
      ["換算重量 (kg)", `${weightKg.toFixed(1)} kg`],
      ["預估補助金額", `NT$ ${(weightKg * 12).toLocaleString()}`],
    ];
    // @ts-ignore – autotable plugin
    pdf.autoTable({
      startY: 60,
      head: [["項目", "內容"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [0, 128, 0] },
      styles: { font: "NotoSansTC" },
    });

    // 6️⃣ 數位簽章 (Hash) – 放於頁尾左下角
    const sig = task.digital_signature || "未提供簽章";
    pdf.setFontSize(9);
    pdf.text(`數位簽章 (Hash): ${sig}`, 20, 280);

    // 7️⃣ 下載 PDF
    pdf.save(`Subsidy_Form_${farmerProfile.displayName}.pdf`);
  },

  /**
   * 匯出符合政府產銷履歷規格的 TAP Log CSV
   * 會同時計算 batch impact（總重量、減碳、補助金額）
   * @param tasks - 由 DataAssuranceCard onConfirm 所產生的 task 陣列
   */
  exportTgapCsv(tasks) {
    // 計算批次影響 – 使用 CalculationService
    const batch = CalculationService.calculateBatchImpact(tasks);
    const headers = [
      "日期",
      "作業項目",
      "資材名稱",
      "投入數量",
      "單位",
      "批號",
      "換算重量 (kg)",
      "減碳量 (kg CO2e)",
      "預估補助金額 (NTD)"
    ];
    const rows = tasks.map((task) => {
      const weight = CalculationService.calculateW_fert(
        task.data.usage_amount,
        task.data.original_unit
      );
      const carbon = (weight * 0.52).toFixed(2);
      const subsidy = Math.floor(weight * 12).toLocaleString();
      return [
        task.data.timestamp?.split("T")[0] || "",
        task.data.operation_item || "",
        task.data.material_name || "",
        task.data.usage_amount,
        task.data.original_unit,
        "CONTRACT-2024-001",
        weight.toFixed(1),
        carbon,
        subsidy,
      ];
    });

    // 加入 batch summary 為最後一筆（可自行調整位置信息）
    rows.push([
      "TOTAL",
      "",
      "",
      batch.recordCount,
      "",
      "",
      batch.totalWeight,
      batch.scope3Reduction,
      batch.estimatedSubsidy,
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.join(","))
      .join("\n");
    // 加上 UTF-8 BOM 防止 Excel 搞亂字元
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TGAP_Log_${Date.now()}.csv`;
    link.click();
  },
};

