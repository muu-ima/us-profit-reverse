// lib/profitCalc.ts

import { ProfitCalcParamsUS, FinalProfitDetailUS } from '@/types/profitCalc';

// 定数まとめ
const STATE_TAX_RATE = 0.0671;      // 州税率 6.71%
const FINAL_VALUE_FEE = 0.40;       // 固定Final Value Fee (USD)
const EXCHANGE_FEE_PER_USD = 3.3;   // 両替手数料（JPY/1USD）
const FEE_TAX_RATE = 0.10;          // 手数料にかかる税率 10%
const PAYONEER_FEE_RATE = 0.02;     // Payoneer手数料率 2%

export const toJPY = (usd: number, rate: number) => Math.round(usd * rate);
export const toUSD = (jpy: number, rate: number) => jpy / rate;

/**
 * 手数料計算を共通化
 */
function calculateFees(
  sellingPriceUSD: number,
  categoryFeePercent: number,
  paymentFeePercent: number,
) {
  const sellingPriceInclTaxUSD = sellingPriceUSD * (1 + STATE_TAX_RATE);

  const categoryFeeUSD = sellingPriceInclTaxUSD * (categoryFeePercent / 100);
  const paymentFeeUSD = sellingPriceInclTaxUSD * (paymentFeePercent / 100);

  const feeTaxUSD = (categoryFeeUSD + paymentFeeUSD + FINAL_VALUE_FEE) * FEE_TAX_RATE;

  const grossProfitUSD = sellingPriceUSD - (categoryFeeUSD + paymentFeeUSD + feeTaxUSD);

  const payoneerFeeUSD = grossProfitUSD * PAYONEER_FEE_RATE;

  const totalFeesUSD = categoryFeeUSD + paymentFeeUSD + feeTaxUSD + payoneerFeeUSD + FINAL_VALUE_FEE;

  return {
    categoryFeeUSD,
    paymentFeeUSD,
    feeTaxUSD,
    payoneerFeeUSD,
    totalFeesUSD,
  };
}

/**
 * 最終利益の詳細を計算する (US版)
 */
export function calculateFinalProfitDetailUS({
  sellingPrice,     // USD
  costPrice,       // JPY
  shippingJPY,     // JPY
  categoryFeePercent,
  paymentFeePercent,
  exchangeRateUSDtoJPY,
}: ProfitCalcParamsUS): FinalProfitDetailUS {

  if (!exchangeRateUSDtoJPY) {
    throw new Error("exchangeRateUSDtoJPY が必要です！");
  }

  // 売上 (税抜き)
  const revenueJPYExclTax = sellingPrice * exchangeRateUSDtoJPY;

  // 手数料計算
  const {
    categoryFeeUSD,
    paymentFeeUSD,
    feeTaxUSD,
    payoneerFeeUSD,
    totalFeesUSD,
  } = calculateFees(sellingPrice, categoryFeePercent, paymentFeePercent);

  // 手数料還付金 (JPY)
  const feeRebateJPY = feeTaxUSD * exchangeRateUSDtoJPY;

  // 税還付金 (JPY) ※税率10%の場合
  const exchangeAdjustmentJPY = costPrice * 10 / 110;

  // 全手数料差引後の売上 (USD)
  const netSellingUSD = sellingPrice - totalFeesUSD;

  // 両替手数料 (JPY) - 1USDあたりEXCHANGE_FEE_PER_USD円
  const exchangeFeeJPY = netSellingUSD * EXCHANGE_FEE_PER_USD;

  // 正味JPY売上 = USD売上 - 手数料 をJPY換算後、両替手数料を引く
  const netSellingJPY = (netSellingUSD * exchangeRateUSDtoJPY) - exchangeFeeJPY;

  // 仕入れ・配送料差引後利益 (JPY)
  const netProfitJPY = netSellingJPY - costPrice - shippingJPY;

  // 最終利益 = 税還付金 + 手数料還付金を加算
  const profitJPY = netProfitJPY + exchangeAdjustmentJPY + feeRebateJPY;

  // 利益率 (%)
  const profitMargin = revenueJPYExclTax === 0 ? 0 : (profitJPY / revenueJPYExclTax) * 100;

  // 州税込売上(USD)
  const sellingPriceInclTax = sellingPrice * (1 + STATE_TAX_RATE);

  // ▼ UIで「逆変換」しなくていいように、JPY版も同時に持たせる
  const sellingPriceJPY = Math.round(sellingPrice * exchangeRateUSDtoJPY);
  const sellingPriceIncTaxJPY = Math.round(sellingPriceInclTax * exchangeRateUSDtoJPY);
  const categoryFeeJPY = Math.round(categoryFeeUSD * exchangeRateUSDtoJPY);
  const paymentFeeJPY = Math.round(paymentFeeUSD * exchangeRateUSDtoJPY);
  const feeTaxJPY = Math.round(feeTaxUSD * exchangeRateUSDtoJPY);
  const payoneerFeeJPY = Math.round(paymentFeeUSD * exchangeRateUSDtoJPY);
  const finalValueFeeJPY = Math.round(FINAL_VALUE_FEE * exchangeRateUSDtoJPY);

  return {
    grossProfitUSD: sellingPrice - (categoryFeeUSD + paymentFeeUSD + feeTaxUSD),
    netProfitJPY,
    profitMargin,
    profitJPY,
    feeTaxUSD,
    payoneerFeeUSD,
    exchangeAdjustmentJPY,
    feeRebateJPY,
    categoryFeeUSD,
    sellingPrice,
    sellingPriceInclTax,
    paymentFeeUSD,
    exchangeFeeJPY,
    finalValueFee: FINAL_VALUE_FEE,
    costPrice,

    // ▼ 追加（UIが逆算不要に）
    sellingPriceJPY,
    sellingPriceIncTaxJPY,
    categoryFeeJPY,
    paymentFeeJPY,
    feeTaxJPY,
    payoneerFeeJPY,
    finalValueFeeJPY,

   // 参考：表示に便利
    netSellingUSD,
  } as FinalProfitDetailUS;
}

/**
 * 目標利益率から販売価格（USD）を逆算する関数
 */
export function calculateSellingPriceFromProfitRateWithFees({
  costPrice,
  shippingJPY,
  targetProfitRate,
  categoryFeePercent,
  paymentFeePercent,
  exchangeRateUSDtoJPY,
}: {
  costPrice: number;
  shippingJPY: number;
  targetProfitRate: number; // 例: 0.3 = 30%
  categoryFeePercent: number;
  paymentFeePercent: number;
  exchangeRateUSDtoJPY: number;
}): { priceUSD: number; priceJPY: number } {

  const costPriceUSD = costPrice / exchangeRateUSDtoJPY;
  const shippingUSD = shippingJPY / exchangeRateUSDtoJPY;

  let low = costPriceUSD + shippingUSD;
  let high = low * 10;

  const tolerance = 0.0001;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;

    // 手数料計算
    const {
      totalFeesUSD,
    } = calculateFees(mid, categoryFeePercent, paymentFeePercent);

    const netSellingUSD = mid - totalFeesUSD;

    // 両替手数料をUSDに換算 (JPY換算してからUSDに戻す形)
    const exchangeFeeUSD = (netSellingUSD * EXCHANGE_FEE_PER_USD) / exchangeRateUSDtoJPY;

    const netSellingAfterExchangeUSD = netSellingUSD - exchangeFeeUSD;

    const totalCostUSD = costPriceUSD + shippingUSD;

    const profitUSD = netSellingAfterExchangeUSD - totalCostUSD;

    const currentProfitRate = profitUSD / totalCostUSD;

    if (Math.abs(currentProfitRate - targetProfitRate) < tolerance) {
      const priceJPY = Math.ceil(mid * exchangeRateUSDtoJPY * 100) / 100;
      return { priceUSD: mid, priceJPY };
    }

    if (currentProfitRate < targetProfitRate) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const finalPriceJPY = Math.ceil(low * exchangeRateUSDtoJPY * 100) / 100;
  return { priceUSD: low, priceJPY: finalPriceJPY };
}

/**
 * カテゴリ手数料額を計算する (US)
 */
export function calculateCategoryFeeUS(
  sellingPrice: number,
  categoryFeePercent: number
): number {
  return sellingPrice * (categoryFeePercent / 100);
}

/**
 * 配送料（USD）をJPYに換算する
 */
export function convertShippingPriceToJPY(
  shippingPriceUSD: number,
  exchangeRateUSDtoJPY: number
): number {
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
