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
    originalPriceUSD: number; // 入力そのままの GBP
    priceJPY: number; // 追加：計算済みのJPY価格をpropsで受け取る
    exchangeRateUSDtoJPY: number; // もしJSX内で円換算するなら
    calcResult: CalcResult | null;  // anyを具体的に
};

const stateTaxRate = 0.0671; // 州税率（約6.71%）

export default function Result({ originalPriceUSD, priceJPY,
    exchangeRateUSDtoJPY,calcResult }: ResultProps) {

    const priceJPYIncTax = priceJPY * (1 + stateTaxRate);

    return (
        <div className="result-box p-4 border rounded bg-gray-50">
            <p>USD価格(州税抜き): ＄{(originalPriceUSD).toFixed(2)}</p>
            <p>USD価格(州税込み): ＄{(originalPriceUSD * (1 +stateTaxRate)).toFixed(2)}</p>
            <p>
                円換算価格(州税抜き): ￥
                {priceJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p> 
            <p>円換算価格(州税込み): ￥{priceJPYIncTax.toLocaleString(undefined, { maximumFractionDigits:0 })}</p>       
            </div>
    );
}