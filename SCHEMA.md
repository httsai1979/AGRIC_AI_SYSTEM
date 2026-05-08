這是一份為您將《阿古力系統開發交接手冊》中的數據字典，轉化為無伺服器（Serverless）架構後端實體的 Google Sheets 資料表架構（Database Schema）。
為配合 Google Apps Script (GAS) 的自動化寫入與 VLOOKUP 關聯運算 1，本系統將規劃為 4 個核心分頁（Tabs）。以下是每個分頁的具體欄位（A 欄至 Z 欄）定義與設計邏輯：
分頁一：Raw_Inputs（農民日常日誌與原始資料）
用途：作為 LINE Bot 與 Gemini API 解析後的資料落地點。每次農民傳送照片或語音，GAS 皆會呼叫 Sheet.appendRow() 將解析後的 JSON 寫入此表 1。此表對應規格書中的 Farmer_Daily_Log 2, 3。
A 欄：log_id (系統流水號) - GAS 自動生成的唯一識別碼。
B 欄：log_date (紀錄時間) - LINE 訊息傳送之精準時間戳記，作為會計師確信之稽核軌跡（Audit Trail） 2, 3。
C 欄：farmer_uid (農民帳號 ID) - 綁定 LINE 使用者，用於後續推播通知。
D 欄：batch_number (批號) - 綁定當季契作合約，確保 ESG 數據歸屬於特定企業訂單 2, 3。
E 欄：operation_item (作業項目) - 透過 NLP 語意判斷農民作業（如：施肥、除草、採收），對接 TGAP 規範 3, 4。
F 欄：material_name (資材名稱) - 透過 OCR 辨識肥料袋或農藥空瓶之名稱 3, 4。
G 欄：usage_amount (使用數量/金額) - 透過 NLP 從語音擷取的原始數字（如：5 包、500 塊） 4。
H 欄：original_unit (原始單位) - 提取出的在地單位（如：包、桶、元、分地） 5。
I 欄：receipt_photo_url (單據影像網址) - 農機發票、電費單或肥料收據之 Google Drive 連結，作為財務單據實證 2。
J 欄：field_photo_url (田間影像網址) - 打田或採收之實景照片，防漂綠之作業實證 2。
K 欄：voice_text_raw (原始語音轉文字) - 完整記錄農民口述（如：「用兩包肥、三個工」），證明數據非系統捏造 2。
L 欄：coordinates (產地經緯度) - 照片 EXIF 提取之座標，對接 TNFD 之「Locate（定位）」要求 3。
M 欄：temporary_workers_count (臨時工數量) - NLP 擷取的非員工工作者數量，對接 GRI 2-8 社會面指標 3, 6。
N 欄：water_withdrawal_m3 (取水量) - OCR 讀取電費單度數後，透過抽水馬達轉換係數推算之水量，對接 GRI 303-3 3, 6。
O 欄：crop_residue_recycled (廢棄物轉移量) - 影像辨識為翻耕作業後換算之農廢轉移公斤數，對接 GRI 306-4 3, 6。
P 欄：tgap_sync_status (履歷同步狀態) - 紀錄是否成功透過 API 推播至政府「產銷履歷系統（TGAP）」 7。
Q 欄：blockchain_tx_id (區塊鏈交易序號) - 執行地理圍欄比對後成功上鏈的防偽序號，作為防漂綠鐵證 8。
分頁二：Calculated_ESG（永續影響力數據池）
用途：透過 Google Sheets 內建的陣列公式（ArrayFormula）或 GAS 定期運算，將 Raw_Inputs 的原始數據轉譯為企業 ESG 專員所需的絕對量化數值 9。此表對應最終產出的 04_永續影響力數據單.xlsx 10。
A 欄：batch_number (批號) - 對應採購訂單。
B 欄：w_fert (肥料絕對重量 kg) - 將「包/元」套用類推演算法後得出的實際公斤數 3, 4。
C 欄：scope_3_ghg_reduction (範疇三減碳總計) - 依公式算出的溫室氣體減量絕對值（kg CO2e），對接 GRI 305-5 3, 11。
D 欄：soil_carbon_sequestration (土壤碳匯總計) - 農產重量乘上固碳係數之總額（kg CO2e） 3, 11。
E 欄：total_eco_area_ha (棲地復育面積) - 無化學農藥施作之公頃數，直接對接 TNFD 倡議 12。
F 欄：occupational_injury_count (職業傷害數) - NLP 判斷有無受傷關鍵字，無則帶入 0，對接 GRI 403-9 6。
G 欄：child_labor_risk (童工風險評級) - 依據契作實名制給予 "Low" 評級，應付會計師社會面確信 6。
H 欄：sdg_goals (對應之 SDGs) - 自動映射如 "SDG 10, SDG 15"，供 Buying Power 審查使用 13。
I 欄：gri_alignment (對應之 GRI 準則) - 自動映射相關準則代號，如 "GRI 413-1" 13。
J 欄：esg_report_copy (公版專業文案) - 供企業 HR 一鍵複製的第三人稱永續敘事字串 13。
分頁三：System_Parameters（環境係數與公式參數池）
用途：作為「AI 投入產出類推算法」的基底字典，供 Raw_Inputs 寫入時利用 VLOOKUP 動態調用數值，讓管理者可以隨時更新外部係數而不用修改底層程式碼 1, 14。
A 欄：material_name (資材/肥料名稱) - 供對照之主鍵（Primary Key）。
B 欄：average_price_ntd (市場平均單價) - $P_{avg}$，用於將農民的「購買金額」反推重量 4, 14。
C 欄：standard_weight_kg (標準包裝重量) - 設定該品牌 1 包等於幾公斤（如 20kg） 4。
D 欄：ghg_emission_factor (溫室氣體排放係數) - $EF_{fert}$，農業部公告之各類肥料碳排係數 4, 11。
E 欄：carbon_reduction_factor_per_kg (單位減碳係數) - 每公斤有機農產品減少之碳排量 15。
F 欄：soil_carbon_sequestration_per_kg (單位固碳係數) - 每公斤農產對應的土壤有機碳封存潛力 15。
G 欄：eco_area_equivalent_per_kg (單位棲地面積係數) - 每公斤產品能支持的無毒農地面積換算率 15。
分頁四：Farmer_Incentives（補助申請與行政自動化）
用途：追蹤為農民自動產出的政府補助單據，並作為發送 LINE「好康通知」的狀態控管表 9。
A 欄：claim_id (補助申請單號) - 自動生成的流水號。
B 欄：farmer_uid (農民 ID) - 對應申請人。
C 欄：claim_type (申請類別) - 分為「產銷履歷給付」、「農機補助」、「碳足跡計畫補助」等 16, 17。
D 欄：total_amount_ntd (可核銷總金額) - 擷取單據後累計的申請金額。
E 欄：pdf_document_url (申請單檔案網址) - GAS 動態調用 Google Docs 模板替換變數並轉存之 PDF 申請單連結 1。
F 欄：line_notify_status (好康推播狀態) - 紀錄是否已透過 LINE Reply Message API 發送「好康通知」給農民 1, 9。
G 欄：gov_submission_date (政府送件日期) - 若由合作社代辦送出，則押上日期註記。
