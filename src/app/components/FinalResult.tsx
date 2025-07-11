"use client";

import { FinalProfitDetailUS } from '@/types/profitCalc';



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
    <div className="p-4 border rounded-lg shadow space-y-2 bg-white">
      <h2 className="text-lg font-bold mb-2">【最終利益の詳細】</h2>

      <div className="space-y-1">
        <p>■ 売上 (税抜) : ${data.sellingPrice.toFixed(2)} / ￥{Math.round(data.sellingPrice * exchangeRateUSDtoJPY).toLocaleString()}</p>
        <p>■ 州税込売上 : ${data.sellingPriceInclTax.toFixed(2)} / ￥{Math.round(data.sellingPriceInclTax * exchangeRateUSDtoJPY).toLocaleString()}</p>

        <div className="border-t border-gray-300 my-2" />

        <p>■ 配送方法 : {shippingMethod.toLocaleString()}</p>
        <p>■ 配送料 : ${(shippingJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{shippingJPY.toLocaleString()}</p>
        <p>■ 仕入れ : ${(data.costPrice / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.costPrice.toLocaleString()}</p>

        <div className="border-t border-gray-300 my-2" />

        <p className="text-gray-600 font-semibold my-1">【州税込売上から計算】</p>
        <p>■ カテゴリ手数料 : ${(categoryFeeJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{categoryFeeJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p>■ 決済手数料 : ${(data.paymentFeeJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.paymentFeeJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p>■ 手数料税 : ${(data.feeTaxJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.feeTaxJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p>■ Payoneer手数料 : ${(data.payoneerFeeJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.payoneerFeeJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>


        <div className="border-t border-gray-300 my-2" />

        <p>■ 粗利 (売上 - 仕入 - 配送) :${(data.grossProfitJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.grossProfitJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p>■ 最終利益（手数料引後） : ${(data.netProfitJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.netProfitJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <div className="p-4 border rounded-lg shadow bg-white">
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 mb-4 rounded">
            <p className="text-lg font-bold text-yellow-800">
              ■ スプレッドシート方式利益 : ${(data.spSheetRevenueAfterFeesJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.spSheetRevenueAfterFeesJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 bg-green-50 border-l-4 border-green-500 mb-4 rounded">
            <p className="text-lg font-bold text-green-800">
              ■ スプレッドシート方式最終損益 : ${(data.spSheetNetProfitJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.spSheetNetProfitJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 bg-violet-50 border-l-4 border-green-500 rounded">
            <p className="text-lg font-bold text-green-800">
              ■ スプレッドシート方式利益率 : {data.spSheetProfitMargin.toFixed(2)}%</p> 
          </div>
        </div>

        <p>■ 利益率 : {data.profitMargin.toFixed(2)}%</p>

        <div className="border-t border-gray-300 my-2" />

        <p className="text-gray-500 text-sm">
          ※ 税還付金（参考） : ${(data.exchangeAdjustmentJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.exchangeAdjustmentJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}（計算には含めていません）
          <br></br>
          ※ 手数料還付金（参考） :${(data.feeRebateJPY / exchangeRateUSDtoJPY).toFixed(2)} / ￥{data.feeRebateJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}（計算には含めていません）
        </p>
      </div>
    </div>
  );
}
