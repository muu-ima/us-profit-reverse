"use client";

import { FinalProfitDetailUS } from '@/types/profitCalc';


type FinalProfitDetail = {
  customsFee: number;
  platformFee: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  suggestedPrice: number;
  targetMargin: number;
};

type FinalResultProps = {
  shippingMethod: string;
  shippingJPY: number;
  categoryFeeJPY: number;
  data: FinalProfitDetailUS;
  exchangeRateUSDtoJPY: number; // 追加
};



export default function FinalResult({
  shippingMethod,
  shippingJPY,
  categoryFeeJPY,
  data,
  exchangeRateUSDtoJPY,
}: FinalResultProps) {
  return (
    <div className="p-4 border rounded-lg shadow space-y-2">
      <h2 className="text-lg font-bold">最終利益の詳細 (US版)</h2>
      <p>配送方法: {shippingMethod}</p>
      <p>配送料: {shippingJPY.toLocaleString()} 円</p>
      <p>カテゴリ手数料: {categoryFeeJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })} 円</p>
      <p>Payoneer手数料: {data.payoneerFeeJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })} 円</p>
      <p>手数料にかかるタックス額: {data.feeTaxJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })} 円</p>
      <p>為替調整額: {data.exchangeAdjustmentJPY.toLocaleString()} 円</p>
      <p>総コスト: {data.totalCostJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })} 円</p>
      <p>粗利 (州税後の売上 - 手数料):  {(data.grossProfitUSD * exchangeRateUSDtoJPY).toLocaleString(undefined, { maximumFractionDigits: 0 })} 円</p>
      <p>最終利益 (Payoneer手数料引後): {data.netProfitJPY.toFixed(2)} 円</p>
      <p>利益率: {data.profitMargin.toFixed(2)}%</p>
      <p className="text-green-700 font-semibold text-lg">
        推奨売値: ${data.suggestedPriceUSD.toFixed(2)} USD
      </p>    </div>
  );
}
