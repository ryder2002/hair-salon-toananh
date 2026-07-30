/**
 * Formats integer VND money amount to standard Vietnamese currency format: "12.560.000 đ"
 */
export function formatVND(amount: number | bigint | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0 đ";
  
  const numericValue = typeof amount === "string" ? parseInt(amount, 10) || 0 : Number(amount);
  
  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(numericValue);

  return `${formatted} đ`;
}

/**
 * Parses user VND input string (e.g. "12.560.000", "12560000") into clean BigInt/number
 */
export function parseVNDInput(input: string): bigint {
  const digitsOnly = input.replace(/\D/g, "");
  if (!digitsOnly) return BigInt(0);
  return BigInt(digitsOnly);
}

/**
 * Calculates commission: round(eligible_revenue * commission_rate / 100)
 */
export function calculateCommission(eligibleRevenue: bigint, commissionRate: number): bigint {
  if (eligibleRevenue <= 0n || commissionRate <= 0) return 0n;
  const rateNumerator = Math.round(commissionRate * 100);
  const rawCommission = (eligibleRevenue * BigInt(rateNumerator)) / 10000n;
  return rawCommission;
}

/**
 * Calculates total salary
 */
export function calculateTotalSalary(
  baseSalary: bigint,
  allowance: bigint,
  commissionAmount: bigint,
  bonus: bigint = 0n,
  deduction: bigint = 0n
): bigint {
  return baseSalary + allowance + commissionAmount + bonus - deduction;
}
