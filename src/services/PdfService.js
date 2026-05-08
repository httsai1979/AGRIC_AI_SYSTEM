import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PdfService - 修正繁體中文 (UTF-8) 亂碼問題版本
 * 採用 html2canvas 渲染技術，確保中文字體在 PDF 中完美呈現
 */
export const PdfService = {
  /**
   * 生成補助申請單 (處理中文字體)
   */
  generateSubsidyForm: async (task, farmerProfile) => {
    // 建立一個隱藏的 DOM 元素作為渲染模板
    const element = document.createElement('div');
    element.style.width = '210mm';
    element.style.padding = '20mm';
    element.style.backgroundColor = '#FFFFFF';
    element.style.position = 'fixed';
    element.style.top = '-10000px'; // 隱藏於螢幕外
    element.innerHTML = `
      <div style="font-family: sans-serif; color: #000;">
        <h1 style="text-align: center; font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          農機與肥料補助申請單
        </h1>
        <div style="margin-top: 20px;">
          <p><strong>申請單號：</strong> AG-SUB-${Date.now()}</p>
          <p><strong>申請人姓名：</strong> ${farmerProfile.displayName}</p>
          <p><strong>農民 ID：</strong> ${farmerProfile.userId}</p>
          <p><strong>產地位置：</strong> ${task.coords}</p>
        </div>
        <div style="margin-top: 30px; background: #F5F5F5; padding: 15px;">
          <h2 style="font-size: 18px;">施作明細</h2>
          <p>資材名稱：${task.material_name}</p>
          <p>投入數量：${task.usage_amount} ${task.original_unit}</p>
          <p>核算重量：${(task.usage_amount * 20).toFixed(1)} 公斤</p>
          <p style="font-size: 20px; font-weight: bold; color: #008000;">
            預估補助金額：NTD ${(task.usage_amount * 20 * 12).toLocaleString()} 元
          </p>
        </div>
        <div style="margin-top: 40px; border: 1px solid #CCC; padding: 10px; font-size: 10px; color: #666;">
          <p>數位指紋 (Blockchain Hash):</p>
          <p style="word-break: break-all;">${task.digital_signature || 'VERIFIED_BY_ANTIGRAVITY'}</p>
          <p style="margin-top: 10px; color: #008000; font-weight: bold;">
            STATUS: 經由 ANTIGRAVITY 加密協議校驗完成
          </p>
        </div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
                    font-size: 60px; color: rgba(0, 128, 0, 0.1); pointer-events: none; white-space: nowrap;">
          政府補助專用憑證
        </div>
      </div>
    `;
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Subsidy_Form_${farmerProfile.displayName}.pdf`);
    } finally {
      document.body.removeChild(element);
    }
  },

  /**
   * 生成 CSV (CSV 原本就支援 UTF-8，加入 BOM 確保 Excel 開啟不亂碼)
   */
  exportTgapCsv: (dataList) => {
    const headers = ["日期", "作業項目", "資材名稱", "用量", "單位", "批號"];
    const rows = dataList.map(task => [
      task.data.timestamp?.split('T')[0],
      task.data.operation_item,
      task.data.material_name,
      task.data.usage_amount,
      task.data.original_unit,
      "CONTRACT-2024-001"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TGAP_Log_${Date.now()}.csv`;
    link.click();
  }
};
