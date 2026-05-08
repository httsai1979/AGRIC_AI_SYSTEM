這是一份為工程團隊與業務團隊彙整的**《阿古力系統開發交接手冊》**，將先前的研究成果轉化為可直接落實的技術與執行規格：
《阿古力系統開發交接手冊》
一、 數據字典總表 (Data Dictionary)
本資料表定義了透過 LINE Bot 採集後，需自動寫入 Google Sheets (Farmer_Daily_Log)，並最終能轉換為 ESG_Impact_Export 供企業匯出的核心欄位1-3。
Google Sheets 欄位名稱,資料類型,收集/轉譯來源,對應 GRI / TNFD 準則編號,實務用途
log_date,Date,LINE 傳送時間戳記,稽核軌跡 (Audit Trail),確信時間證明1
batch_number,String,綁定企業契作合約,溯源防偽,確保數據屬於特定訂單1
coordinates,Object/String,照片 EXIF (緯度/經度),TNFD (Locate 定位),"鑑別生物多樣性熱區3, 4"
material_name,String,照片 OCR 辨識,TGAP 規範,"政府產銷履歷必填資材名5, 6"
operation_item,String,語音 NLP 語意判斷,TGAP 規範,"田間作業項目(如施肥)5, 6"
w_fert,Float,AI 類推換算 (公斤),GRI 305-3 (範疇三),實際投入之肥料/資材絕對重量5
water_withdrawal_m3,Float,電費單 OCR 換算,GRI 303-3 (取水量),揭露水資源消耗量2
scope_3_ghg_reduction,Float,運算引擎匯出 (kg CO2e),GRI 305-5 (溫室氣體減量),"提供企業範疇三減碳總額3, 5"
soil_carbon_sequestration,Float,運算引擎匯出 (kg CO2e),GRI 305-5 (溫室氣體減量),"土壤有機碳封存總量3, 5"
crop_residue_recycled,Float,田間照片辨識與面積換算,GRI 306-4 (廢棄物轉移),證明零焚燒與農業循環2
temporary_workers_count,Integer,語音 NLP 擷取,GRI 2-8 (非員工工作者),揭露供應鏈臨時工數量2
二、 AI 辨識邏輯與類推演算法 (AI Extraction & Algorithm)
為解決農民缺乏精確碳盤查紀錄的問題，系統將非結構化資料轉為量化指標的邏輯如下5, 7, 8：

1. OCR 與 NLP 判定規則：
影像辨識 (OCR)：當農民上傳肥料袋或農藥空瓶照片，調用 Gemini API 辨識包裝標籤，提取 material_name（如：台肥 43 號有機質肥料）5。
語意理解 (NLP)：解析農民的語音訊息，提取出數字與單位。
情境 A (數量)：提取 usage_amount（如：「用了五包」）5。
情境 B (金額)：提取財務花費（如：「買了 500 塊」）5。
作業判定：依據語境自動判定 operation_item 為「施肥」或「除草」5。
2. 投入產出類推換算公式：
實體重量轉換 ($W_{fert}$)：
若輸入金額：$W_{fert}$ (kg) = 購買金額 $\div$ 該肥料市場平均單價 ($P_{avg}$)5。
若輸入包數：$W_{fert}$ (kg) = 包數 $\times$ 該品牌單包標準重量5。
基準排放與減量換算：
基準排放量 ($GHG_{baseline}$) = $W_{fert} \times EF_{fert}$ (農業部肥料排放係數)5, 8。
範疇三減碳量 = 慣行農法基準排放量與友善農法排放量的差額5, 8。
土壤碳匯估算：總採購肥料量結合標準化耕作面積 ($A_{ha}$) 與作物品種，套用 soil_carbon_sequestration_per_kg 係數推算碳匯總量5, 8。
三、 LINE Bot 對話流程腳本 (User Flow Script)
針對高齡農民「無感輸入」設計，以圖文選單與語音取代打字9, 10。
節點 1：拍照即上傳 (Trigger)
農民動作：拍攝剛拆封的肥料空袋照片，直接傳給 LINE Bot10。
節點 2：OCR 辨識與大字體確認
系統動作：背景擷取照片並呼叫 API 解析，不要求農民打字輸入10。
LINE Bot 回應：「阿伯！系統看到您剛剛拍了 『台肥 43 號有機質肥料』。請問今天田裡是施這支肥料嗎？」10
UI 介面：彈出占滿半個螢幕的超大 Flex Message 按鈕：🟢【對，沒錯】 / 🔴【不是，我重拍】10。
節點 3：泥巴手指友善的語音引導
農民動作：點擊 🟢【對，沒錯】10。
LINE Bot 回應：「讚啦！請告訴我您這次用了 幾包 或是 多少錢？您手弄髒不用打字，直接按住螢幕下方的 🎤 麥克風用講的 給我聽喔！」10
農民動作：按住錄音回報：「我用了五包啦！」10
節點 4：好康通知與即時反饋 (Reward)
系統動作：將語音轉譯後寫入 Google Sheets 並同步至產銷履歷系統10, 11。
LINE Bot 回應：「收到！已經幫您把今天施肥的紀錄寫入政府的『產銷履歷系統』囉！📝 紀錄摘要：台肥43號有機肥 / 5包。💰 好康通知：您這次使用有機肥，系統已經幫您換算碳匯，這筆資料年底可以幫您自動產生【農機與肥料補助】的申請單喔！阿伯辛苦了，喝口水休息一下吧！」10
四、 API 串接需求 (API Integration Requirements)
本系統採 Serverless 架構，以後端 Google Apps Script (GAS) 驅動，工程師需對接以下端點12, 13：
3. LINE Messaging API (通訊與前端介面層)
Webhook URL：GAS 部署為 Web App 接收事件，需處理 MessageEvent 中的 image (照片) 與 audio (語音) 類型13。
Reply Message API：用於回傳詢問文字、渲染大字體的 Flex Message 按鈕，以及最終發送 PDF 下載連結給農民13。
4. Gemini Pro Vision API / Google AI Studio (數據提取層)
API 呼叫：傳入 LINE 收到的圖片 Content 與音檔，配合指定的 Prompt 指令13。
預期回傳：強制 Gemini 回傳結構化的 JSON 格式，例如：{"material_name": "台肥43號", "usage_amount": 5, "operation_item": "施肥"}13。
5. Google Sheets API / SpreadsheetApp (資料庫與運算層)
寫入功能：呼叫 Sheet.appendRow() 將解析後的 JSON 數據與時間戳記寫入 Farmer_Daily_Log 表單13。
運算功能：利用 Google Sheets 內建 VLOOKUP 公式抓取環保署排放係數，自動套用投入產出類推算法13。
6. Google Docs & Drive API / DocumentApp (報告生成層)
自動產出：讀取預載於 Google Drive 的公版文件（如「農機/肥料補助申請單_Template.gdoc」）13。
替換變數：利用 Body.replaceText() 將試算表產出的數據塞入模板13。
檔案轉換：調用 Doc.getAs('application/pdf') 將文件轉存為 PDF，回傳專屬連結給農民或採購人員13。
