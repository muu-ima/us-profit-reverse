// types/profitCalc.ts

export interface ProfitCalcParamsUS {
    sellingPrice: number; //USD
    costPrice: number; //JPY
    shippingJPY: number; //JPY
    categoryFeePercent: number; // %
    paymentFeePercent: number; //%
    exchangeRateUSDtoJPY: number;
    targetMargin?: number;
}

export interface FinalProfitDetailUS {
    totalCostJPY: number;           // 仕入れ+送料 (JPY)
    grossProfitUSD: number;         // 州税後の売上 - 手数料 (USD)
    profitMargin: number;           // 利益率 (%)
    suggestedPrice: number; // ← JPY版を追加
    suggestedPriceUSD: number;      // USDベースでの推奨売値
    feeTaxJPY: number;              //手数料Tax (JPY)
    feeTaxUSD: number;              // 手数料Tax (USD)
    exchangeAdjustmentJPY: number;  // USD→JPYでの調整額 (JPY)
    feeRebateJPY: number;
    categoryFeeUSD: number;
    categoryFeeJPY: number;
    payoneerFeeJPY: number;
    payoneerFeeUSD: number;
    netProfitJPY: number;
    grossProfitJPY: number;  // 売上JPY - 仕入れJPY - 送料JPY
    sellingPrice: number;           // USD (税抜)
    sellingPriceInclTax: number;   // USD (州税込)
    costPrice: number;             // 円 (仕入れ値)
    paymentFeeJPY: number;  // ← 追加
    paymentFeeUSD: number;
    spSheetNetProfitJPY: number; //spシートテスト用
    spSheetRevenueAfterFeesJPY: number;
}
