// backend/src/utils/pricing.ts
export function calculatePrice(
  weight: number,
  serviceType: string,
  origin: string,
  destination: string
): number {
  const baseRates: Record<string, number> = {
    AIR_EXPRESS: 25,
    AIR_ECONOMY: 15,
    MARITIME: 5,
    BUSINESS: 35
  };
  
  const ratePerKg = baseRates[serviceType] || 15;
  let price = ratePerKg * weight;
  
  // Minimum price
  const minPrices: Record<string, number> = {
    AIR_EXPRESS: 50,
    AIR_ECONOMY: 35,
    MARITIME: 20,
    BUSINESS: 100
  };
  
  price = Math.max(price, minPrices[serviceType] || 30);
  
  return Math.round(price * 100) / 100;
}