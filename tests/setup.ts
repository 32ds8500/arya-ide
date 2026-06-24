import { vi, beforeEach, afterEach } from "vitest";

vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test_db");

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
