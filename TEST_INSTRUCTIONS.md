# 🧪 How to Test Lorapok UI Polish

## 1. Quick Start
Run the following command to start the agent in Docker:
```bash
npm run update && lorapok
```

## 2. Verify Branding
- Check the startup animation (larva should move).
- Verify the header says **LORAPOK CLI 🐛**.
- Check the footer contains model name (e.g., `🧠 Using sonar`).

## 3. Verify Identity
Type:
```
who are you
```
Expected: "I'm 🐛 Lorapok..." (Instant response, no API call).

## 4. Verify Logs
Type:
```
/logs
```
Expected: A professional table with Time, Level, and Message columns.

## 5. Verify File Navigation
Type:
```
@
```
Expected: A menu to select files/folders. Select a folder to drill down. Select `..` to go back.

## 6. Verify Exit Summary
Type:
```
exit
```
Expected: A boxed "SESSION RECAP" with token usage stats.
