// lib/profitCalc.ts

import { ProfitCalcParamsUS, FinalProfitDetailUS } from '@/types/profitCalc';

/**
 * 最終利益の詳細を計算する (US版)
 * @param {Object} params - パラメータオブジェクト
 * @param {number} params.sellingPrice - 売値（USD）
 * @param {number} params.costPrice - 仕入れ値（JPY）
 * @param {number} params.shippingJPY - 配送料（JPY）
 * @param {number} params.categoryFeePercent - カテゴリ手数料（%）
 * @param {number} params.paymentFeePercent - 決済手数料（%）
 * @param {number} params.platformRate - プラットフォーム手数料率（%）
 * @param {number} [params.targetMargin=0.25] - 目標利益率 (省略時は25%)
 * 
 * @returns {Object} 最終利益の詳細
 * @returns {number} return.totalCost - 総コスト (JPY)
 * @returns {number} return.profit - 利益 (JPY)
 * @returns {number} return.profitMargin - 利益率 (%)
 * @returns {number} return.suggestedPrice - 目標利益率を達成するための推奨販売価格 (JPY)
 * @returns {number} return.feeTax - 手数料にかかるタックス額 (JPY)
 * @returns {number} return.payoneerFee - ペイオニア手数料 (JPY)
 * @returns {number} return.exchangeAdjustmentJPY - 為替調整額 (JPY)
 */
export function calculateFinalProfitDetailUS({
  sellingPrice, //USD
  costPrice, //JPY
  shippingJPY, //JPY
  categoryFeePercent, //%
  paymentFeePercent, //%
  exchangeRateUSDtoJPY,
  targetMargin = 0.25,

}: ProfitCalcParamsUS): FinalProfitDetailUS {
  console.log("利益計算に渡すcategoryFeePercent:", categoryFeePercent);
  if (!exchangeRateUSDtoJPY) {
    throw new Error("exchangeRateUSDtoJPY が必要です！");
  }

  // 1. 州税6.71%を計算、州税込みの売上 (USD)
  const stateTaxRate = 0.0671;
  const sellingPriceInclTax = sellingPrice * (1 + stateTaxRate);

  // 2. カテゴリ手数料 & 決済手数料 
  const categoryFeeUSD = sellingPriceInclTax * (categoryFeePercent / 100);
  const paymentFeeUSD = sellingPriceInclTax * (paymentFeePercent / 100);

  // 3. 手数料にかかるTAX (10%) (USD)
  const feeTaxUSD = (categoryFeeUSD + paymentFeeUSD) * 0.10;

   // 4. Payoneer手数料 (粗利の2%) → 一旦は州税込み売上 - 基本手数料で粗利計算してから算出
  const grossProfitUSD = sellingPrice - (categoryFeeUSD + paymentFeeUSD + feeTaxUSD);
  const payoneerFeeUSD = grossProfitUSD * 0.02;

    // 5. 為替調整額 (JPY)
  const exchangeAdjustmentJPY = sellingPrice * 3.3;

    // 6. 州税込み売上 (JPY)
  const revenueJPY = sellingPriceInclTax * exchangeRateUSDtoJPY;

  // 7. 全手数料 (USD) 合計
  const totalFeesUSD = categoryFeeUSD + paymentFeeUSD + feeTaxUSD + payoneerFeeUSD;

  
  // 8. 全手数料 (JPY)
  const totalFeesJPY = totalFeesUSD * exchangeRateUSDtoJPY;

  // 9. 最終利益 (JPY)
  const netProfitJPY = (sellingPrice * exchangeRateUSDtoJPY) - costPrice - shippingJPY - totalFeesJPY + exchangeAdjustmentJPY;

   // 10. 総コスト (JPY)
  const categoryFeeJPY = categoryFeeUSD * exchangeRateUSDtoJPY;
  const paymentFeeJPY = paymentFeeUSD * exchangeRateUSDtoJPY;
  const payoneerFeeJPY = payoneerFeeUSD * exchangeRateUSDtoJPY;
  const feeTaxJPY = feeTaxUSD * exchangeRateUSDtoJPY;

  const totalCostJPY = costPrice + shippingJPY + categoryFeeJPY + paymentFeeJPY + feeTaxJPY + payoneerFeeJPY;

    // 11. 利益率 = 最終利益 ÷ 総コスト
  const profitMargin = totalCostJPY === 0 ? 0 : (netProfitJPY / totalCostJPY) * 100;

  // 12. 推奨売値 (USD) = 総コスト ÷ (1 - 目標利益率)
  const totalCostUSD = totalCostJPY / exchangeRateUSDtoJPY;
  const suggestedPriceUSD = totalCostUSD / (1 - targetMargin);
  const suggestedPriceJPY = suggestedPriceUSD * exchangeRateUSDtoJPY;

console.log("=== [US 利益計算 DEBUG LOG] ===");

// 1️⃣ 入力パラメータ
console.log(`売値 (USD): $${sellingPrice.toFixed(2)}`);
console.log(`仕入れ値 (JPY): ￥${costPrice.toLocaleString()}`);
console.log(`送料 (JPY): ￥${shippingJPY.toLocaleString()}`);
console.log(`カテゴリ手数料率 (%): ${categoryFeePercent.toFixed(2)}%`);
console.log(`決済手数料率 (%): ${paymentFeePercent.toFixed(2)}%`);
console.log(`目標利益率: ${(targetMargin * 100).toFixed(2)}%`);
console.log(`為替レート (USD→JPY): ${exchangeRateUSDtoJPY.toFixed(4)}`);

console.log("------------------------------");

// 2️⃣ 州税・税込売上
console.log(`州税込み売上 (USD): $${sellingPriceInclTax.toFixed(2)}`);
console.log(`税抜き売上 (USD): $${sellingPrice.toFixed(2)}`);
console.log(`税抜き売上 (JPY): ￥${revenueJPY.toLocaleString()}`);


console.log("------------------------------");

// 3️⃣ 手数料詳細
console.log(`カテゴリ手数料 (USD): $${categoryFeeUSD.toFixed(2)}`);
console.log(`決済手数料 (USD): $${paymentFeeUSD.toFixed(2)}`);
console.log(`手数料税 (USD): $${feeTaxUSD.toFixed(2)}`);
console.log(`Payoneer手数料 (USD): $${payoneerFeeUSD.toFixed(2)}`);
console.log(`手数料合計 (USD): $${totalFeesUSD.toFixed(2)}`);

console.log(`カテゴリ手数料 (JPY): ￥${categoryFeeJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);
console.log(`決済手数料 (JPY): ￥${paymentFeeJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);
console.log(`手数料税 (JPY): ￥${feeTaxJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);
console.log(`Payoneer手数料 (JPY): ￥${payoneerFeeJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);
console.log(`手数料合計 (JPY): ￥${totalFeesJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);

console.log("------------------------------");

// 4️⃣ 粗利・最終利益
console.log(`粗利益 (USD): $${grossProfitUSD.toFixed(2)}`);
console.log(`最終利益 (JPY): ￥${netProfitJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);
console.log(`為替調整額 (JPY): ￥${exchangeAdjustmentJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);

console.log("------------------------------");

// 5️⃣ コスト・利益率・推奨売値
console.log(`総コスト (JPY): ￥${totalCostJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);
console.log(`利益率 (%): ${profitMargin.toFixed(2)}%`);
console.log(`推奨売値 (USD): $${suggestedPriceUSD.toFixed(2)}`);
console.log(`推奨売値 (JPY): ￥${suggestedPriceJPY.toLocaleString(undefined, { minimumFractionDigits: 0 })}`);

console.log("=== [US 利益計算 DEBUG END] ===");



  return {
    totalCostJPY,
    grossProfitUSD,
    netProfitJPY,
    profitMargin,
    suggestedPriceUSD,
    suggestedPrice: suggestedPriceJPY, // ← ここをJPYで返す
    feeTaxJPY,
    feeTaxUSD,
    payoneerFeeJPY,
    payoneerFeeUSD,
    exchangeAdjustmentJPY,
    categoryFeeUSD,
    categoryFeeJPY: categoryFeeUSD * exchangeRateUSDtoJPY,
  };
}

/**
 * カテゴリ手数料額を計算する (US)
 */
export function calculateCategoryFeeUS(
  sellingPrice: number,
  categoryFeePercent: number
): number {
  console.log("売値 (JPY):", sellingPrice);
  console.log("カテゴリ手数料率(%):", categoryFeePercent);
  return sellingPrice * (categoryFeePercent / 100);
}

/**
 * 配送料（USD）をJPYに換算する
 */
export function convertShippingPriceToJPY(
  shippingPriceUSD: number,
  exchangeRateUSDtoJPY: number): number {
  return shippingPriceUSD * exchangeRateUSDtoJPY;
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
  sellingPriceJPY: number,
  actualCostJPY: number
): number {
  return sellingPriceJPY - actualCostJPY;
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
