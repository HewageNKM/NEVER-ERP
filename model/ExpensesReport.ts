export interface ExpensesReport {
  type: "expenses" | "utility";
  data: { for: string; amount: number }[];
}
