import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatTime,
  formatNumber,
  formatBytes,
  formatCurrency,
  truncateText,
  formatDuration,
  formatPercentage,
  formatTokenCount,
} from "@/utils/format";

describe("format utilities", () => {
  describe("formatDate", () => {
    it("formats date objects", () => {
      const date = new Date("2024-03-15T12:00:00Z");
      const result = formatDate(date);
      expect(result).toMatch(/Mar 15, 2024/);
    });

    it("formats date strings", () => {
      const result = formatDate("2024-01-01");
      expect(result).toMatch(/Jan 1, 2024/);
    });
  });

  describe("formatTime", () => {
    it("formats time with 12-hour format", () => {
      const date = new Date("2024-03-15T14:30:00Z");
      const result = formatTime(date);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("formatNumber", () => {
    it("formats numbers with commas", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("formats compact numbers", () => {
      expect(formatNumber(1500, { compact: true })).toBe("1.5K");
      expect(formatNumber(1500000, { compact: true })).toBe("1.5M");
      expect(formatNumber(1500000000, { compact: true })).toBe("1.5B");
    });
  });

  describe("formatBytes", () => {
    it("formats zero bytes", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("formats bytes", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });

    it("formats with custom decimals", () => {
      expect(formatBytes(1536, 1)).toBe("1.5 KB");
    });
  });

  describe("formatCurrency", () => {
    it("formats USD currency", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1,234.56");
    });

    it("formats zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0.00");
    });
  });

  describe("truncateText", () => {
    it("returns original text if shorter than max", () => {
      expect(truncateText("hello", 10)).toBe("hello");
    });

    it("truncates long text", () => {
      expect(truncateText("hello world", 8)).toBe("hello...");
    });

    it("uses custom suffix", () => {
      expect(truncateText("hello world", 8, "…")).toBe("hello w…");
    });
  });

  describe("formatDuration", () => {
    it("formats milliseconds", () => {
      expect(formatDuration(500)).toBe("500ms");
    });

    it("formats seconds", () => {
      expect(formatDuration(5000)).toBe("5.0s");
    });

    it("formats minutes", () => {
      expect(formatDuration(125000)).toBe("2m 5s");
    });

    it("formats hours", () => {
      expect(formatDuration(3661000)).toBe("1h 1m");
    });
  });

  describe("formatPercentage", () => {
    it("formats decimal to percentage", () => {
      expect(formatPercentage(0.1234)).toBe("12.3%");
    });

    it("formats with custom precision", () => {
      expect(formatPercentage(0.12345, 2)).toBe("12.35%");
    });
  });

  describe("formatTokenCount", () => {
    it("formats small token counts", () => {
      expect(formatTokenCount(500)).toBe("500 tokens");
    });

    it("formats large token counts", () => {
      expect(formatTokenCount(1500)).toBe("1.5K tokens");
    });
  });
});
