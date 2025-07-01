// lib/exchange.ts

export function getAdjustedRate(baseRate: number, fee: number = 3.3): number {
    return baseRate + fee;
}