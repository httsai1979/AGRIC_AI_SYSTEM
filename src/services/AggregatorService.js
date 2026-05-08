/**
 * AggregatorService - ANTIGRAVITY B2B 數據彙整引擎
 * 負責計算 ESG 年度指標與社會面影響力
 */

const REDUCTION_FACTOR = 0.52; // 每公斤資材對應的減碳量 (範疇三基準)

export const AggregatorService = {
  /**
   * 彙整原始數據並產出合規指標
   */
  getComplianceMetrics: (dataList) => {
    // 1. 年度累計減碳量 (GRI 305-5)
    const totalWeight = dataList.reduce((sum, item) => sum + (Number(item.data?.usage_amount || 0) * 20), 0);
    const totalCarbonReduction = (totalWeight * REDUCTION_FACTOR).toFixed(2);

    // 2. 支持農民總數 (SDG 10 - 減少不平等)
    const uniqueFarmers = new Set(dataList.map(item => item.data?.farmer_uid || "UNKNOWN")).size;

    return {
      totalCarbonReduction, // kg CO2e
      farmerCount: uniqueFarmers,
      totalTonnage: (totalWeight / 1000).toFixed(2), // 公噸
      auditDate: new Date().toLocaleDateString()
    };
  }
};
