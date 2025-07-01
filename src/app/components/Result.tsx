'use client';

import React from "react";


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
    calcResult: CalcResult | null;  // anyを具体的に
};

export default function Result({ originalPriceGBP, priceJPY,}: ResultProps) {
   
       // finalJPYを計算：手数料込みレートで換算
    const finalJPY = originalPriceGBP;
    return (
        <div className="result-box p-4 border rounded bg-gray-50">
            <p>USD価格(ドル): ＄{originalPriceGBP.toFixed(1)}</p>
            <p>円換算価格: ￥{priceJPY.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
            <p className="font-bold text-lg mt-2">概算価格: ￥{finalJPY.toLocaleString()}</p>
        </div>
    );
}