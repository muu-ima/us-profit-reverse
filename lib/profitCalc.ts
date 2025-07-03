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
  const stateTaxUSD = sellingPrice * stateTaxRate;
  const sellingPriceInclTax = sellingPrice + stateTaxUSD;

  // 2. カテゴリ手数料 & 決済手数料 
  const categoryFeeUSD = sellingPrice * (categoryFeePercent / 100);
  const paymentFeeUSD = sellingPrice * (paymentFeePercent / 100);

  // 3. 全手数料にかかるTAX (10%)
  const feeTaxUSD = (categoryFeeUSD + paymentFeeUSD) * 0.10;
  const feeTaxJPY = feeTaxUSD * exchangeRateUSDtoJPY

  // 4. 全手数料合計
  const totalFeesUSD = categoryFeeUSD + paymentFeeUSD + feeTaxUSD;

  // 5. 州税込み売上から手数料を引いた粗利益 (USD)
  const grossProfitUSD = sellingPriceInclTax - totalFeesUSD;

  //6. Payoneer手数料 (2%)
  const payoneerFeeUSD = grossProfitUSD * 0.02;
  const payoneerFeeJPY = payoneerFeeUSD * exchangeRateUSDtoJPY;

  //7. 最終利益 (JPY)
  const netProfitJPY = (grossProfitUSD * exchangeRateUSDtoJPY) - payoneerFeeJPY;

  //9 為替換算 (JPY)
  const exchangeAdjustmentJPY = sellingPrice * 3.3;

  //10 総コスト
  const categoryFeeJPY = categoryFeeUSD * exchangeRateUSDtoJPY;
  const paymentFeeJPY = paymentFeeUSD * exchangeRateUSDtoJPY;
  const totalCostJPY = costPrice + shippingJPY + categoryFeeJPY + paymentFeeJPY;


  // 利益率は総コスト基準で計算
  const profitMargin = totalCostJPY === 0 ? 0 : (netProfitJPY / totalCostJPY) * 100;

  //12 損益分岐の推奨売値 (USD)
  const totalCostUSD = totalCostJPY / exchangeRateUSDtoJPY;
  const suggestedPriceUSD = totalCostUSD / (1 - targetMargin);
  const suggestedPriceJPY = suggestedPriceUSD * exchangeRateUSDtoJPY;
  // === Debug Logs ===
  console.log("=== [US 利益計算] ===");

  // 🟢 1️⃣ 売値と州税
  console.log(`売値 (USD): ${sellingPrice}`);
  console.log(`州税率: ${stateTaxRate * 100}%`);
  console.log(`州税額 (USD): ${stateTaxUSD}`);
  console.log(`州税込み売上 (USD): ${sellingPriceInclTax}`);

  // 🟢 2️⃣ カテゴリ手数料 & 決済手数料
  console.log("------------------------------");
  console.log(`カテゴリ手数料率 (%): ${categoryFeePercent}`);
  console.log(`カテゴリ手数料 (USD): ${categoryFeeUSD}`);
  console.log(`決済手数料率 (%): ${paymentFeePercent}`);
  console.log(`決済手数料 (USD): ${paymentFeeUSD}`);
  console.log(`手数料税 (USD): ${feeTaxUSD}`);
  console.log(`手数料合計 (USD): ${totalFeesUSD}`);

  // 🟢 3️⃣ 粗利・最終利益
  console.log("------------------------------");
  console.log(`粗利益 (USD): ${grossProfitUSD}`);
  console.log(`Payoneer手数料 (JPY): ${payoneerFeeJPY}`);
  console.log(`利益 (JPY): ${netProfitJPY}`);

  // 🟢 4️⃣ コスト・利益率・推奨売値
  console.log("------------------------------");
  console.log(`総コスト (JPY): ${totalCostJPY}`);
  console.log(`利益率 (%): ${profitMargin}`);
  console.log(`推奨売値 (USD): ${suggestedPriceUSD}`);
  console.log(`推奨売値 (JPY): ${suggestedPriceJPY}`);

  // 🟢 5️⃣ 為替・調整
  console.log("------------------------------");
  console.log(`為替レート (USD → JPY): ${exchangeRateUSDtoJPY}`);
  console.log(`為替調整額 (JPY): ${exchangeAdjustmentJPY}`);

  console.log("==============================");



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
