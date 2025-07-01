'use client';
import { useEffect, useState } from "react";
import { getAdjustedRate} from "@/lib/exchange";

export default function ExchangeRate({
    onRateChange,    
}: {
    onRateChange?: (rate: number | null) => void;
}) {
    const [rawRate, setRawRate] = useState<number | null>(null);
    const [adjustedRate, setAdjustedRate] = useState<number | null>(null);

    useEffect(()=> {
        fetch('https://enyukari.capoo.jp/profit-calc/exchangeRate.json')
        .then(res => res.json())
        .then(data => {
            const usdRate = data.rates?.USD ?? null;
            setRawRate(usdRate);
            setAdjustedRate(getAdjustedRate(usdRate));
            setRawRate(usdRate);
            setAdjustedRate(getAdjustedRate(usdRate));
            if (onRateChange) onRateChange(usdRate);
        })
        .catch(err => {
            console.error('為替取得エラー', err);
            setRawRate(null);
            setAdjustedRate(null);
            if (onRateChange) onRateChange(null);
        });
    }, []);

     return (
    <div className="bg-blue-100 border border-blue-400 rounded-md p-4 mb-4">
      <h2 className="text-xl font-bold">現在の為替レート</h2>
      <p>
        USD → JPY  :{" "}
        {adjustedRate !== null ? `${adjustedRate?.toFixed(2)}円` : '取得中...'}
      </p>
    </div>
  );
}