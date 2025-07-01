"use client";

// import { isUnder135GBP, applyVAT } from "@/lib/vatRule";

type FinalProfitDetail = {
  customsFee: number;
  platformFee: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  vatAmount?: number;         // 追加（任意）
  priceIncludingVAT?: number; // 追加（任意）
  suggestedPrice: number;
  targetMargin: number;
};

type FinalResultProps = {
  shippingMethod: string;
  shippingJPY: number;
  categoryFeeJPY: number;
  data: FinalProfitDetail;
};



export default function FinalResult({
  shippingMethod,
  shippingJPY,
  categoryFeeJPY,
  data,
}: FinalResultProps) {
  return (
    <div className="p-4 border rounded-lg shadow space-y-2">
      <h2 className="text-lg font-bold">最終利益の詳細</h2>
      <p className="text-yellow-600 font-medium">目標利益率: {(data.targetMargin * 100).toFixed(2)}%</p>
      <p>配送方法: {shippingMethod}</p>
      <p>配送料: {shippingJPY.toLocaleString()} 円</p>
      <p>カテゴリ手数料: {categoryFeeJPY.toLocaleString(undefined, { maximumFractionDigits: 0})} 円</p>
      {data.vatAmount !== undefined && (
        <p>VAT額: {data.vatAmount.toLocaleString(undefined, {maximumFractionDigits: 0})} 円</p>
      )}
      {data.priceIncludingVAT !== undefined && (
        <p>VAT込み価格: {data.priceIncludingVAT.toLocaleString(undefined, {maximumFractionDigits :0})} 円</p>
      )}
      <p>関税: {data.customsFee.toLocaleString(undefined, {maximumFractionDigits: 0})} 円</p>
      <p>プラットフォーム手数料: {data.platformFee.toLocaleString()} 円</p>
      <p>実費合計: {data.totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})} 円</p>
      <p>粗利: {data.profit.toLocaleString(undefined, {maximumFractionDigits: 0})} 円</p>
      <p>利益率: {data.profitMargin.toFixed(2)}%</p>
      <p className="font-bold text-green-600">
        最終利益: {data.profit.toLocaleString(undefined,{maximumFractionDigits: 0})} 円
      </p>
      <p className="text-green-700 font-semibold text-lg">推奨売値: ￥{Math.ceil(data.suggestedPrice).toLocaleString()}</p>    
    </div>
  );
}
