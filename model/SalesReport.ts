export interface SalesReport {
  type: "shoes" | "sandals" | "accessories";
  data: [
    {
      itemId: string;
      manufacturer: string;
      brand: string;
      itemName: string;
      data: [
        {
          variantId: string;
          variantName: string;
          data: [
            {
              size: string;
              quantity: number;
              soldPrice: number;
              boughtPrice: number;

              totalSale: number;
              totalCost: number;
              totalProfit: number;
            }
          ];
        }
      ];
    }
  ];
}
