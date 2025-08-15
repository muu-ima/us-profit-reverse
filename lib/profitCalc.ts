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
  // 州税込売上(USD)
  const sellingPriceInclTax = sellingPrice * (1 + STATE_TAX_RATE);
  // 州税込売上(JPY)
  const revenueJPYInclTax = sellingPriceInclTax * exchangeRateUSDtoJPY;
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

  // 利益率 (%): 州税抜売上を母数にする
  const profitMargin = revenueJPYExclTax === 0 ? 0 : (profitJPY / revenueJPYExclTax) * 100;



  // ▼ UIで「逆変換」しなくていいように、JPY版も同時に持たせる
  const sellingPriceJPY = Math.round(sellingPrice * exchangeRateUSDtoJPY);
  const sellingPriceInclTaxJPY = Math.round(sellingPriceInclTax * exchangeRateUSDtoJPY);
  const categoryFeeJPY = Math.round(categoryFeeUSD * exchangeRateUSDtoJPY);
  const paymentFeeJPY = Math.round(paymentFeeUSD * exchangeRateUSDtoJPY);
  const feeTaxJPY = Math.round(feeTaxUSD * exchangeRateUSDtoJPY);
  const payoneerFeeJPY = Math.round(payoneerFeeUSD * exchangeRateUSDtoJPY);
  const finalValueFeeJPY = Math.round(FINAL_VALUE_FEE * exchangeRateUSDtoJPY);

  return {
    grossProfitUSD: sellingPrice - (categoryFeeUSD + paymentFeeUSD + feeTaxUSD + FINAL_VALUE_FEE),
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
    sellingPriceInclTaxJPY,
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
 const toJPY = (usd: number) => usd * exchangeRateUSDtoJPY;
  // const costPriceUSD = costPrice / exchangeRateUSDtoJPY;
  // const shippingUSD = shippingJPY / exchangeRateUSDtoJPY;

  // let low = costPriceUSD + shippingUSD;
  // let high = low * 10;

  // const tolerance = 0.0001;

  // for (let i = 0; i < 100; i++) {
  //   const mid = (low + high) / 2;

  //   // 手数料計算
  //   const {
  //     totalFeesUSD,
  //   } = calculateFees(mid, categoryFeePercent, paymentFeePercent);

  //   const netSellingUSD = mid - totalFeesUSD;

  //   // 両替手数料をUSDに換算 (JPY換算してからUSDに戻す形)
  //   const exchangeFeeUSD = (netSellingUSD * EXCHANGE_FEE_PER_USD) / exchangeRateUSDtoJPY;

  //   const netSellingAfterExchangeUSD = netSellingUSD - exchangeFeeUSD;

  //   const totalCostUSD = costPriceUSD + shippingUSD;

  //   const profitUSD = netSellingAfterExchangeUSD - totalCostUSD;

  //   const currentProfitRate = profitUSD / totalCostUSD;

  //   if (Math.abs(currentProfitRate - targetProfitRate) < tolerance) {
  //     const priceJPY = Math.ceil(mid * exchangeRateUSDtoJPY * 100) / 100;
  //     return { priceUSD: mid, priceJPY };
  //   }

  //   if (currentProfitRate < targetProfitRate) {
  //     low = mid;
  //   } else {
  //     high = mid;
  //   }
  // }

  // const finalPriceJPY = Math.ceil(low * exchangeRateUSDtoJPY * 100) / 100;
  // return { priceUSD: low, priceJPY: finalPriceJPY };
  // 便宜上USD ⇔ JPY変換の補助
  // const toJPY = (usd:number) => usd * exchangeRateUSDtoJPY;
  // const toUSD = (jpy:number) => jpy / exchangeRateUSDtoJPY;

  // // 探索範囲 (税抜USD売値Sの下限/上限)
  // const costPriceUSD = toUSD(costPrice);
  // const shippingPriceUSD = toUSD(shippingJPY);
  // let low = Math.max(1, costPriceUSD + shippingPriceUSD); // 下限は原価＋送料相当以上 
  // let high = low * 10;

  // const tolerance = 1e-6;

  // // 目標利益率(税抜売上ベース)を満たす税抜売値Sを二分探索
  // for(let i = 0; i < 100; i++){
  //   const S = (low + high) / 2;             // 税抜売上(USD)
  //   const R = S * (1 + STATE_TAX_RATE);     //州税込売上(USD)

  //   // 手数料は 「州税込売上ベース」で計算(finalと競合)
  //   const { categoryFeeUSD, paymentFeeUSD, feeTaxUSD, payoneerFeeUSD} =
  //     calculateFees(R, categoryFeePercent, paymentFeePercent);
      
  //   // 固定FEEもUSD側で控除
  //   const totalFeesUSD = categoryFeeUSD + paymentFeeUSD + feeTaxUSD + payoneerFeeUSD + FINAL_VALUE_FEE;
  //   const netSellingUSD = S - totalFeesUSD;

  //   // 両替手数料 (JPY, 1USDあたり固定額)
  //   const exchangeFeeJPY = netSellingUSD * EXCHANGE_FEE_PER_USD;

  //   // 正味JPY売上　= USD正味売上をJPY化　-　両替手数料
  //   const netSellingJPY = toJPY(netSellingUSD) - exchangeFeeJPY;

  //   // 還付前利益 (JPY)
  //   const netProfitJPY = netSellingJPY - costPrice - shippingJPY;
    
  //   // 還付金 (JPY)
  //   const feeRebateJPY = feeTaxUSD * exchangeRateUSDtoJPY;
  //   const exchangeAdjustmentJPY = (costPrice * 10) / 110;
    
  //   // 最終利益 (JPY)
  //   const profitJPY = netProfitJPY + exchangeAdjustmentJPY + feeRebateJPY;

  //   // 利益率 = 最終利益 / 税抜売上 (JPY)
  //   const revenueJPYExcl = toJPY(S);
  //   const currentProfitRate = revenueJPYExcl === 0 ? 0 : (profitJPY / revenueJPYExcl);

  //   if(Math.abs(currentProfitRate - targetProfitRate) < tolerance) {
  //     const priceUSD = S;
  //     const priceJPY = Math.ceil(toJPY(priceUSD) * 100) / 100;
  //     return{ priceUSD, priceJPY};
  //   }
  //   if(currentProfitRate < targetProfitRate) {
  //     low = S;
  //   } else {
  //     high = S;
  //   }
  // }
  // //　非収束時はlow側を採用
  // const priceUSD = low;
  // const priceJPY = Math.ceil(toJPY(priceUSD) * 100) / 100;
  // return { priceUSD, priceJPY};

  //Final の本番計算を用いて "いまの売値Sでの利益率"を評価
  const rateFromS = (S: number) => {
    const detail = calculateFinalProfitDetailUS({
      sellingPrice: S,                 // 税抜USD
      costPrice,
      shippingJPY,
      categoryFeePercent,
      paymentFeePercent,
      exchangeRateUSDtoJPY,   
    });
    // ※ profitMargin は "税抜分母" で算出されている前提 (%表記)
    return detail.profitMargin / 100; //0～1 に変換
  };

  // 探索範囲:指数的に上限を広げて「目標に到達する価格帯」を見つける
  let low = 1;
  let high = 2;
  while (rateFromS(high) < targetProfitRate && high < 1e9) {
    high *= 2;
  }

  const tolerance = 1e-6;
  for(let i = 0; i < 100; i++){
    const mid = (low + high) / 2;
    const r = rateFromS(mid);
    if(Math.abs(r - targetProfitRate) < tolerance) {
      const priceUSD = mid;
      const priceJPY = Math.ceil(toJPY(priceUSD) * 100) / 100; // 表示用の丸めのみ
    return { priceUSD, priceJPY};
    }
    if (r < targetProfitRate) low = mid; else high = mid;
  }
  // 収束しきらない場合も中央値で返す (十分近い)
  const priceUSD = (low + high) / 2;
  const priceJPY = Math.ceil(toJPY(priceUSD) * 100) / 100;
  return { priceUSD, priceJPY};
}
/**
 * カテゴリ手数料額を計算する (US)
 */
// export function calculateCategoryFeeUS(
//   sellingPrice: number,
//   categoryFeePercent: number
// ): number {
//   return sellingPrice * (categoryFeePercent / 100);
// }

/**
 * 配送料（USD）をJPYに換算する
 */
// export function convertShippingPriceToJPY(
//   shippingPriceUSD: number,
//   exchangeRateUSDtoJPY: number
// ): number {
//   return shippingPriceUSD * exchangeRateUSDtoJPY;
// }

/**
 * 実費合計を計算する
 */
// export function calculateActualCost(
//   costPrice: number,
//   shippingJPY: number,
//   categoryFeeJPY: number
// ): number {
//   return costPrice + shippingJPY + categoryFeeJPY;
// }

/**
 * 粗利を計算する
 */
// export function calculateGrossProfit(
//   sellingPriceJPY: number,
//   actualCostJPY: number
// ): number {
//   return sellingPriceJPY - actualCostJPY;
// }

/**
 * 利益率を計算する
 */
// export function calculateProfitMargin(
//   grossProfit: number,
//   sellingPrice: number
// ): number {
//   if (sellingPrice === 0) return 0;
//   return (grossProfit / sellingPrice) * 100;
// }
