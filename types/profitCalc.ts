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
    categoryFeeUSD: number;
    categoryFeeJPY: number;
    payoneerFeeJPY: number;
    payoneerFeeUSD: number;
    netProfitJPY: number;
}
