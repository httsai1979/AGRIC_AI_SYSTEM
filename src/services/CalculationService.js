/**
 * CalculationService - ANTIGRAVITY ESG 影響力運算引擎
 * 遵循 GRI 305-5 與 TNFD 框架
 */

const ESG_FACTORS = {
  GHG_REDUCTION_PER_KG: 0.52, // 每公斤有機肥相較於化學肥的減碳量 (範疇三)
  SOIL_CARBON_PER_KG: 0.15,   // 每公斤農產對應的土壤固碳係數
  SUBSIDY_RATE: 12,            // 政府補助費率 (TWD/kg)
};

export const CalculationService = {
  /**
   * 計算特定批次的 ESG 總體貢獻
   */
  calculateBatchImpact: (tasks) => {
    // 總肥料重量 (假設 1包 = 20kg)
    const totalWeight = tasks.reduce((sum, task) => sum + (task.data.usage_amount * 20), 0);
    
    return {
      totalWeight,
      scope3Reduction: (totalWeight * ESG_FACTORS.GHG_REDUCTION_PER_KG).toFixed(2),
      soilCarbon: (totalWeight * ESG_FACTORS.SOIL_CARBON_PER_KG).toFixed(2),
      estimatedSubsidy: (totalWeight * ESG_FACTORS.SUBSIDY_RATE).toLocaleString(),
      recordCount: tasks.length
    };
  }
};
