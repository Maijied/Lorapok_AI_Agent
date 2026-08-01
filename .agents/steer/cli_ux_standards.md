# Terminal UI & UX Design Standards

## Principles
1. **Rich Aesthetics**: First impressions matter! Use formatted banners, styled borders (`boxen`), and colored highlights (`chalk`).
2. **Dynamic Feedback**: Show spinners (`ora`) during async tasks like fetching LLM responses or running git commands.
3. **Non-Interactive CI Safety**: Check `process.stdout.isTTY` or environment flags before launching `enquirer` prompts or terminal animations.
4. **Markdown Rendering**: Render AI responses in terminal using `marked` and `marked-terminal`.
5. **Theme Support**: Use `lib/theme.js` ThemeEngine. Default theme is **Lorapok** (Labs Bible: `#00ff88` / `#00e5ff`). Themes must restyle header, REPL prompt, menus, boxes, and spinners—not only figlet.
6. **Model Metrics & UI**: Display model token limits, capacity usage, provider status icons, and fallback notifications using theme-aware `boxen` cards via `ActiveModelService`.
7. **Workspace**: Central `~/.lorapok` + optional project `.lorapok/` onboarding after header.
