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

  // Final Value Fee
  const finalValueFee = 0.40;

  // 手数料にかかるTAX (10%) (USD)
  const feeTaxUSD = (categoryFeeUSD + paymentFeeUSD + finalValueFee) * 0.10;

  // Payoneer手数料 (粗利の2%) → 一旦は州税込み売上 - 基本手数料で粗利計算してから算出
  const grossProfitUSD = sellingPrice - (categoryFeeUSD + paymentFeeUSD + feeTaxUSD);
  const payoneerFeeUSD = grossProfitUSD * 0.02;

  // 税還付金 (JPY)
  const exchangeAdjustmentJPY = costPrice * 10 / 110; // 税率10%の場合

  // 手数料還付金 (JPY)
  const feeRebateJPY = feeTaxUSD * exchangeRateUSDtoJPY

  // 全手数料 (USD) 合計
  const totalFeesUSD = categoryFeeUSD + paymentFeeUSD + feeTaxUSD + payoneerFeeUSD + finalValueFee;

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

  return {
    grossProfitUSD,
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
    finalValueFee,
    costPrice
  };
}

/**
 * 目標利益率から販売価格（USD）を逆算して計算します。s
 * @param costPrice 原価(JPY)
 * @param shippingJPY 配送料(JPY)
 * @param targetProfitRate 目標利益率(例：0.2)
 * @param categoryFeePercent カテゴリ手数料率
 * @param {number} params.paymentFeePercent - 決済手数料（%） 
 * @param exchangeRateUSDtoJPY
 * @returns 自動計算された販売価格(USD)
 */


// 手数料を個別に計算する補助関数
function calculateFees(
  sellingPrice: number,
  categoryFeePercent: number,
  paymentFeePercent: number,
  finalValueFee: number,
  stateTaxRate: number
): { feeTaxUSD: number; payoneerFeeUSD: number; totalFeesUSD: number } {
  const sellingPriceInclTax = sellingPrice * (1 + stateTaxRate);
  const categoryFeeUSD = sellingPriceInclTax * (categoryFeePercent / 100);
  const paymentFeeUSD = sellingPriceInclTax * (paymentFeePercent / 100);
  const feeTaxUSD = (categoryFeeUSD + paymentFeeUSD + finalValueFee) * 0.10;
  const grossProfitUSD = sellingPrice - (categoryFeeUSD + paymentFeeUSD + feeTaxUSD);
  const payoneerFeeUSD = grossProfitUSD * 0.02;
  const totalFeesUSD = categoryFeeUSD + paymentFeeUSD + feeTaxUSD + payoneerFeeUSD
  return { feeTaxUSD, payoneerFeeUSD, totalFeesUSD };
}

// メイン計算（JPY返し＋ログ付き）
export function calculateSellingPriceFromProfitRateWithFees({
  costPrice,
  shippingJPY,
  targetProfitRate,
  categoryFeePercent,
  paymentFeePercent,
  exchangeRateUSDtoJPY,
}: {
  costPrice: number,
  shippingJPY: number,
  targetProfitRate: number,
  categoryFeePercent: number,
  paymentFeePercent: number,
  exchangeRateUSDtoJPY: number,
}): number {
  // --- 定数（この関数内で固定値として使われるもの） ---
  const stateTaxRate = 0.0671; //州税率
  const finalValueFee = 0.40;  //固定
  const exchangeFeePerUSD = 3.3


  // JPYをUSDに変換して統一
  const costPriceUSD = costPrice / exchangeRateUSDtoJPY;
  // 配送料をUSD換算（追加）
  const shippingUSD = shippingJPY / exchangeRateUSDtoJPY;

  let low = costPriceUSD + shippingUSD;// 下限=コスト合計
  let high = low * 10;                 // 上限=10倍

  const tolerance = 0.0001           // 利益率の誤差許容範囲

  for(let i = 0; i < 100; i++){
    const mid = (low + high)/2;

  // 手数料計算
    const { totalFeesUSD } = calculateFees(
      mid,
      categoryFeePercent,
      paymentFeePercent,
      finalValueFee,
      stateTaxRate
    );
    const netSellingUSD = mid - totalFeesUSD;
    const exchangeFeeUSD = (netSellingUSD * exchangeFeePerUSD) / mid;
    const netSellingAfterExchangeUSD = netSellingUSD - exchangeFeeUSD;

    const totalCostUSD = costPriceUSD + shippingUSD;
    const profitUSD = netSellingAfterExchangeUSD - totalCostUSD;

      // ★ 原価基準の利益率
      const currentProfitRate = profitUSD / totalCostUSD;

      // ---ログ表示---
      console.log(`Iteration ${i + 1}`);
      console.log({
        midSellingPriceUSD: mid.toFixed(2),
        netSellingUSD: netSellingUSD.toFixed(2),
        exchangeFeeUSD: exchangeFeeUSD.toFixed(2),
        netSellingAfterExchangeUSD: netSellingAfterExchangeUSD.toFixed(2),
        totalCostUSD: totalCostUSD.toFixed(2),
        profitUSD: profitUSD.toFixed(2),
        currentProfitRate: (currentProfitRate * 100).toFixed(2) + "%",
        targetProfitRate: (targetProfitRate * 100).toFixed(2) + "%",
      });

      if(Math.abs(currentProfitRate - targetProfitRate) < tolerance) {
        const priceJPY = Math.ceil(mid * exchangeRateUSDtoJPY * 100) / 100;
        console.log(`✅ 収束: ${priceJPY} 円 (USD: ${mid.toFixed(2)})`);
        return priceJPY;
      }

      if(currentProfitRate < targetProfitRate) {
        low = mid;
      } else {
        high = mid;
      }
  } 
    const finalPriceJPY = Math.ceil(low * exchangeRateUSDtoJPY * 100) / 100;
    console.log(`⚠ 最大試行回数到達: ${finalPriceJPY} 円 (USD: ${(low).toFixed(2)})`);
    return finalPriceJPY;
}
  // const totalCostUSD = costPriceUSD + shippingUSD;

  // let estimatedSellingPriceUSD = 1; 
  // const maxIterations = 100;        


  // for (let i = 0; i < maxIterations; i++) {
 
  //   const { totalFeesUSD } = calculateFees(
  //     estimatedSellingPriceUSD,
  //     categoryFeePercent,
  //     paymentFeePercent,
  //     finalValueFee,
  //     stateTaxRate
  //   );


  //   const netSellingUSD = estimatedSellingPriceUSD - totalFeesUSD;

  //   const exchangeFeeUSD = (netSellingUSD * exchangeFeePerUSD) / estimatedSellingPriceUSD;

  //   const netSellingAfterExchangeUSD = netSellingUSD - exchangeFeeUSD;

  //   const profitUSD = netSellingAfterExchangeUSD - totalCostUSD;

   
  //   const currentProfitRate = profitUSD / netSellingAfterExchangeUSD;
  //   const diff = targetProfitRate - currentProfitRate;

  //   if (Math.abs(diff) < tolerane) break;

   
  //   estimatedSellingPriceUSD *= 1 + diff * 0.5;
  // }

  // return Math.ceil(estimatedSellingPriceUSD * exchangeRateUSDtoJPY * 100) / 100;

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
