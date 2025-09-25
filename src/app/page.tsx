"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateSellingPriceFromProfitRateWithFees,
  calculateFinalProfitDetailUS,
} from "@/lib/profitCalc";
import ChatIcon from "./components/ChatIcon";
import { getCheapestShipping, ShippingData } from "@/lib/shipping";
import ExchangeRate from "./components/ExchangeRate";
import Result from "./components/Result";
import FinalResultModal from "./components/FinalResultModal";
import { FinalProfitDetailUS } from "@/types/profitCalc";

// ---- 型定義 --------------------------------------------------------------
type ShippingResult = {
  method: string;
  price: number | null;
};

type CategoryFeeType = {
  label: string;
  value: number;
  categories: string[];
};

type CalcResult = {
  shippingJPY: number;
  categoryFeeJPY: number;
  actualCost: number; // 総コスト（円）
  grossProfit: number; // 粗利益（円）
  profitMargin: number; // 利益率(%)
  method: string; // 選択配送方法
  rate: number; // 為替レート
  sellingPriceJPY: number; // 売値(円換算)
};

export default function Page() {
  // ---- State -------------------------------------------------------------
  const [shippingRates, setShippingRates] = useState<ShippingData | null>(null);
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [weight, setWeight] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });
  const [rate, setRate] = useState<number | null>(null);

  const [categoryOptions, setCategoryOptions] = useState<CategoryFeeType[]>([]);
  const [selectedCategoryFee, setSelectedCategoryFee] = useState<number | "">("");

  // 目標利益率（%入力 / 文字列で保持）
  const [targetProfitRate, setTargetProfitRate] = useState<string>("");

  // 計算結果
  const [resultUSD, setResultUSD] = useState<{ priceUSD: number; priceJPY: number } | null>(null);
  const [result, setResult] = useState<ShippingResult | null>(null);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [final, setFinal] = useState<FinalProfitDetailUS | null>(null);

  // モーダル
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---- 初期データ読込 -----------------------------------------------------
  useEffect(() => {
    fetch("/data/shipping.json")
      .then((res) => res.json())
      .then((data) => setShippingRates(data));
  }, []);

  useEffect(() => {
    fetch("/data/categoryFees.json")
      .then((res) => res.json())
      .then((data) => setCategoryOptions(data));
  }, []);

  useEffect(() => {
    if (rate !== null) {
      console.log(`最新為替レート：${rate}`);
    }
  }, [rate]);

  // 重量・サイズが揃ったら最安配送を計算
  useEffect(() => {
    if (shippingRates && weight !== null && weight > 0) {
      const cheapest = getCheapestShipping(shippingRates, weight, dimensions);
      setResult(cheapest);
    }
  }, [shippingRates, weight, dimensions]);

  // 目標利益率（小数）を都度メモ化
  const targetProfitRateNumber = useMemo(
    () => (targetProfitRate === "" ? 0 : Number(targetProfitRate) / 100),
    [targetProfitRate]
  );

  // ボタン活性条件（参考：モーダルボタン）
  const isEnabled = useMemo(
    () =>
      resultUSD !== null &&
      costPrice !== "" &&
      rate !== null &&
      weight !== null &&
      selectedCategoryFee !== "",
    [resultUSD, costPrice, rate, weight, selectedCategoryFee]
  );

  // ---- 逆算本体：useCallback で安定化 -----------------------------------
  const handleCalculate = useCallback(
    (shippingJPYOverride?: number) => {
      console.log("handleCalculate params:", {
        isEnabled,
        costPrice,
        weight,
        rate,
        selectedCategoryFee,
        targetProfitRateNumber,
        shippingJPY: shippingJPYOverride ?? (result?.price ?? 0),
      });

      if (costPrice === "" || weight === null || rate === null) return;

      const shippingJPY = shippingJPYOverride ?? (result?.price ?? 0);
      const categoryFeePercent = Number(selectedCategoryFee) || 0;
      const paymentFeePercent = 1.35;
      const costPriceJPY = typeof costPrice === "number" ? costPrice : 0;

      console.log("入力値(JPY・%):", {
        costPriceJPY,
        shippingJPY,
        exchangeRateUSDtoJPY: rate,
        categoryFeePercent,
        paymentFeePercent,
        targetProfitRateNumber,
      });

      // 逆算で売値計算（USD）
      const priceUSD = calculateSellingPriceFromProfitRateWithFees({
        costPrice: costPriceJPY,
        shippingJPY: shippingJPY,
        targetProfitRate: targetProfitRate === "" ? 0 : Number(targetProfitRate) / 100,
        categoryFeePercent,
        paymentFeePercent,
        exchangeRateUSDtoJPY: rate!,
      });
      console.log("handleCalculate: 計算されたpriceUSD", priceUSD);
      setResultUSD(priceUSD);

      // 税抜USD単価
      const sellingPrice = priceUSD.priceUSD;

      // 中間結果（円ベースの概算）
      const newCalcResult: CalcResult = {
        shippingJPY: shippingJPY,
        categoryFeeJPY: sellingPrice * (rate ?? 0) * (categoryFeePercent / 100),
        actualCost: costPriceJPY + shippingJPY,
        grossProfit: sellingPrice * (rate ?? 0) - (costPriceJPY + shippingJPY),
        profitMargin: targetProfitRateNumber * 100, // %
        method: result?.method ?? "",
        rate: rate ?? 0,
        sellingPriceJPY: sellingPrice * (rate ?? 0),
      };
      setCalcResult(newCalcResult);

      // フィー% の逆算（見かけの% → 実効%）
      let categoryFeePercentCalc = categoryFeePercent;
      if (newCalcResult && sellingPrice && rate) {
        categoryFeePercentCalc =
          (newCalcResult.categoryFeeJPY / (sellingPrice * rate)) * 100;
      }

      // 最終利益詳細
      const finalProfitDetails = calculateFinalProfitDetailUS({
        sellingPrice,
        costPrice: costPriceJPY,
        shippingJPY,
        categoryFeePercent: categoryFeePercentCalc,
        paymentFeePercent,
        exchangeRateUSDtoJPY: rate ?? 0,
        targetMargin: targetProfitRateNumber,
      });

      console.log("finalProfitDetails: 計算されたfinalProfitDetails", finalProfitDetails);
      setFinal(finalProfitDetails);
    },
    [
      isEnabled,
      costPrice,
      weight,
      rate,
      selectedCategoryFee,
      targetProfitRate,
      targetProfitRateNumber,
      result,
    ]
  );

  // ---- 自動計算：入力が揃ったタイミングで逆算を実行 -----------------------
  useEffect(() => {
    const ready =
      costPrice !== "" &&
      weight !== null &&
      rate !== null &&
      selectedCategoryFee !== "" &&
      targetProfitRate !== "" &&
      result !== null; // ← ここで統合（余計な式は書かない）

    if (!ready) return;
    handleCalculate(result?.price ?? 0);
  }, [
    costPrice,
    weight,
    rate,
    selectedCategoryFee,
    targetProfitRate,
    result,
    handleCalculate, // ← useCallback にしたので安全に依存追加
  ]);

  // ---- モーダル -----------------------------------------------------------
  const openFinalModal = () => {
    if (!final) return;
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 w-full max-w-7xl mx-auto flex flex-col md:flex-row md:space-x-8 space-y-8 md:space-y-0">
      <div className="flex-1 flex flex-col space-y-4">
        {/* 為替レート表示コンポーネント */}
        <ExchangeRate onRateChange={setRate} />
        <div>
          <label className="block font-semibold mb-1">仕入れ値 (円) </label>
          <input
            type="number"
            step="10"
            min="10"
            value={costPrice}
            onChange={(e) => {
              const raw = e.target.value;
              //空なら空にする
              if (raw === "") {
                setCostPrice("");
                return;
              }

              //数値化
              let num = Number(raw);

              //マイナスなら0に
              if (num < 0) num = 0;


              setCostPrice(num);
            }}
            placeholder="仕入れ値"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        {/* 売値 (＄) 入力欄を削除 */}
        <div>
          <label className="block font-semibold mb-1">目標利益率 (%)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={targetProfitRate}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setTargetProfitRate("");
                return;
              }
              let num = Number(val);
              if (num < 0) num = 0;
              if (num > 100) num = 100;
              setTargetProfitRate(num.toString());
            }}
            placeholder="目標利益率"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">実重量 (g) </label>
          <input
            type="number"
            value={weight ?? ""}
            onChange={(e) =>
              setWeight(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="実重量"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">サイズ (cm)</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={dimensions.length || ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setDimensions((prev) => ({ ...prev, length: 0 }));
                  return;
                }

                let num = Number(raw);
                if (num < 0) num = 0;

                setDimensions((prev) => ({ ...prev, length: num }));
              }}
              placeholder="長さ"
              className="px-2 py-1 border rounded-md"
            />
            <input
              type="number"
              value={dimensions.width || ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setDimensions((prev) => ({ ...prev, width: 0 }));
                  return;
                }

                let num = Number(raw);
                if (num < 0) num = 0;

                setDimensions((prev) => ({ ...prev, width: num }));
              }}
              placeholder="幅"
              className="px-2 py-1 border rounded-md"
            />
            <input
              type="number"
              value={dimensions.height || ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setDimensions((prev) => ({ ...prev, height: 0 }));
                  return;
                }

                let num = Number(raw);
                if (num < 0) num = 0;

                setDimensions((prev) => ({ ...prev, height: num }));
              }}
              placeholder="高さ"
              className="px-2 py-1 border rounded-md"
            />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">カテゴリ手数料 </label>
          <select
            value={selectedCategoryFee}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedCategoryFee(v === "" ? "" : Number(v));
            }}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">カテゴリを選択してください</option>
            {categoryOptions.map((cat) => (
              <option key={cat.label} value={cat.value}>
                {cat.label} ({cat.value}%)
              </option>
            ))}
          </select>
        </div>

      </div>
      {/* 右カラム */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* 配送結果と利益結果を右側に移動する */}
        {/* 配送結果 */}
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <p>
            配送方法: {
              result === null
                ? "計算中..."
                : result.method
            }
          </p>
          <p>
            配送料: {
              result === null
                ? "計算中..."
                : result.price !== null
                  ? `${result.price}円`
                  : "不明"
            }
          </p>
        </div>


        {/* 利益結果 */}
        {rate !== null && resultUSD !== null && (
          <Result
            originalPriceUSD={resultUSD.priceUSD}  // ここを逆算売値に変更
            priceJPY={resultUSD.priceJPY}
            exchangeRateUSDtoJPY={rate ?? 0}
            calcResult={calcResult}
          />
        )}

        <button
          onClick={openFinalModal}
          disabled={!isEnabled}
          className={`btn-primary ${isEnabled ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" : "bg-gray-400 cursor-not-allowed text-gray-200"}
           px-8 py-4 text-lg rounded-full transition-colors duration-300`}
        >
          最終利益の詳細を見る
        </button>



        {isModalOpen && final && (
          <FinalResultModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            shippingMethod={result?.method || ""}
            shippingJPY={calcResult?.shippingJPY || 0}
            data={final}
            exchangeRateUSDtoJPY={rate ?? 0}
          />
        )}


      </div>
      {/* チャットアイコンをここで表示 */}
      <ChatIcon />
    </div>
  );
}
