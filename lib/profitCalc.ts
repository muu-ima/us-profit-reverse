// lib/profitCalc.ts

import { ProfitCalcParamsUS, FinalProfitDetailUS } from '@/types/profitCalc';

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
