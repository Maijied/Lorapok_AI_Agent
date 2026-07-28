# Terminal UI & UX Design Standards

## Principles
1. **Rich Aesthetics**: First impressions matter! Use formatted banners, styled borders (`boxen`), and colored highlights (`chalk`).
2. **Dynamic Feedback**: Show spinners (`ora`) during async tasks like fetching LLM responses or running git commands.
3. **Non-Interactive CI Safety**: Check `process.stdout.isTTY` or environment flags before launching `enquirer` prompts or terminal animations.
4. **Markdown Rendering**: Render AI responses in terminal using `marked` and `marked-terminal`.
5. **Theme Support**: Standardize color codes (Cyan/Magenta/Green for primary actions, Red for errors, Yellow for warnings).
