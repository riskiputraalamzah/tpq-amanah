import test from "node:test";
import assert from "node:assert/strict";
import { parseMoney, formatThousands, formatRupiah, caretAfterFormat, moneyInputState, terbilang, MONEY_MAX } from "../src/utils/money.js";

test("parse: what is typed or pasted becomes a plain integer", () => {
  assert.equal(parseMoney("1033223"), 1033223);
  assert.equal(parseMoney("1.033.223"), 1033223);
  assert.equal(parseMoney("Rp 1.033.223,00"), 1033223, "cents from a bank app are dropped");
  assert.equal(parseMoney("Rp1.000.000,50"), 1000000);
  assert.equal(parseMoney("00500"), 500, "leading zeros");
  assert.equal(parseMoney("0"), 0);
  assert.equal(parseMoney(""), null);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney(null), null);
  assert.equal(parseMoney(" 25 000 "), 25000);
});

test("format: thousand dots, no decimals", () => {
  assert.equal(formatThousands(1033223), "1.033.223");
  assert.equal(formatThousands(500), "500");
  assert.equal(formatThousands(1000), "1.000");
  assert.equal(formatThousands(0), "0");
  assert.equal(formatThousands(""), "");
  assert.equal(formatThousands(null), "");
  assert.equal(formatThousands(35000.9), "35.000");
  assert.equal(formatRupiah(13000), "Rp13.000");
  assert.equal(formatRupiah(0), "Rp0");
});

test("typing keeps the caret after the same digit, whatever dots appear or go", () => {
  // "1000|" typed into "100": becomes "1.000|"
  assert.equal(caretAfterFormat("1000", 4, "1.000"), 5);
  // a digit typed in the middle: "1.0|5.000" -> 3 digits before the caret
  assert.equal(caretAfterFormat("1.05.000", 4, "105.000"), 3);
  // deleting the dot's left digit: "1|000" -> "1.000"? (from "1.000" backspace after the dot)
  assert.equal(caretAfterFormat("1000", 1, "1.000"), 1);
  assert.equal(caretAfterFormat("", 0, ""), 0);
  assert.equal(caretAfterFormat("0", 1, "0"), 1);
});

test("the input's state: value kept as a number, shown with dots; too many digits are not taken", () => {
  assert.deepEqual(moneyInputState("1033223"), { value: 1033223, text: "1.033.223" });
  assert.deepEqual(moneyInputState(""), { value: null, text: "" });
  assert.deepEqual(moneyInputState("12345", { max: 9999 }), { value: 1234, text: "1.234" });
  assert.ok(moneyInputState("9".repeat(20)).value <= MONEY_MAX);
});

test("terbilang (spelled out), as on a receipt", () => {
  const cases = {
    0: "nol rupiah",
    1: "satu rupiah",
    11: "sebelas rupiah",
    15: "lima belas rupiah",
    20: "dua puluh rupiah",
    100: "seratus rupiah",
    115: "seratus lima belas rupiah",
    1000: "seribu rupiah",
    1500: "seribu lima ratus rupiah",
    5000: "lima ribu rupiah",
    13000: "tiga belas ribu rupiah",
    35000: "tiga puluh lima ribu rupiah",
    100000: "seratus ribu rupiah",
    111111: "seratus sebelas ribu seratus sebelas rupiah",
    1000000: "satu juta rupiah",
    1033223: "satu juta tiga puluh tiga ribu dua ratus dua puluh tiga rupiah",
    2500000000: "dua miliar lima ratus juta rupiah",
    1000000000000: "satu triliun rupiah",
  };
  for (const [n, words] of Object.entries(cases)) assert.equal(terbilang(Number(n)), words, n);
});

test("Backspace right after a dot removes the digit before it; Delete right before a dot the digit after", async () => {
  const { deleteAcrossSeparator, moneyInputState, caretAfterFormat } = await import("../src/utils/money.js");
  // "12.|033.223" + Backspace removes only the dot -> "12033.223": take the "2" instead
  const back = deleteAcrossSeparator("12.033.223", "12033.223", 2, "backward");
  assert.deepEqual(back, { typed: "1033223", caret: 1 });
  const st = moneyInputState(back.typed);
  assert.equal(st.text, "1.033.223");
  assert.equal(caretAfterFormat(back.typed, back.caret, st.text), 1, "caret after the 1");
  // "12|.033.223" + Delete removes the dot -> take the "0"
  assert.deepEqual(deleteAcrossSeparator("12.033.223", "12033.223", 2, "forward"), { typed: "1233223", caret: 2 });
  // a normal Backspace that removed a digit: nothing to fix
  assert.equal(deleteAcrossSeparator("12.033.223", "12.03.223", 5, "backward"), null);
  assert.equal(deleteAcrossSeparator("", "", 0, "backward"), null);
});
