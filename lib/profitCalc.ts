// lib/profitCalc.ts

/**
 * 最終利益の詳細を計算する
 * @param {Object} params - パラメータオブジェクト
 * @param {number} params.sellingPrice - 売値（GBP）
 * @param {number} params.costPrice - 仕入れ値（JPY）
 * @param {number} params.shippingJPY - 配送料（JPY）
 * @param {number} params.categoryFeeJPY - カテゴリ手数料（JPY）
 * @param {number} params.customsRate - 関税率（%）
 * @param {number} params.platformRate - プラットフォーム手数料率（%）
 
 * @param {number} [params.exchangeRateGBPtoJPY] - GBPからJPYへの為替レート
 * @param {number} [params.targetMargin=0.25] - 目標利益率
 * @returns {Object} 最終利益の詳細
 */
export function calculateFinalProfitDetail({
  sellingPrice: sellingPriceGBP,
  costPrice,
  shippingJPY,
  categoryFeeJPY,
  customsRate,
  platformRate,
  exchangeRateGBPtoJPY: adjustedRate,
  targetMargin = 0.25,
}: {
  sellingPrice: number; // GBP
  costPrice: number; // JPY
  shippingJPY: number; // JPY
  categoryFeeJPY: number; // JPY
  customsRate: number;
  platformRate: number;
  exchangeRateGBPtoJPY?: number;
  targetMargin?: number;
}) {
  if (!adjustedRate) {
    throw new Error("exchangeRateGBPtoJPY(adjustedRate) が必要です！");
  }

  // GBP → JPY に換算
  const sellingPriceJPY = sellingPriceGBP * adjustedRate;


  // 最終的な JPY 売値
  const adjustedSellingPriceJPY = sellingPriceGBP * adjustedRate;

  const customsFee = adjustedSellingPriceJPY * (customsRate / 100);
  const platformFee = adjustedSellingPriceJPY * (platformRate / 100);

  const totalCost = costPrice + shippingJPY + categoryFeeJPY + customsFee + platformFee;
  const profit = adjustedSellingPriceJPY - totalCost;

  const profitMargin =
    adjustedSellingPriceJPY === 0 ? 0 : (profit / adjustedSellingPriceJPY) * 100;

  const vatAmount = adjustedSellingPriceJPY - sellingPriceJPY;

  const suggestedPrice = totalCost / (1 - targetMargin);

  return {
    customsFee,
    platformFee,
    totalCost,
    profit,
    profitMargin,
    vatAmount,
    priceIncludingVAT: adjustedSellingPriceJPY,
    suggestedPrice,
    targetMargin,
  };
}

/**
 * カテゴリ手数料額を計算する
 */
export function calculateCategoryFee(
  sellingPrice: number,
  categoryFeePercent: number
): number {
  return sellingPrice * (categoryFeePercent / 100);
}

/**
 * 配送料（GBP）をJPYに換算する
 */
export function convertShippingPriceToJPY(
  shippingPriceGBP: number,
  exchangeRate: number
): number {
  return shippingPriceGBP * exchangeRate;
}

/**
 * 実費合計を計算する
 */
export function calculateActualCost(
  costPrice: number,
  shippingJPY: number,
  categoryFeeJPY: number
): number {
  return costPrice + shippingJPY + categoryFeeJPY;
}

/**
 * 粗利を計算する
 */
export function calculateGrossProfit(
  sellingPrice: number,
  actualCost: number
): number {
  return sellingPrice - actualCost;
}

/**
 * 利益率を計算する
 */
export function calculateProfitMargin(
  grossProfit: number,
  sellingPrice: number
): number {
  if (sellingPrice === 0) return 0;
  return (grossProfit / sellingPrice) * 100;
}
