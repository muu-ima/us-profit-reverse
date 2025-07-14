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

  // 州税抜き売上 (USD) 
  const sellingPriceExclTaxUSD = sellingPrice;

  // 州税抜き売上 (JPY)
  const revenueJPYExclTax = sellingPrice * exchangeRateUSDtoJPY;

  // 州税6.71%を計算、州税込みの売上 (USD)
  const stateTaxRate = 0.0671;
  const sellingPriceInclTax = sellingPrice * (1 + stateTaxRate);

  // カテゴリ手数料 & 決済手数料 
  const categoryFeeUSD = sellingPriceInclTax * (categoryFeePercent / 100);
  const paymentFeeUSD = sellingPriceInclTax * (paymentFeePercent / 100);

  // 手数料にかかるTAX (10%) (USD)
  const feeTaxUSD = (categoryFeeUSD + paymentFeeUSD) * 0.10;

  // Payoneer手数料 (粗利の2%) → 一旦は州税込み売上 - 基本手数料で粗利計算してから算出
  const grossProfitUSD = sellingPrice - (categoryFeeUSD + paymentFeeUSD + feeTaxUSD);
  const payoneerFeeUSD = grossProfitUSD * 0.02;

  // 税還付金 (JPY)
  const exchangeAdjustmentJPY = costPrice * 10 / 110; // 税率10%の場合

  // 手数料還付金 (JPY)
  const feeRebateJPY = feeTaxUSD * exchangeRateUSDtoJPY

  // 全手数料 (USD) 合計
  const totalFeesUSD = categoryFeeUSD + paymentFeeUSD + feeTaxUSD + payoneerFeeUSD;

  // 全手数料引き後 (USD)
  const netSellingUSD = sellingPriceExclTaxUSD - totalFeesUSD;

  // １ドル辺り3.3円手数料
  const exchangeFeePerUSD = 3.3; // 1USD あたり 3.3円の両替手数料

  // 両替手数料 (JPY)
  const exchangeFeeJPY = netSellingUSD * exchangeFeePerUSD;

  // 正味JPY
  const netSellingJPY = (netSellingUSD * exchangeRateUSDtoJPY) - exchangeFeeJPY;

  // 仕入れ値と送料（JPY）を差し引く
  const netProfitJPY = netSellingJPY - costPrice - shippingJPY;

  //  最終損益
  const profitJPY = netProfitJPY + exchangeAdjustmentJPY + feeRebateJPY;

  // 売値ベース 利益率
  const profitMargin = revenueJPYExclTax === 0 ? 0 : (profitJPY / revenueJPYExclTax) * 100;

  // 8. 全手数料 (JPY)
  const totalFeesJPY = totalFeesUSD * exchangeRateUSDtoJPY;

  // 10. 総コスト (JPY)
  const categoryFeeJPY = categoryFeeUSD * exchangeRateUSDtoJPY;
  const paymentFeeJPY = paymentFeeUSD * exchangeRateUSDtoJPY;
  const payoneerFeeJPY = payoneerFeeUSD * exchangeRateUSDtoJPY;
  const feeTaxJPY = feeTaxUSD * exchangeRateUSDtoJPY;

  const totalCostJPYRaw = costPrice + shippingJPY + categoryFeeJPY + paymentFeeJPY + feeTaxJPY + payoneerFeeJPY;
  const totalCostJPY = Math.round(totalCostJPYRaw);

  console.log("=== [US 利益計算 DEBUG LOG] ===");

  console.log("=== [US 利益計算 DEBUG END] ===");


  return {
    totalCostJPY,
    grossProfitUSD,
    netProfitJPY,
    profitMargin,
    profitJPY,
    feeTaxJPY,
    feeTaxUSD,
    payoneerFeeJPY,
    payoneerFeeUSD,
    exchangeAdjustmentJPY,
    feeRebateJPY,
    categoryFeeUSD,
    categoryFeeJPY: categoryFeeUSD * exchangeRateUSDtoJPY,
    sellingPrice,
    sellingPriceInclTax,
    paymentFeeJPY,         // ← 追加
    paymentFeeUSD,
    exchangeFeeJPY,
    costPrice
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
