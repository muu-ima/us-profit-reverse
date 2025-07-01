'use client';

import React from "react";
import { getAdjustedRate } from "@/lib/exchange";
import { convertToJPY } from "@/lib/price";

type CalcResult = {
    shippingJPY: number;
    categoryFeeJPY: number;
    actualCost: number;
    grossProfit: number;
    profitMargin: number;
    method: string;
};

type ResultProps = {
    originalPriceGBP: number; // 入力そのままの GBP
    priceJPY: number; // 追加：計算済みのJPY価格をpropsで受け取る
    rate: number;         // APIから取得した生レート
    calcResult: CalcResult | null;  // anyを具体的に
};

export default function Result({ originalPriceGBP, priceJPY, rate,}: ResultProps) {
    const fee = 3.3; // 為替手数料（固定値でも可、将来的にprops化も可能）

    // 生レートに手数料を足して調整したレートを作る
    const adjustedRate = getAdjustedRate(rate, fee);

       // finalJPYを計算：手数料込みレートで換算
    const finalJPY = originalPriceGBP * adjustedRate;
    return (
        <div className="result-box p-4 border rounded bg-gray-50">
            <p>GBP価格(ポンド): ＄{originalPriceGBP.toFixed(1)}</p>
            <p>円換算価格: ￥{priceJPY.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
            <p>為替レート (手数料込み): {adjustedRate.toFixed(2)} 円</p>
            <p className="font-bold text-lg mt-2">概算価格: ￥{finalJPY.toLocaleString()}</p>
        </div>
    );
}