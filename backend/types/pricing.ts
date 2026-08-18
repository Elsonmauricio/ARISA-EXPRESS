// backend/src/utils/pricing.ts
// NÃO UTILIZADO: Nenhuma rota/chamada usa este utilitário no momento.
//
// export function calculatePrice(
//   weight: number,
//   serviceType: string,
//   origin: string,
//   destination: string
// ): number {
//   const baseRates: Record<string, number> = {
//     REDIRECT: 25,
//     COURIER: 15,
//     PERSONAL_SHOPPER: 5,
//     BUSINESS: 35
//   };
//
//   const ratePerKg = baseRates[serviceType] || 15;
//   let price = ratePerKg * weight;
//
//   const minPrices: Record<string, number> = {
//     REDIRECT: 50,
//     COURIER: 35,
//     PERSONAL_SHOPPER: 20,
//     BUSINESS: 100
//   };
//
//   price = Math.max(price, minPrices[serviceType] || 30);
//
//   return Math.round(price * 100) / 100;
// }