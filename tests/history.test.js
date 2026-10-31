import test from "node:test";
import assert from "node:assert/strict";
import { eras } from "../src/history.js";

test("six unique chronological sections have valid anchor IDs", () => {
  assert.equal(eras.length, 6);
  assert.equal(new Set(eras.map((era) => era.id)).size, 6);
  assert.deepEqual(
    eras.map((era) => era.id),
    [
      "beginnings",
      "ancient",
      "classical",
      "medieval",
      "early-modern",
      "modern",
    ],
  );
  for (const era of eras) assert.match(era.id, /^[a-z]+(?:-[a-z]+)*$/);
});

test("every highlight is at most thirty words with a full story", () => {
  for (const era of eras) {
    assert.ok(era.summary.trim().split(/\s+/u).length <= 30, era.id);
    assert.equal(era.story.length, 3);
    assert.ok(
      era.story.every((paragraph) => paragraph.length > 100),
      era.id,
    );
    for (const field of ["name", "period", "shortDate", "title", "alt"])
      assert.ok(era[field], `${era.id}: ${field}`);
  }
});

test("all images and further reading links use HTTPS", () => {
  for (const era of eras) {
    assert.equal(new URL(era.image).protocol, "https:");
    assert.equal(new URL(era.source).hostname, "www.britannica.com");
  }
});
