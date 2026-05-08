/**
 * CalculationService - ANTIGRAVITY ESG 影響力運算引擎
 * 遵循《阿古力系統開發交接手冊》第 2.2 節之 $W_{fert}$ 類推演算法
 */

const ESG_FACTORS = {
  GHG_REDUCTION_PER_KG: 0.52,      // 每公斤有機肥相較於化學肥的減碳量 (GRI 305-5)
  SOIL_CARBON_PER_KG: 0.15,        // 每公斤農產對應的土壤固碳係數
  SUBSIDY_RATE: 12,                 // 每公斤補貼費率 (TWD/kg)
  DEFAULT_AVG_PRICE_PER_KG: 25,    // $P_{avg}$: 肥料市場平均單價 (用於金額反推)
  DEFAULT_PACKAGE_WEIGHT: 20,      // 單包標準重量 (kg)
};

export const CalculationService = {
  /**
   * 實作 $W_{fert}$ 類推演算法
   * @param {number} amount - 原始數值 (包數或金額)
   * @param {string} unit - 原始單位 (包 / 元)
   */
  calculateW_fert: (amount, unit) => {
    if (unit === '元') {
      // 公式：$W_{fert}$ (kg) = 購買金額 ÷ $P_{avg}$
      return amount / ESG_FACTORS.DEFAULT_AVG_PRICE_PER_KG;
    } else {
      // 公式：$W_{fert}$ (kg) = 包數 × 該品牌單包標準重量
      return amount * ESG_FACTORS.DEFAULT_PACKAGE_WEIGHT;
    }
  },

  /**
   * 計算特定批次的 ESG 總體貢獻
   */
  calculateBatchImpact: (tasks) => {
    const totalWeight = tasks.reduce((sum, task) => {
      const weight = CalculationService.calculateW_fert(
        task.data.usage_amount, 
        task.data.original_unit
      );
      return sum + weight;
    }, 0);
    
    return {
      totalWeight: totalWeight.toFixed(1),
      scope3Reduction: (totalWeight * ESG_FACTORS.GHG_REDUCTION_PER_KG).toFixed(2),
      soilCarbon: (totalWeight * ESG_FACTORS.SOIL_CARBON_PER_KG).toFixed(2),
      estimatedSubsidy: Math.floor(totalWeight * ESG_FACTORS.SUBSIDY_RATE).toLocaleString(),
      recordCount: tasks.length
    };
  }
};
