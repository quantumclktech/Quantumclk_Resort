import { describe, expect, it } from "vitest";
import {
  aadhaarProblem, calculateAge, cleanMobile, formatAadhaar, isValidMobile, isValidPincode, licenceProblem, maskAadhaar,
  maskLicence, maxDobFor18, parseFeeChips, rupees, toTitleCase, validateVerhoeff, verhoeffCheckDigit,
} from "./smartFields";

describe("smart fields", () => {
  it("Verhoeff matches the published example and the server", () => {
    expect(verhoeffCheckDigit("236")).toBe(3);
    expect(validateVerhoeff("2363")).toBe(true);
    expect(validateVerhoeff("2364")).toBe(false);
    const n = "23456789012" + verhoeffCheckDigit("23456789012");
    expect(validateVerhoeff(n)).toBe(true);
    expect(validateVerhoeff("32456789012" + n[11])).toBe(false);   // swapped neighbours
  });

  it("Aadhaar: formats as typed, checks 12 digits / 2–9 start / checksum, masks", () => {
    expect(formatAadhaar("2345-6789 01234567")).toBe("2345 6789 0123");
    const ok = "98765432101" + verhoeffCheckDigit("98765432101");
    expect(aadhaarProblem(ok)).toBeNull();
    expect(aadhaarProblem("1" + ok.slice(1))).toMatch(/can't start with 0 or 1/);
    expect(aadhaarProblem(ok.slice(0, 11))).toMatch(/12 digits/);
    expect(aadhaarProblem(ok.slice(0, 11) + ((Number(ok[11]) + 1) % 10))).toMatch(/typo/);
    expect(maskAadhaar(ok)).toBe("XXXX-XXXX-" + ok.slice(8));
  });

  it("driving licence: format and mask", () => {
    expect(licenceProblem("ka01 2019 0001234")).toBeNull();
    expect(licenceProblem("12345")).not.toBeNull();
    expect(maskLicence("KA01 20190001234")).toBe("XXXXXXXXXXX1234");
  });

  it("age and the 18+ date limit", () => {
    expect(calculateAge("2000-11-17", "2026-11-16")).toEqual({ age: 25, isEligible: true });
    expect(calculateAge("2008-11-16", "2026-11-16")).toEqual({ age: 18, isEligible: true });
    expect(calculateAge("2008-11-17", "2026-11-16")).toEqual({ age: 17, isEligible: false });
    expect(calculateAge("", "2026-11-16")).toBeNull();
    expect(calculateAge("2030-01-01", "2026-11-16")).toBeNull();
    expect(maxDobFor18("2026-11-16")).toBe("2008-11-16");
    expect(maxDobFor18("2028-02-29")).toBe("2010-02-28");   // same as Java minusYears
  });

  it("mobile: strips +91 / 91 / 0 and checks the 6–9 start", () => {
    expect(cleanMobile("+91 98765 43210")).toBe("9876543210");
    expect(cleanMobile("919876543210")).toBe("9876543210");
    expect(cleanMobile("09876543210")).toBe("9876543210");
    expect(isValidMobile("9876543210")).toBe(true);
    expect(isValidMobile("5876543210")).toBe(false);
  });

  it("text, pincode and money helpers", () => {
    expect(toTitleCase("  anoop   kumar ")).toBe("Anoop Kumar");
    expect(toTitleCase("BELAGAVI")).toBe("Belagavi");
    expect(toTitleCase("D'Souza")).toBe("D'Souza");
    expect(isValidPincode("590001")).toBe(true);
    expect(isValidPincode("012345")).toBe(false);
    expect(rupees(25000)).toBe("₹25,000");
    expect(parseFeeChips("25000, 30000,abc,,0")).toEqual([25000, 30000]);
    expect(parseFeeChips(undefined)).toEqual([]);   // not configured: no chips (Q-030)
  });
});
