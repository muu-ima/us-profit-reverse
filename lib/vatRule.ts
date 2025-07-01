// lib/vatRule.ts

const GBP_THRESHOLD = 135;
const VAT_RATE = 0.2//20%

/**
 * 135ポンド未満かどうかを判定
 * @param priceGBP GBP価格
 */

export function isUnder135GBP(priceGBP: number): boolean {
    return priceGBP < GBP_THRESHOLD;
}

/**
 * VAT込み価格を返す（条件付き）
 * @param priceGBP GBP価格
 */

export function applyVAT(priceGBP: number): number {
    if  (isUnder135GBP(priceGBP)) {
        return priceGBP * (1 + VAT_RATE);
    }
    return priceGBP;
}

/**
 * VAT金額のみ (条件付き)
 * @param priceGBP GBP価格
 */

export function calculateVAT(priceGBP: number): number {
    if (isUnder135GBP(priceGBP)) {
        return priceGBP * VAT_RATE;
    }
    return 0;
}