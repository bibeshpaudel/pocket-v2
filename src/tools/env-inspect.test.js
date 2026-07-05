// Unit tests for the pure parts of the Environment Inspector engine.
import { describe, it, expect } from "vitest";
import { parseUserAgent, detectDeviceType, fmtBytes } from "./env-inspect.js";

const UA = {
  chromeWin:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  edgeWin:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87",
  firefoxLinux:
    "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  chromeIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  samsungTablet:
    "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Safari/537.36",
};

describe("parseUserAgent", () => {
  it("detects Chrome on Windows", () => {
    const p = parseUserAgent(UA.chromeWin);
    expect(p.browser).toBe("Chrome");
    expect(p.version).toBe("126.0.0.0");
    expect(p.engine).toBe("Blink");
    expect(p.os).toBe("Windows 10 / 11");
  });

  it("detects Edge before Chrome (fork ordering)", () => {
    const p = parseUserAgent(UA.edgeWin);
    expect(p.browser).toBe("Microsoft Edge");
    expect(p.version).toBe("126.0.2592.87");
    expect(p.engine).toBe("Blink");
  });

  it("detects Firefox on Linux", () => {
    const p = parseUserAgent(UA.firefoxLinux);
    expect(p.browser).toBe("Firefox");
    expect(p.version).toBe("127.0");
    expect(p.engine).toBe("Gecko");
    expect(p.os).toBe("Linux");
  });

  it("detects Safari on macOS", () => {
    const p = parseUserAgent(UA.safariMac);
    expect(p.browser).toBe("Safari");
    expect(p.version).toBe("17.5");
    expect(p.engine).toBe("WebKit");
    expect(p.os).toBe("macOS 10.15.7");
  });

  it("detects Safari on iPhone with iOS version", () => {
    const p = parseUserAgent(UA.safariIphone);
    expect(p.browser).toBe("Safari");
    expect(p.os).toBe("iOS 17.5");
    expect(p.engine).toBe("WebKit");
  });

  it("detects Chrome on iOS as WebKit (CriOS)", () => {
    const p = parseUserAgent(UA.chromeIos);
    expect(p.browser).toBe("Chrome (iOS)");
    expect(p.engine).toBe("WebKit");
  });

  it("detects Samsung Internet before Chrome", () => {
    const p = parseUserAgent(UA.samsungTablet);
    expect(p.browser).toBe("Samsung Internet");
    expect(p.os).toBe("Android 13");
  });

  it("handles empty / garbage input without throwing", () => {
    expect(parseUserAgent("").browser).toBe("Unknown");
    expect(parseUserAgent(undefined).os).toBe("Unknown");
    expect(parseUserAgent("lol not a ua").engine).toBe("Unknown");
  });
});

describe("detectDeviceType", () => {
  it("classifies desktops", () => {
    expect(detectDeviceType({ ua: UA.chromeWin, maxTouchPoints: 0, width: 1920 })).toBe("Desktop");
  });
  it("classifies phones", () => {
    expect(detectDeviceType({ ua: UA.safariIphone, maxTouchPoints: 5, width: 390 })).toBe("Mobile");
    expect(detectDeviceType({ ua: UA.chromeAndroid, maxTouchPoints: 5, width: 412 })).toBe("Mobile");
  });
  it("classifies Android tablets (no Mobile token)", () => {
    expect(detectDeviceType({ ua: UA.samsungTablet, maxTouchPoints: 10, width: 800 })).toBe("Tablet");
  });
  it("spots iPads pretending to be Macs via touch points", () => {
    expect(detectDeviceType({ ua: UA.safariMac, maxTouchPoints: 5, width: 1024 })).toBe("Tablet (iPad in desktop mode)");
  });
  it("defaults to Desktop with no signals", () => {
    expect(detectDeviceType({})).toBe("Desktop");
  });
});

describe("fmtBytes", () => {
  it("formats byte counts", () => {
    expect(fmtBytes(0)).toBe("0 B");
    expect(fmtBytes(512)).toBe("512 B");
    expect(fmtBytes(2048)).toBe("2 KB");
    expect(fmtBytes(1536)).toBe("1.5 KB");
    expect(fmtBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(fmtBytes(120 * 1024 * 1024 * 1024)).toBe("120 GB");
  });
  it("returns null for non-numbers", () => {
    expect(fmtBytes(null)).toBe(null);
    expect(fmtBytes(undefined)).toBe(null);
  });
});
