// lib/price.ts

const GBP_THRESHOLD = 135;
const VAT_RATE = 0.2;

/**
 * GBP価格に為替をかけてJPY価格を返す
 * @param gbp GBP価格
 * @param rate 為替レート (手数料調整込み)
 * @returns 円価格 (四捨五入)
 */

export function convertToJPY(gbp: number, rate: number): number {
    return Math.round(gbp * rate);
}

/**
 * 135ポンド以下かどうかを判定
 * @param priceGBP GBP価格
 */

export function isUnder135GBP(priceGBP: number): boolean {
    return priceGBP <= GBP_THRESHOLD;
}

/**
 * VAT加算後の価格を返す(GBP単位)
 * @param priceGBP GBP価格
 */
export function applyVAT(priceGBP: number): number {
    return priceGBP * (1 + VAT_RATE);
}

/**
 * VAT金額のみ返す(GBP単位)
 * @param priceGBP GBP価格
 */
export function calculateVAT(priceGBP: number): number {
    return priceGBP * VAT_RATE; 
}

