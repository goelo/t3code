import { describe, expect, it } from "vite-plus/test";

import { desktopT, localizeMenuRoles, setDesktopLanguage } from "./i18n.ts";

describe("desktop language", () => {
  it("switches native labels without translating user values or changing menu actions", () => {
    const click = () => undefined;
    const template = [
      { role: "copy" as const, accelerator: "CmdOrCtrl+C", click },
      { label: "My project", submenu: [{ role: "quit" as const }] },
    ];
    setDesktopLanguage("zh", ["en-US"]);
    const translated = localizeMenuRoles(template);
    expect(translated[0]).toMatchObject({ label: "复制", accelerator: "CmdOrCtrl+C", click });
    expect(translated[1]?.label).toBe("My project");
    expect(desktopT("About {value0}", { value0: "My project" })).toBe("关于 My project");
    expect(template[0]).not.toHaveProperty("label");

    setDesktopLanguage("en", ["zh-CN"]);
    expect(localizeMenuRoles(template)[0]?.label).toBe("Copy");
    expect(desktopT("About {value0}", { value0: "My project" })).toBe("About My project");
  });

  it("resolves system language through the existing locale matcher", () => {
    setDesktopLanguage("system", ["zh-CN", "en-US"]);
    expect(desktopT("Settings...")).toBe("设置…");
    setDesktopLanguage("system", ["en-US"]);
    expect(desktopT("Settings...")).toBe("Settings...");
  });
});
