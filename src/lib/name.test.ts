import { describe, expect, it } from "vitest";
import { nameFromEmail } from "./name";

describe("nameFromEmail", () => {
  it("builds a display name from the first two name parts", () => {
    expect(nameFromEmail("diksha.matia2027@mastersunion.org")).toBe("Diksha Matia");
    expect(nameFromEmail("kavya_s@x.com")).toBe("Kavya S");
  });
  it("drops digits and handles odd input", () => {
    expect(nameFromEmail("k2027@gmail.com")).toBe("K");
    expect(nameFromEmail("")).toBe("");
    expect(nameFromEmail(undefined)).toBe("");
    expect(nameFromEmail("12345@x.com")).toBe("");
  });
});
