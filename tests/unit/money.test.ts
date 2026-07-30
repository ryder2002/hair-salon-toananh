import { describe, it, expect } from "vitest";
import { formatVND, parseVNDInput, calculateCommission, calculateTotalSalary } from "@/lib/money";

describe("Money Utility Functions", () => {
  it("formats integer VND numbers correctly", () => {
    expect(formatVND(12560000n)).toContain("12.560.000");
    expect(formatVND(4350000n)).toContain("4.350.000");
    expect(formatVND(0n)).toContain("0");
  });

  it("parses user input strings accurately", () => {
    expect(parseVNDInput("12.560.000 đ")).toBe(12560000n);
    expect(parseVNDInput("250000")).toBe(250000n);
    expect(parseVNDInput("abc")).toBe(0n);
  });

  it("calculates commission without floating point bugs", () => {
    // 10.490.000 * 10% = 1.049.000
    expect(calculateCommission(10490000n, 10.0)).toBe(1049000n);
    // 6.290.000 * 8% = 503.200 -> 503.200
    expect(calculateCommission(6290000n, 8.0)).toBe(503200n);
  });

  it("calculates total salary correctly", () => {
    const base = 8000000n;
    const allowance = 1000000n;
    const comm = 1049000n;
    expect(calculateTotalSalary(base, allowance, comm)).toBe(10049000n);
  });
});
