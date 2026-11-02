import { beforeEach, describe, expect, it } from "vitest";
import { store, type Session } from "./speakcoach";
import { vocabStore } from "./vocab";

const session = { id: "s-1" } as Session;

describe("store.claimForUser", () => {
  beforeEach(() => {
    store.claimForUser("reset-a");
    store.claimForUser("reset-b");
    store.setProfile({ name: "" });
  });
  it("keeps data for the same user", () => {
    store.claimForUser("a");
    store.setSessions([session]);
    store.claimForUser("a");
    expect(store.get().sessions).toEqual([session]);
  });
  it("wipes history and profile when another account signs in", () => {
    store.claimForUser("a");
    store.setSessions([session]);
    store.setProfile({ name: "First Person", goal: "sales" });
    store.claimForUser("b");
    expect(store.get().sessions).toEqual([]);
    expect(store.get().profile.name).toBe("");
    expect(store.get().profile.goal).toBeNull();
    expect(store.get().ownerId).toBe("b");
  });
  it("keeps the owner through a reset", () => {
    store.claimForUser("a");
    store.reset();
    expect(store.get().ownerId).toBe("a");
  });
});

describe("store.toggleFavorite", () => {
  it("adds and removes a scenario", () => {
    store.claimForUser("favourites-user");
    expect(store.toggleFavorite("int-1")).toBe(true);
    expect(store.get().profile.favoriteScenarios).toEqual(["int-1"]);
    expect(store.toggleFavorite("int-1")).toBe(false);
    expect(store.get().profile.favoriteScenarios).toEqual([]);
  });
});

describe("vocabStore.claimForUser", () => {
  it("adopts ownerless progress but wipes another account's", () => {
    vocabStore.setSettings({ dailyGoal: 9 });
    vocabStore.claimForUser("a");
    expect(vocabStore.get().dailyGoal).toBe(9);
    vocabStore.claimForUser("b");
    expect(vocabStore.get().dailyGoal).toBe(5);
    expect(vocabStore.get().ownerId).toBe("b");
  });
});
